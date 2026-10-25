import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { ChatView, type Pending } from "./chat";
import { CHATS, CONNECTORS, DEFAULT_MODEL, MODELS, PRESET_TASKS, TASKS, replyTo, type Chat, type View } from "./data";
import { Sidebar } from "./sidebar";
import { ConnectorsView, DownloadedView, StoreView, type Download } from "./store";
import { TasksView } from "./tasks";
import { FONT, MAIN, TEXT, TOOL } from "./ui";

// A ModelCraft window drawn in HTML that works like the app, within limits: chat with prepared
// replies, the Model Store with downloads, Connectors, Downloaded Models and Scheduled Tasks. Nothing
// leaves the page, and a reload starts over.

const TABS: { view: View; label: string }[] = [
    { view: "chat", label: "modelcraft.demo_chat" },
    { view: "store", label: "modelcraft.model_store" },
    { view: "connectors", label: "modelcraft.demo_connectors" },
    { view: "tasks", label: "modelcraft.scheduled_tasks" },
];

const DOWNLOAD_MS = 2400;
const THINK_MS = 700;
const TOOL_MS = 1000;
const RUN_MS = 1600;

export function ModelCraftDemo({ className }: { className?: string }) {
    const { t } = useTranslation();
    const [view, setView] = useState<View>("chat");
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
    const [sidebar, setSidebar] = useState<boolean | null>(null);

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

    // Moves a reply through thinking, using a connector and typing, then files it in its conversation.
    useEffect(() => {
        if (!pending) return;
        const { phase, message, shown, chatId: id } = pending;
        if (phase === "typing" && shown >= message.text.length) {
            setChats((cs) => cs.map((c) => (c.id === id ? { ...c, messages: [...c.messages, message] } : c)));
            setPending(null);
            return;
        }
        const timer = setTimeout(() => setPending((p) => p && (
            phase === "thinking" ? { ...p, phase: message.tool ? "tool" : "typing" }
                : phase === "tool" ? { ...p, phase: "typing" }
                    : { ...p, shown: p.shown + 3 }
        )), phase === "thinking" ? THINK_MS : phase === "tool" ? TOOL_MS : 16);
        return () => clearTimeout(timer);
    }, [pending]);

    const go = (v: View, id: string | null = chatId) => {
        setTouched(true);
        setChatId(id);
        setView(v);
        // On a narrow screen the sidebar covers the window, so going somewhere puts it away.
        if (!matchMedia("(min-width: 640px)").matches) setSidebar(null);
    };
    const open = (v: View) => go(v, v === "chat" && chatId === null && chats.length ? chats[0].id : chatId);

    const send = (text: string) => {
        if (pending) return;
        setTouched(true);
        let id = chatId;
        if (id === null) {
            id = `chat-${Date.now()}`;
            const chat: Chat = { id, title: text.length > 40 ? `${text.slice(0, 38)}…` : text, messages: [] };
            setChats((cs) => [chat, ...cs]);
            setChatId(id);
        }
        const target = id;
        setChats((cs) => cs.map((c) => (c.id === target ? { ...c, messages: [...c.messages, { role: "user", text }] } : c)));
        setPending({ chatId: target, message: replyTo(text, installed), phase: "thinking", shown: 0 });
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
        const reply = replyTo(task.prompt, installed);
        setTimeout(() => {
            const chat: Chat = { id: `run-${id}-${Date.now()}`, title: task.title, messages: [{ role: "user", text: task.prompt }, reply] };
            setChats((cs) => [chat, ...cs]);
            setRuns((r) => ({ ...r, [id]: chat.id }));
            setRunning((r) => r.filter((x) => x !== id));
        }, RUN_MS);
    };

    const nextPreset = PRESET_TASKS.find((p) => !tasks.some((x) => x.id === p.id));
    const chat = view === "chat" && chatId ? chats.find((c) => c.id === chatId) ?? null : null;
    const sidebarButton = sidebar !== true && (
        <button
            type="button"
            aria-label="Show Sidebar"
            title="Show Sidebar"
            className={cn(TOOL, sidebar === null && "sm:hidden")}
            onClick={() => setSidebar(true)}
        >
            <SFSymbol name="sidebar.left" className="h-3.5 w-[18px]" />
        </button>
    );

    return (
        <div className={className}>
            <div
                className="relative flex h-[min(640px,80vh)] w-full overflow-hidden rounded-[18px] border border-black/12 text-left shadow-[0_24px_70px_-20px_rgb(0_0_0/0.35)] dark:border-white/12"
                style={{ fontFamily: FONT }}
            >
                <Sidebar
                    view={view}
                    chatId={chatId}
                    chats={chats}
                    hint={!touched}
                    className={cn(
                        "absolute inset-y-0 left-0 z-30 transition-transform duration-200 sm:static",
                        sidebar === null ? "-translate-x-full sm:translate-x-0" : sidebar ? "translate-x-0 shadow-xl sm:shadow-none" : "-translate-x-full sm:hidden",
                    )}
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

            <div className="mt-6 flex flex-col items-center gap-3">
                <div role="tablist" className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-border bg-card p-1 shadow-card">
                    {TABS.map((tab) => (
                        <button
                            key={tab.view}
                            type="button"
                            role="tab"
                            aria-selected={tab.view === view}
                            className={cn(
                                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                                tab.view === view ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => open(tab.view)}
                        >
                            {t(tab.label)}
                        </button>
                    ))}
                </div>
                <p className="text-center text-[13px] text-faint">{t("modelcraft.demo_hint")}</p>
            </div>
        </div>
    );
}
