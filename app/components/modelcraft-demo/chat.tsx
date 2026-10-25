import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

import { ProductIcon } from "~/components/product-icon";
import { SFSymbol, type SymbolName } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { CONNECTOR_NAME, SUGGESTIONS, groupTitle, toolLabel, type Chat, type Message, type Tool } from "./conversations";
import { ACCENT, ACCENT_BG, BAR, BODY, BUBBLE, CAPSULE, CARD, FAINT, MUTED, SMALL, TEXT, TITLE, TOOL_ITEM } from "./ui";

/** A reply on its way: thinking, then running its tool calls one `step` at a time, then typing out `shown` characters. */
export type Pending = { chatId: string; message: Message; phase: "thinking" | "tool" | "typing"; step: number; shown: number };

export function ChatView({ chat, pending, model, models, focus, sidebarButton, onSend, onPickModel, onNewChat }: {
    /** Null for a new chat. */
    chat: Chat | null;
    pending: Pending | null;
    model: string;
    models: string[];
    /** Puts the cursor in the message field; off until the visitor uses the window, so loading the page doesn't. */
    focus: boolean;
    sidebarButton: ReactNode;
    onSend: (text: string) => void;
    onPickModel: (name: string) => void;
    onNewChat: () => void;
}) {
    const scroller = useRef<HTMLDivElement>(null);
    const reply = pending && chat && pending.chatId === chat.id ? pending : null;

    useEffect(() => {
        const el = scroller.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [chat?.id, chat?.messages.length, reply?.shown, reply?.phase, reply?.step]);

    const composer = (
        <Composer model={model} models={models} busy={pending !== null} autoFocus={focus} onSend={onSend} onPickModel={onPickModel} />
    );

    return (
        <div className="flex h-full flex-col">
            <header className={BAR}>
                {sidebarButton}
                <h4 className={cn("min-w-0 flex-1 truncate", TITLE)}>{chat?.title ?? "New Chat"}</h4>
                <div className={cn(CAPSULE, "gap-1 px-1")}>
                    <button type="button" aria-label="New Chat" title="New Chat" className={TOOL_ITEM} onClick={onNewChat}>
                        <SFSymbol name="square.and.pencil" className="size-4" />
                    </button>
                    <span className="flex size-7 items-center justify-center"><SFSymbol name="ellipsis" className="w-4" /></span>
                </div>
            </header>

            {chat === null ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
                    <h3 className="mb-6 text-center text-[26px] font-bold tracking-[-0.01em]">How can I help you today?</h3>
                    <div className="w-full max-w-[640px]">{composer}</div>
                    <div className="mt-4 flex max-w-[640px] flex-wrap justify-center gap-2">
                        {SUGGESTIONS.map((s) => (
                            <button
                                key={s}
                                type="button"
                                disabled={pending !== null}
                                className={cn("rounded-full border border-black/8 px-3 py-1.5 transition-colors hover:border-[#b4581f]/50 dark:border-white/10", CARD, SMALL, MUTED)}
                                onClick={() => onSend(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div ref={scroller} className={cn("min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-4", BODY)}>
                        {chat.messages.map((m, i) => <MessageView key={i} message={m} />)}
                        {reply && <MessageView message={reply.message} phase={reply.phase} step={reply.step} shown={reply.shown} />}
                    </div>
                    <div className="px-3 pb-3">{composer}</div>
                </>
            )}
        </div>
    );
}

function MessageView({ message, phase, step, shown }: { message: Message; phase?: Pending["phase"]; step?: number; shown?: number }) {
    if (message.role === "user") {
        return (
            <div className="mb-6 flex justify-end">
                <p className={cn("max-w-[80%] rounded-2xl px-3.5 py-2.5 whitespace-pre-wrap", BUBBLE)}>{message.text}</p>
            </div>
        );
    }
    if (phase === "thinking") return <p className={cn("mb-6 motion-safe:animate-pulse", MUTED)}>Thinking…</p>;
    const text = shown === undefined ? message.text : message.text.slice(0, shown);
    return (
        <div className="mb-6">
            {message.tools && <ToolGroup tools={message.tools} running={phase === "tool" ? step ?? 0 : undefined} />}
            {phase !== "tool" && <Rich text={text} />}
        </div>
    );
}

/** A reply's tool calls (ToolCallGroupView): a summary that opens to one row per call. */
function ToolGroup({ tools, running }: { tools: Tool[]; /** The call in progress, while the reply is still working. */ running?: number }) {
    const [open, setOpen] = useState(false);
    const shown = running === undefined ? tools : tools.slice(0, running + 1);
    return (
        <div className="mb-3">
            <button type="button" aria-expanded={open} className={cn("flex items-center gap-1.5 text-left font-medium hover:text-[#1c1c1c] dark:hover:text-[#f2f3f0]", MUTED)} onClick={() => setOpen((o) => !o)}>
                <SFSymbol name="chevron.right" className={cn("size-2.5 shrink-0 transition-transform", open && "rotate-90")} />
                <span className={running !== undefined ? "motion-safe:animate-pulse" : undefined}>
                    {running !== undefined ? `${toolLabel(tools[running], true)}…` : groupTitle(tools)}
                </span>
            </button>
            {open && (
                <div className="mt-2 ml-1 flex flex-col gap-2 border-l border-black/10 pl-4 motion-safe:animate-in motion-safe:fade-in dark:border-white/10">
                    {shown.map((t, i) => <ToolRow key={i} tool={t} running={i === running} />)}
                </div>
            )}
        </div>
    );
}

const NATIVE_ICON: Record<Tool["kind"], SymbolName> = { connector: "app.connected.to.app.below.fill", native: "calendar", command: "terminal", fetch: "network", file: "doc.text.magnifyingglass" };

/** One call: its icon and what it did, opening to what it sent and got back. */
function ToolRow({ tool, running }: { tool: Tool; running: boolean }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={SMALL}>
            <button type="button" aria-expanded={open} disabled={running} className={cn("flex items-center gap-2 text-left", MUTED, !running && "hover:text-[#1c1c1c] dark:hover:text-[#f2f3f0]")} onClick={() => setOpen((o) => !o)}>
                {tool.kind === "connector" ? (
                    <ProductIcon id={tool.app} className="size-4 shrink-0" width={16} height={16} />
                ) : (
                    <SFSymbol name={tool.kind === "native" ? tool.icon : NATIVE_ICON[tool.kind]} className="size-3.5 shrink-0" />
                )}
                <span className={running ? "motion-safe:animate-pulse" : undefined}>{toolLabel(tool, running)}</span>
                {!running && <SFSymbol name="chevron.down" className={cn("size-2 shrink-0 transition-transform", !open && "-rotate-90")} />}
            </button>
            {open && !running && <div className="mt-2 motion-safe:animate-in motion-safe:fade-in">{<ToolDetail tool={tool} />}</div>}
        </div>
    );
}

function ToolDetail({ tool }: { tool: Tool }) {
    const block = cn("max-h-48 overflow-auto rounded-lg border border-black/8 p-2.5 font-mono text-[11px] leading-[1.5] whitespace-pre-wrap select-text dark:border-white/10", CARD);
    switch (tool.kind) {
        case "connector":
            return (
                <div className="flex flex-col gap-1.5">
                    <p className={cn("text-[11px]", FAINT)}>{CONNECTOR_NAME[tool.app]} · {tool.name}</p>
                    <pre className={block}>{tool.args}</pre>
                    <p className={cn("text-[11px]", FAINT)}>Result</p>
                    <pre className={block}>{tool.result}</pre>
                </div>
            );
        case "native":
        case "file":
            return (
                <dl className={cn("grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border border-black/8 p-2.5 dark:border-white/10", CARD)}>
                    {tool.card.map(([k, v]) => [<dt key={`${k}:k`} className={FAINT}>{k}</dt>, <dd key={`${k}:v`} className="select-text">{v}</dd>])}
                </dl>
            );
        case "command":
            return (
                <div className="overflow-hidden rounded-lg bg-[#1e1e1e] font-mono text-[11px] leading-[1.5] text-[#e5e5e5] shadow-sm">
                    <div className="flex gap-1.5 px-2.5 py-1.5">
                        <i className="size-2.5 rounded-full bg-[#ff5f57]/70" /><i className="size-2.5 rounded-full bg-[#febc2e]/70" /><i className="size-2.5 rounded-full bg-[#28c840]/70" />
                    </div>
                    <div className="px-2.5 pb-2.5 select-text">
                        <p><span className="font-bold text-[#e8915a]">&gt;</span> {tool.command}</p>
                        <pre className="mt-1 whitespace-pre-wrap text-white/60">{tool.output}</pre>
                    </div>
                </div>
            );
        case "fetch":
            return (
                <div className={cn("rounded-lg border border-black/8 p-2.5 dark:border-white/10", CARD)}>
                    <p className="font-medium">{tool.title}</p>
                    <p className={cn("truncate text-[11px]", ACCENT)}>{tool.url}</p>
                    <p className={cn("mt-1.5 whitespace-pre-wrap", MUTED)}>{tool.excerpt}</p>
                </div>
            );
    }
}

/** Paragraphs, "- " bullets and "1. " numbered items, with **bold**. */
function Rich({ text }: { text: string }) {
    return (
        <div className="flex flex-col gap-2">
            {text.split("\n").map((line, i) => {
                const bullet = line.match(/^- (.*)/);
                const numbered = line.match(/^(\d+)\. (.*)/);
                if (bullet || numbered) {
                    return (
                        <p key={i} className="flex pl-1">
                            <span className="w-5 shrink-0">{numbered ? `${numbered[1]}.` : "•"}</span>
                            <span>{inline(numbered ? numbered[2] : bullet![1])}</span>
                        </p>
                    );
                }
                return <p key={i}>{inline(line)}</p>;
            })}
        </div>
    );
}

/** Bold runs and `code`, including one still being typed out. */
function inline(text: string): ReactNode {
    return text.split(/(\*\*[^*]+(?:\*\*|$)|`[^`]+`?)/).map((part, i) =>
        part.startsWith("**") ? <b key={i} className="font-semibold">{part.replace(/\*+/g, "")}</b>
            : part.startsWith("`") ? <code key={i} className="rounded-[4px] bg-black/6 px-1 py-px font-mono text-[0.9em] dark:bg-white/10">{part.replace(/`/g, "")}</code>
                : <Fragment key={i}>{part}</Fragment>,
    );
}

function Composer({ model, models, busy, autoFocus, onSend, onPickModel }: {
    model: string;
    models: string[];
    busy: boolean;
    autoFocus: boolean;
    onSend: (text: string) => void;
    onPickModel: (name: string) => void;
}) {
    const [text, setText] = useState("");
    const [picking, setPicking] = useState(false);
    const field = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (autoFocus) field.current?.focus({ preventScroll: true });
    }, [autoFocus]);

    const send = () => {
        const value = text.trim();
        if (!value || busy) return;
        onSend(value);
        setText("");
    };

    return (
        <div className={cn("rounded-2xl px-3.5 pt-3 pb-2.5 shadow-[0_1px_3px_rgb(0_0_0/0.06)]", CARD)}>
            <textarea
                ref={field}
                rows={2}
                value={text}
                placeholder="Type Anything"
                aria-label="Message"
                className={cn("block w-full resize-none bg-transparent outline-none placeholder:text-[#a8a6a4] dark:placeholder:text-[#77757a]", BODY, TEXT)}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        send();
                    }
                }}
            />
            <div className="flex items-center gap-3">
                <SFSymbol name="plus" className={cn("size-3.5", MUTED)} />
                <div className="relative ml-auto min-w-0">
                    <button type="button" className={cn("flex max-w-full items-center gap-1 text-[13px]", ACCENT)} onClick={() => setPicking((p) => !p)}>
                        <SFSymbol name="chevron.down" className="size-2.5 shrink-0" />
                        <span className="truncate">{model}</span>
                    </button>
                    {picking && (
                        <div className={cn("absolute right-0 bottom-7 z-10 min-w-[240px] rounded-xl p-1 shadow-[0_8px_30px_rgb(0_0_0/0.18)] motion-safe:animate-in motion-safe:fade-in", CARD, SMALL)}>
                            <p className={cn("px-2.5 py-1.5", FAINT)}>Downloaded Models</p>
                            {models.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left hover:bg-[#b4581f]/10", TEXT)}
                                    onClick={() => {
                                        onPickModel(m);
                                        setPicking(false);
                                    }}
                                >
                                    <SFSymbol name="checkmark" className={cn("size-3", m === model ? ACCENT : "invisible")} />
                                    {m}
                                </button>
                            ))}
                            {models.length === 1 && <p className={cn("px-2.5 py-1.5", FAINT)}>Download more in the Model Store.</p>}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    aria-label={text.trim() ? "Send" : "Voice"}
                    className={cn("flex size-7 shrink-0 items-center justify-center rounded-full transition-opacity", ACCENT_BG, busy && "opacity-50")}
                    onClick={send}
                >
                    {text.trim() ? <SFSymbol name="arrow.up" className="size-3.5" /> : <SFSymbol name="waveform" className="size-3.5" />}
                </button>
            </div>
        </div>
    );
}
