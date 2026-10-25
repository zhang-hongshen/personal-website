import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "~/lib/utils";
import modelStoreLight from "~/assets/modelcraft/model_store_light.webp";
import modelStoreDark from "~/assets/modelcraft/model_store_dark.webp";
import connectorsLight from "~/assets/modelcraft/connectors_light.webp";
import connectorsDark from "~/assets/modelcraft/connectors_dark.webp";
import scheduledTasksLight from "~/assets/modelcraft/scheduled_tasks_light.webp";
import scheduledTasksDark from "~/assets/modelcraft/scheduled_tasks_dark.webp";
import { ChatView, type Pending } from "./chat";
import { CHATS, CONNECTORS, DEFAULT_MODEL, MODELS, PRESET_TASKS, TASKS, replyTo, type Chat, type View } from "./data";
import { Sidebar } from "./sidebar";
import { ConnectorsOverlay, DownloadedView, StoreOverlay } from "./store";
import { TasksView } from "./tasks";
import { rect } from "./ui";

// A ModelCraft window that works like the app, within limits. The window's frame comes from the
// screenshots; the sidebar, chat, Scheduled Tasks and Downloaded Models are drawn in HTML over it, and
// the Model Store and Connectors keep their screenshots with buttons laid over the app's own. Nothing
// leaves the page: replies are prepared in data.ts, and a reload starts over.

/** The screenshot under each view; views drawn in HTML cover all of it but the frame. */
const BASE: { light: string; dark: string; alt: string; views: View[] }[] = [
    { light: scheduledTasksLight, dark: scheduledTasksDark, alt: "ModelCraft", views: ["chat", "downloaded", "tasks"] },
    { light: modelStoreLight, dark: modelStoreDark, alt: "ModelCraft Model Store", views: ["store"] },
    { light: connectorsLight, dark: connectorsDark, alt: "ModelCraft Connectors", views: ["connectors"] },
];

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
    const [model, setModel] = useState(DEFAULT_MODEL.name);
    // Download progress from 0 to 1 by model name; `downloaded` keeps the finished ones in order.
    const [downloads, setDownloads] = useState<Record<string, number>>({});
    const [downloaded, setDownloaded] = useState<string[]>([]);
    const started = useRef<Record<string, number>>({});
    const [installed, setInstalled] = useState(() => Object.fromEntries(CONNECTORS.map((c) => [c.name, c.installed])));
    const [tasks, setTasks] = useState(TASKS);
    const [running, setRunning] = useState<string[]>([]);
    // The conversation each task's latest run made, by task id.
    const [runs, setRuns] = useState<Record<string, string>>({});

    const downloading = Object.values(downloads).some((p) => p < 1);
    useEffect(() => {
        if (!downloading) return;
        let frame = requestAnimationFrame(function tick(now) {
            const done: string[] = [];
            const next: Record<string, number> = {};
            for (const [name, start] of Object.entries(started.current)) {
                next[name] = Math.min(1, (now - start) / DOWNLOAD_MS);
                if (next[name] === 1) {
                    done.push(name);
                    delete started.current[name];
                }
            }
            setDownloads((d) => ({ ...d, ...next }));
            if (done.length) setDownloaded((d) => [...d, ...done]);
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

    const open = (v: View) => {
        setTouched(true);
        if (v === "chat" && view !== "chat" && chatId === null && chats.length) setChatId(chats[0].id);
        setView(v);
    };
    const openChat = (id: string) => {
        setTouched(true);
        setChatId(id);
        setView("chat");
    };
    const newChat = () => {
        setTouched(true);
        setChatId(null);
        setView("chat");
    };

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
        if (name in downloads) return;
        started.current[name] = performance.now();
        setDownloads((d) => ({ ...d, [name]: 0 }));
    };

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
    const models = [DEFAULT_MODEL, ...downloaded.map((name) => MODELS.find((m) => m.name === name)!)];
    const chat = view === "chat" && chatId ? chats.find((c) => c.id === chatId) ?? null : null;

    return (
        <div className={className}>
            <div
                className="relative aspect-[2400/1374] w-full text-left select-none [container-type:inline-size]"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", system-ui, sans-serif' }}
            >
                {BASE.map((b, i) => {
                    const shown = b.views.includes(view);
                    return (
                        <div key={b.alt} aria-hidden={!shown} className={cn("absolute inset-0 transition-opacity duration-300", shown ? "opacity-100" : "pointer-events-none opacity-0")}>
                            <img className="only-light size-full object-cover object-top" src={b.light} alt={b.alt} width={2400} height={1374} loading={i === 0 ? undefined : "lazy"} draggable={false} />
                            <img className="only-dark size-full object-cover object-top" src={b.dark} alt={b.alt} width={2400} height={1374} loading="lazy" draggable={false} />
                        </div>
                    );
                })}

                {view === "store" && <StoreOverlay downloads={downloads} onDownload={download} />}
                {view === "connectors" && (
                    <ConnectorsOverlay installed={installed} onToggle={(name) => { setTouched(true); setInstalled((s) => ({ ...s, [name]: !s[name] })); }} />
                )}

                <div className="absolute select-text" style={rect(344, 52, 1570, 990)} hidden={!["chat", "downloaded", "tasks"].includes(view)}>
                    {view === "chat" && (
                        <ChatView
                            chat={chat}
                            pending={pending}
                            model={model}
                            models={models.map((m) => m.name)}
                            focus={touched}
                            onSend={send}
                            onPickModel={setModel}
                            onNewChat={newChat}
                        />
                    )}
                    {view === "downloaded" && <DownloadedView models={models} current={model} onPick={(name) => { setModel(name); setView("chat"); }} />}
                    {view === "tasks" && (
                        <TasksView
                            tasks={tasks}
                            canAdd={nextPreset !== undefined}
                            running={running}
                            ran={Object.keys(runs)}
                            onAdd={() => {
                                setTouched(true);
                                if (nextPreset) setTasks((ts) => [...ts, nextPreset]);
                            }}
                            onToggle={(id) => setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)))}
                            onRun={runTask}
                            onOpenRun={(id) => openChat(runs[id])}
                        />
                    )}
                </div>

                <Sidebar view={view} chatId={chatId} chats={chats} hint={!touched} onOpen={open} onOpenChat={openChat} onNewChat={newChat} />
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
                <p className="text-[13px] text-faint">{t("modelcraft.demo_hint")}</p>
            </div>
        </div>
    );
}
