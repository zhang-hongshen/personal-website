import { ArrowUp, AudioLines, Check, ChevronDown, ChevronRight, Ellipsis, Plus, SquarePen } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "~/lib/utils";
import { SUGGESTIONS, type Chat, type Message } from "./data";
import { ACCENT, ACCENT_BG, BODY, BUBBLE, CARD, FAINT, MAIN, MUTED, SMALL, TEXT, TITLE, u } from "./ui";

/** A reply on its way: thinking, then using a connector, then typing out `shown` characters. */
export type Pending = { chatId: string; message: Message; phase: "thinking" | "tool" | "typing"; shown: number };

export function ChatView({ chat, pending, model, models, focus, onSend, onPickModel, onNewChat }: {
    /** Null for a new chat. */
    chat: Chat | null;
    /** Puts the cursor in the message field; off until the visitor uses the window, so loading the page doesn't. */
    focus: boolean;
    pending: Pending | null;
    model: string;
    models: string[];
    onSend: (text: string) => void;
    onPickModel: (name: string) => void;
    onNewChat: () => void;
}) {
    const scroller = useRef<HTMLDivElement>(null);
    const reply = pending && chat && pending.chatId === chat.id ? pending : null;

    useEffect(() => {
        const el = scroller.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [chat?.id, chat?.messages.length, reply?.shown, reply?.phase]);

    const composer = (
        <Composer model={model} models={models} busy={pending !== null} autoFocus={focus} onSend={onSend} onPickModel={onPickModel} />
    );

    return (
        <div className={cn("absolute inset-0", MAIN, TEXT)}>
            <p className={cn("absolute", TITLE)} style={{ left: u(25), top: u(18) }}>{chat?.title ?? "New Chat"}</p>
            <div className={cn("absolute flex items-center", MUTED)} style={{ right: u(14), top: u(10), gap: u(8) }}>
                <button type="button" aria-label="New Chat" className={cn("flex items-center justify-center rounded-full", CARD)} style={{ width: u(44), height: u(44) }} onClick={onNewChat}>
                    <SquarePen style={{ width: u(22), height: u(22) }} strokeWidth={1.8} />
                </button>
                <Ellipsis style={{ width: u(26), height: u(26) }} />
            </div>

            {chat === null ? (
                <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: u(330) }}>
                    <h3 className="text-[2.1cqw] font-bold tracking-[-0.01em]" style={{ marginBottom: u(40) }}>How can I help you today?</h3>
                    <div style={{ width: u(1200) }}>{composer}</div>
                    <div className="flex flex-wrap justify-center" style={{ gap: u(10), marginTop: u(24) }}>
                        {SUGGESTIONS.map((s) => (
                            <button
                                key={s}
                                type="button"
                                disabled={pending !== null}
                                className={cn("rounded-full border border-black/8 transition-colors hover:border-[#a95f2f]/50 dark:border-white/10", CARD, SMALL, MUTED)}
                                style={{ padding: `${u(8)} ${u(16)}` }}
                                onClick={() => onSend(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div ref={scroller} className={cn("absolute inset-x-0 overflow-y-auto", BODY)} style={{ top: u(80), bottom: u(140), padding: `${u(10)} ${u(30)}` }}>
                        {chat.messages.map((m, i) => <MessageView key={i} message={m} />)}
                        {reply && <MessageView message={reply.message} phase={reply.phase} shown={reply.shown} />}
                    </div>
                    <div className="absolute" style={{ left: u(20), right: u(8), bottom: u(14) }}>{composer}</div>
                </>
            )}
        </div>
    );
}

function MessageView({ message, phase, shown }: { message: Message; phase?: Pending["phase"]; shown?: number }) {
    if (message.role === "user") {
        return (
            <div className="flex justify-end" style={{ marginBottom: u(40) }}>
                <p className={cn("max-w-[75%] whitespace-pre-wrap", BUBBLE)} style={{ padding: `${u(16)} ${u(20)}`, borderRadius: u(16) }}>
                    {message.text}
                </p>
            </div>
        );
    }
    if (phase === "thinking") {
        return <p className={cn("motion-safe:animate-pulse", MUTED)} style={{ marginBottom: u(40) }}>Thinking…</p>;
    }
    const text = shown === undefined ? message.text : message.text.slice(0, shown);
    return (
        <div style={{ marginBottom: u(40) }}>
            {message.tool && (
                <p className={cn("flex items-center", MUTED)} style={{ gap: u(8), marginBottom: u(10) }}>
                    <ChevronRight style={{ width: u(16), height: u(16) }} />
                    <span className={phase === "tool" ? "motion-safe:animate-pulse" : undefined}>
                        {phase === "tool" ? `Using ${message.tool}…` : `Used ${message.tool}`}
                    </span>
                </p>
            )}
            {phase !== "tool" && <Rich text={text} />}
        </div>
    );
}

/** Paragraphs, "- " bullets and "1. " numbered items, with **bold**. */
function Rich({ text }: { text: string }) {
    return (
        <div className="flex flex-col" style={{ gap: u(12) }}>
            {text.split("\n").map((line, i) => {
                const bullet = line.match(/^- (.*)/);
                const numbered = line.match(/^(\d+)\. (.*)/);
                if (bullet || numbered) {
                    return (
                        <p key={i} className="flex" style={{ paddingLeft: u(4) }}>
                            <span className="shrink-0" style={{ width: u(26) }}>{numbered ? `${numbered[1]}.` : "•"}</span>
                            <span>{inline(numbered ? numbered[2] : bullet![1])}</span>
                        </p>
                    );
                }
                return <p key={i}>{inline(line)}</p>;
            })}
        </div>
    );
}

/** Bold runs, including one still being typed out. */
function inline(text: string): ReactNode {
    return text.split(/(\*\*[^*]+(?:\*\*|$))/).map((part, i) =>
        part.startsWith("**") ? <b key={i} className="font-semibold">{part.replace(/\*+/g, "")}</b> : <Fragment key={i}>{part}</Fragment>,
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
        <div className={cn("relative shadow-[0_1px_3px_rgb(0_0_0/0.06)]", CARD)} style={{ height: u(106), borderRadius: u(20) }}>
            <textarea
                ref={field}
                rows={1}
                value={text}
                placeholder="Type Anything"
                aria-label="Message"
                className={cn("absolute resize-none bg-transparent outline-none placeholder:text-[#a8a6a4] dark:placeholder:text-[#77757a]", BODY, TEXT)}
                style={{ left: u(20), right: u(20), top: u(16), height: u(40) }}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        send();
                    }
                }}
            />
            <Plus className={cn("absolute", MUTED)} style={{ left: u(22), bottom: u(28), width: u(20), height: u(20) }} />

            <div className="absolute flex items-center" style={{ right: u(20), bottom: u(18), gap: u(16) }}>
                <div className="relative">
                    <button type="button" className={cn("flex items-center", ACCENT, BODY)} style={{ gap: u(4) }} onClick={() => setPicking((p) => !p)}>
                        <ChevronDown style={{ width: u(18), height: u(18) }} />
                        {model}
                    </button>
                    {picking && (
                        <div
                            className={cn("absolute right-0 z-10 shadow-[0_8px_30px_rgb(0_0_0/0.18)] motion-safe:animate-in motion-safe:fade-in", CARD, SMALL)}
                            style={{ bottom: u(40), minWidth: u(320), padding: u(6), borderRadius: u(12) }}
                        >
                            <p className={FAINT} style={{ padding: `${u(6)} ${u(10)}` }}>Downloaded Models</p>
                            {models.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    className={cn("flex w-full items-center rounded-[0.4cqw] text-left hover:bg-[#a95f2f]/10", TEXT)}
                                    style={{ gap: u(8), padding: `${u(7)} ${u(10)}` }}
                                    onClick={() => {
                                        onPickModel(m);
                                        setPicking(false);
                                    }}
                                >
                                    <Check className={m === model ? ACCENT : "invisible"} style={{ width: u(16), height: u(16) }} />
                                    {m}
                                </button>
                            ))}
                            {models.length === 1 && (
                                <p className={FAINT} style={{ padding: `${u(6)} ${u(10)}`, maxWidth: u(320) }}>Download more in the Model Store.</p>
                            )}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    aria-label={text.trim() ? "Send" : "Voice"}
                    className={cn("flex items-center justify-center rounded-full transition-opacity", ACCENT_BG, busy && "opacity-50")}
                    style={{ width: u(36), height: u(36) }}
                    onClick={send}
                >
                    {text.trim() ? <ArrowUp style={{ width: u(20), height: u(20) }} strokeWidth={2.4} /> : <AudioLines style={{ width: u(18), height: u(18) }} />}
                </button>
            </div>
        </div>
    );
}
