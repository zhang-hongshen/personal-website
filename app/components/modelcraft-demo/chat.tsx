import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { SUGGESTIONS, type Chat, type Message } from "./data";
import { ACCENT, ACCENT_BG, BAR, BODY, BUBBLE, CAPSULE, CARD, FAINT, MUTED, SMALL, TEXT, TITLE, TOOL_ITEM } from "./ui";

/** A reply on its way: thinking, then using a connector, then typing out `shown` characters. */
export type Pending = { chatId: string; message: Message; phase: "thinking" | "tool" | "typing"; shown: number };

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
    }, [chat?.id, chat?.messages.length, reply?.shown, reply?.phase]);

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
                        {reply && <MessageView message={reply.message} phase={reply.phase} shown={reply.shown} />}
                    </div>
                    <div className="px-3 pb-3">{composer}</div>
                </>
            )}
        </div>
    );
}

function MessageView({ message, phase, shown }: { message: Message; phase?: Pending["phase"]; shown?: number }) {
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
            {message.tool && (
                <p className={cn("mb-2 flex items-center gap-1.5", SMALL, MUTED)}>
                    <SFSymbol name="chevron.right" className="size-2.5" />
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
