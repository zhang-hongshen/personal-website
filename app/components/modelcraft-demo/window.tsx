import { useCallback, useEffect, useRef, useState } from "react";

import { pick, useLang, useText } from "~/components/demo-text";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { ChatView, type Pending } from "./chat";
import { CHATS, replyTo, type Attachment, type Chat, type Message, type Tool } from "./conversations";
import { CONNECTORS, DEFAULT_MODEL, MODELS, PRESET_TASKS, TASKS, type View } from "./data";
import { Sidebar } from "./sidebar";
import { ConnectorsView, DownloadedView, StoreView, type Download } from "./store";
import { TasksView } from "./tasks";
import { FONT, MAIN, TEXT, TOOL } from "./ui";

// A ModelCraft window drawn in HTML that works like the app, within limits: chat with prepared
// replies, the Model Store with downloads, Connectors, Downloaded Models and Scheduled Tasks. Nothing
// leaves the page, and a reload starts over. What it shows is up to its owner, which also hears about
// each tool call a reply makes.

const DOWNLOAD_MS = 2400;
const THINK_MS = 700;
const TOOL_MS = 900;
const RUN_MS = 1600;
/** Between a stretch of text and the tool calls after it. */
const PAUSE_MS = 400;

export function ModelCraftWindow({ className, view, onView, onCall, onWriting }: {
    className?: string;
    view: View;
    onView: (view: View) => void;
    /** A reply has started a tool call. */
    onCall?: (tool: Tool) => void;
    /** A reply has started writing after its tool calls. */
    onWriting?: () => void;
}) {
    const s = useText();
    const lang = useLang();
    const [chatId, setChatId] = useState<string | null>(CHATS[0].id);
    const [touched, setTouched] = useState(false);
    const [chats, setChats] = useState<Chat[]>(CHATS);
    const [pending, setPending] = useState<Pending | null>(null);
    const [model, setModel] = useState(DEFAULT_MODEL);
    // Downloads by model name; `downloaded` keeps the finished ones in order.
    const [downloads, setDownloads] = useState<Record<string, Download>>({});
    const [downloaded, setDownloaded] = useState<string[]>([DEFAULT_MODEL]);
    const [installed, setInstalled] = useState(() => Object.fromEntries(CONNECTORS.map((c) => [c.name, c.installed])));
    const [tasks, setTasks] = useState(TASKS);
    const [running, setRunning] = useState<string[]>([]);
    // The conversation each task's latest run made, by task id.
    const [runs, setRuns] = useState<Record<string, string>>({});
    // Shown or hidden by the toggle; null until then, which shows it on wide screens only.
    const [sidebar, setSidebar] = useState(true);

    const downloading = Object.values(downloads).some((d) => d.progress < 1 && !d.stopped);
    useEffect(() => {
        if (!downloading) return;
        let last = performance.now();
        let frame = requestAnimationFrame(function tick(now) {
            const step = (now - last) / DOWNLOAD_MS;
            last = now;
            setDownloads((ds) => {
                const next = { ...ds };
                for (const [name, d] of Object.entries(ds)) {
                    if (d.stopped || d.progress >= 1) continue;
                    next[name] = { ...d, progress: Math.min(1, d.progress + step) };
                    if (next[name].progress === 1) setDownloaded((list) => (list.includes(name) ? list : [...list, name]));
                }
                return next;
            });
            frame = requestAnimationFrame(tick);
        });
        return () => cancelAnimationFrame(frame);
    }, [downloading]);

    // Moves a reply through thinking, then each of its parts in turn: tool calls one at a time, text
    // typed out, then files it in its conversation.
    useEffect(() => {
        if (!pending) return;
        const { phase, message, part, step, shown, chatId: id } = pending;
        const current = message.parts[part];
        if (phase === "working" && !current) {
            setChats((cs) => cs.map((c) => (c.id === id ? { ...c, messages: [...c.messages, message] } : c)));
            setPending(null);
            return;
        }
        const next = { part: part + 1, step: 0, shown: 0 };
        const length = current && "text" in current ? pick(lang)(current.text).length : 0;
        const timer = setTimeout(() => setPending((p) => p && (
            phase === "thinking" ? { ...p, phase: "working" }
                : "tools" in current ? (step < current.tools.length - 1 ? { ...p, step: step + 1 } : { ...p, ...next })
                    : shown < length ? { ...p, shown: shown + 3 } : { ...p, ...next }
        )), phase === "thinking" ? THINK_MS
            : "tools" in current ? TOOL_MS
                : shown < length ? 16 : PAUSE_MS);
        return () => clearTimeout(timer);
    }, [pending, lang]);

    // Tells the owner about each tool call, and when text after them starts.
    const listeners = useRef({ onCall, onWriting });
    listeners.current = { onCall, onWriting };
    const working = pending?.phase === "working" ? pending.message.parts[pending.part] : undefined;
    const call = working && "tools" in working ? working.tools[pending!.step] : undefined;
    useEffect(() => {
        if (call) listeners.current.onCall?.(call);
    }, [call]);
    const writing = working && "text" in working && pending!.part > 0 ? pending!.part : undefined;
    useEffect(() => {
        if (writing !== undefined) listeners.current.onWriting?.();
    }, [writing]);

    const go = (v: View, id: string | null = chatId) => {
        setTouched(true);
        setChatId(id);
        onView(v);
    };
    const open = (v: View) => go(v, v === "chat" && chatId === null && chats.length ? chats[0].id : chatId);

    const send = (text: string, files: Attachment[] = []) => {
        if (pending) return;
        setTouched(true);
        let id = chatId;
        if (id === null) {
            id = `chat-${Date.now()}`;
            const title = text || files.map((f) => f.name).join(", ");
            const chat: Chat = { id, title: title.length > 40 ? `${title.slice(0, 38)}…` : title, messages: [] };
            setChats((cs) => [chat, ...cs]);
            setChatId(id);
        }
        const target = id;
        const message: Message = { role: "user", text, ...(files.length ? { attachments: files } : {}) };
        setChats((cs) => cs.map((c) => (c.id === target ? { ...c, messages: [...c.messages, message] } : c)));
        setPending({ chatId: target, message: replyTo(text, installed, lang, files), phase: "thinking", part: 0, step: 0, shown: 0 });
    };

    const download = (name: string) => {
        setTouched(true);
        setDownloads((ds) => ({ ...ds, [name]: ds[name] ? { ...ds[name], stopped: !ds[name].stopped } : { progress: 0, stopped: false } }));
    };
    const deleteModel = (name: string) => {
        setDownloaded((list) => list.filter((m) => m !== name));
        setDownloads(({ [name]: _, ...rest }) => rest);
        if (model === name) setModel(DEFAULT_MODEL);
    };

    const toggleConnector = useCallback((name: string) => {
        setTouched(true);
        setInstalled((s) => ({ ...s, [name]: !s[name] }));
    }, []);

    const runTask = (id: string) => {
        setTouched(true);
        const task = tasks.find((x) => x.id === id);
        if (!task || running.includes(id)) return;
        setRunning((r) => [...r, id]);
        const reply = replyTo(s(task.prompt), installed, lang);
        setTimeout(() => {
            const chat: Chat = { id: `run-${id}-${Date.now()}`, title: task.title, messages: [{ role: "user", text: s(task.prompt) }, reply] };
            setChats((cs) => [chat, ...cs]);
            setRuns((r) => ({ ...r, [id]: chat.id }));
            setRunning((r) => r.filter((x) => x !== id));
        }, RUN_MS);
    };

    const nextPreset = PRESET_TASKS.find((p) => !tasks.some((x) => x.id === p.id));
    const chat = view === "chat" && chatId ? chats.find((c) => c.id === chatId) ?? null : null;
    const sidebarButton = !sidebar && (
        <button
            type="button"
            aria-label={s(["Show Sidebar", "显示边栏", "顯示側邊欄"])}
            title={s(["Show Sidebar", "显示边栏", "顯示側邊欄"])}
            className={TOOL}
            onClick={() => setSidebar(true)}
        >
            <SFSymbol name="sidebar.left" className="h-3.5 w-[18px]" />
        </button>
    );

    return (
        <div className={cn("relative flex w-full overflow-hidden border text-left", className)} style={{ fontFamily: FONT }}>
            <Sidebar
                view={view}
                chatId={chatId}
                chats={chats}
                hint={!touched}
                className={cn(!sidebar && "hidden")}
                onOpen={open}
                onOpenChat={(id) => go("chat", id)}
                onNewChat={() => go("chat", null)}
                onHide={() => setSidebar(false)}
            />

            <main className={cn("relative min-w-0 flex-1 select-text", MAIN, TEXT)}>
                {view === "chat" && (
                    <ChatView
                        chat={chat}
                        pending={pending}
                        model={model}
                        models={downloaded}
                        focus={touched}
                        sidebarButton={sidebarButton}
                        onSend={send}
                        onPickModel={setModel}
                        onNewChat={() => go("chat", null)}
                    />
                )}
                {view === "store" && <StoreView downloads={downloads} sidebarButton={sidebarButton} onDownload={download} />}
                {view === "downloaded" && (
                    <DownloadedView
                        models={downloaded.map((name) => MODELS.find((m) => m.name === name)!)}
                        current={model}
                        sidebarButton={sidebarButton}
                        onPick={(name) => {
                            setModel(name);
                            go("chat", chatId ?? chats[0]?.id ?? null);
                        }}
                        onDelete={deleteModel}
                    />
                )}
                {view === "connectors" && <ConnectorsView installed={installed} sidebarButton={sidebarButton} onToggle={toggleConnector} />}
                {view === "tasks" && (
                    <TasksView
                        tasks={tasks}
                        canAdd={nextPreset !== undefined}
                        running={running}
                        ran={Object.keys(runs)}
                        sidebarButton={sidebarButton}
                        onAdd={() => {
                            setTouched(true);
                            if (nextPreset) setTasks((ts) => [...ts, nextPreset]);
                        }}
                        onToggle={(id) => setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)))}
                        onRun={runTask}
                        onOpenRun={(id) => go("chat", runs[id])}
                    />
                )}
            </main>
        </div>
    );
}
