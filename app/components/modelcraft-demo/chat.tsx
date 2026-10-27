import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { useLang, useText, type L } from "~/components/demo-text";
import { ProductIcon } from "~/components/product-icon";
import { SFSymbol, type SymbolName } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { CONNECTOR_NAME, NATIVE_NAME, SUGGESTIONS, groupTitle, toolLabel, type Attachment, type Chat, type Message, type Part, type Reply, type Tool } from "./conversations";
import { GeneratedImage, GeneratedVideo } from "./media";
import { ACCENT, ACCENT_BG, BAR, BODY, BUBBLE, CAPSULE, CARD, FAINT, MUTED, SMALL, TEXT, TITLE, TOOL_ITEM } from "./ui";

const NEW_CHAT: L = ["New Chat", "新对话", "新對話"];

/**
 * A reply on its way: thinking, then working through its parts. In the part at `part`, tool calls run
 * one `step` at a time and text types out `shown` characters.
 */
export type Pending = { chatId: string; message: Reply; phase: "thinking" | "working"; part: number; step: number; shown: number };

export function ChatView({ chat, pending, model, models, focus, sidebarButton, onSend, onPickModel, onNewChat }: {
    /** Null for a new chat. */
    chat: Chat | null;
    pending: Pending | null;
    model: string;
    models: string[];
    /** Puts the cursor in the message field; off until the visitor uses the window, so loading the page doesn't. */
    focus: boolean;
    sidebarButton: ReactNode;
    onSend: (text: string, files?: Attachment[]) => void;
    onPickModel: (name: string) => void;
    onNewChat: () => void;
}) {
    const s = useText();
    const scroller = useRef<HTMLDivElement>(null);
    const reply = pending && chat && pending.chatId === chat.id ? pending : null;

    useEffect(() => {
        const el = scroller.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [chat?.id, chat?.messages.length, reply?.shown, reply?.phase, reply?.part, reply?.step]);

    const composer = (
        <Composer model={model} models={models} busy={pending !== null} autoFocus={focus} onSend={onSend} onPickModel={onPickModel} />
    );

    return (
        <div className="flex h-full flex-col">
            <header className={BAR}>
                {sidebarButton}
                <h4 className={cn("min-w-0 flex-1 truncate", TITLE)}>{chat ? s(chat.title) : s(NEW_CHAT)}</h4>
                <div className={cn(CAPSULE, "gap-1 px-1")}>
                    <button type="button" aria-label={s(NEW_CHAT)} title={s(NEW_CHAT)} className={TOOL_ITEM} onClick={onNewChat}>
                        <SFSymbol name="square.and.pencil" className="size-4" />
                    </button>
                    <span className="flex size-7 items-center justify-center"><SFSymbol name="ellipsis" className="w-4" /></span>
                </div>
            </header>

            {chat === null ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
                    <h3 className="mb-6 text-center text-[26px] font-bold tracking-[-0.01em]">{s(["How can I help you today?", "今天想让我帮你做什么？", "今天想讓我幫你做什麼？"])}</h3>
                    <div className="w-full max-w-[640px]">{composer}</div>
                    <div className="mt-4 flex max-w-[640px] flex-wrap justify-center gap-2">
                        {SUGGESTIONS.map((suggestion) => (
                            <button
                                key={suggestion[0]}
                                type="button"
                                disabled={pending !== null}
                                className={cn("rounded-full border border-black/8 px-3 py-1.5 transition-colors hover:border-[#b4581f]/50 dark:border-white/10", CARD, SMALL, MUTED)}
                                onClick={() => onSend(s(suggestion))}
                            >
                                {s(suggestion)}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div ref={scroller} className={cn("min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-4", BODY)}>
                        {chat.messages.map((m, i) => <MessageView key={i} message={m} />)}
                        {reply && <MessageView message={reply.message} pending={reply} />}
                    </div>
                    <div className="px-3 pb-3">{composer}</div>
                </>
            )}
        </div>
    );
}

function MessageView({ message, pending }: { message: Message; pending?: Pending }) {
    const s = useText();
    if (message.role === "user") {
        return (
            <div className="mb-6 flex flex-col items-end gap-1.5">
                {message.attachments && (
                    <div className="flex max-w-[80%] flex-wrap justify-end gap-1.5">
                        {message.attachments.map((f, i) => f.url
                            ? <img key={i} src={f.url} alt={f.name} className="max-h-32 max-w-[200px] rounded-xl object-cover shadow-sm" />
                            : <FileChip key={i} file={f} />)}
                    </div>
                )}
                {s(message.text) && <p className={cn("max-w-[80%] rounded-2xl px-3.5 py-2.5 whitespace-pre-wrap", BUBBLE)}>{s(message.text)}</p>}
            </div>
        );
    }
    if (pending?.phase === "thinking") return <p className={cn("mb-6 motion-safe:animate-pulse", MUTED)}>{s(["Thinking…", "正在思考…", "正在思考…"])}</p>;
    // While the reply is on its way, only the parts it has reached show, the last one still going.
    const parts = pending ? message.parts.slice(0, pending.part + 1) : message.parts;
    return (
        <div className="mb-6 flex flex-col gap-3">
            {parts.map((part, i) => <PartView key={i} part={part} step={pending && i === pending.part ? pending.step : undefined} shown={pending && i === pending.part ? pending.shown : undefined} />)}
        </div>
    );
}

/** A run of tool calls, with what the image and video tools made, or a stretch of text. */
function PartView({ part, step, shown }: { part: Part; /** The call in progress, or the characters typed so far, while this part is going. */ step?: number; shown?: number }) {
    const s = useText();
    if ("text" in part) return <Rich text={shown === undefined ? s(part.text) : s(part.text).slice(0, shown)} />;
    // What the image and video tools made shows as soon as each call is done.
    const made = part.tools.slice(0, step).filter((t) => t.kind === "image" || t.kind === "video");
    return (
        <div className="flex flex-col gap-3">
            <ToolGroup tools={part.tools} running={step} />
            {made.map((t, i) => t.kind === "image"
                ? <GeneratedImage key={i} art={t.art} size={t.size} saved={t.saved} />
                : t.kind === "video" && <GeneratedVideo key={i} art={t.art} size={t.size} seconds={t.seconds} saved={t.saved} />)}
        </div>
    );
}

/** A reply's tool calls (ToolCallGroupView): a summary that opens to one row per call. */
function ToolGroup({ tools, running }: { tools: Tool[]; /** The call in progress, while the reply is still working. */ running?: number }) {
    const s = useText();
    const lang = useLang();
    const [open, setOpen] = useState(false);
    const shown = running === undefined ? tools : tools.slice(0, running + 1);
    return (
        <div>
            <button type="button" aria-expanded={open} className={cn("flex items-center gap-1.5 text-left font-medium hover:text-[#1c1c1c] dark:hover:text-[#f2f3f0]", MUTED)} onClick={() => setOpen((o) => !o)}>
                <SFSymbol name="chevron.right" className={cn("size-2.5 shrink-0 transition-transform", open && "rotate-90")} />
                <span className={running !== undefined ? "motion-safe:animate-pulse" : undefined}>
                    {running !== undefined ? `${toolLabel(tools[running], true, s)}…` : groupTitle(tools, lang)}
                </span>
                {running === undefined && <AppIcons tools={tools} />}
            </button>
            {open && (
                <div className="mt-2 ml-1 flex flex-col gap-2 border-l border-black/10 pl-4 motion-safe:animate-in motion-safe:fade-in dark:border-white/10">
                    {shown.map((t, i) => <ToolRow key={i} tool={t} running={i === running} />)}
                </div>
            )}
        </div>
    );
}

/** The apps a reply used, each once, in the order it first used them. */
function AppIcons({ tools }: { tools: Tool[] }) {
    const s = useText();
    const apps = new Map<string, ReactNode>();
    const names = new Map<string, string>();
    for (const t of tools) {
        if (t.kind === "connector" && !apps.has(t.app)) {
            names.set(t.app, CONNECTOR_NAME[t.app]);
            apps.set(t.app, <ProductIcon id={t.app} className="size-4" width={16} height={16} />);
        } else if (t.kind === "native" && !apps.has(t.app)) {
            names.set(t.app, s(NATIVE_NAME[t.app]));
            apps.set(t.app, <span className={cn("flex size-4 items-center justify-center rounded-[4px] bg-black/6 dark:bg-white/10", TEXT)}><SFSymbol name={t.icon} className="size-2.5" /></span>);
        }
    }
    if (apps.size === 0) return null;
    return (
        <span className="ml-0.5 flex items-center gap-0.5" aria-label={[...names.values()].join(s([", ", "、", "、"]))}>
            {[...apps].map(([app, icon]) => <span key={app} title={names.get(app)}>{icon}</span>)}
        </span>
    );
}

const NATIVE_ICON: Record<Tool["kind"], SymbolName> = {
    connector: "app.connected.to.app.below.fill", native: "calendar", command: "terminal", fetch: "network", file: "doc.text.magnifyingglass",
    edit: "square.and.pencil", image: "sparkles", video: "film",
};

/** One call: its icon and what it did, opening to what it sent and got back. */
function ToolRow({ tool, running }: { tool: Tool; running: boolean }) {
    const s = useText();
    const [open, setOpen] = useState(false);
    return (
        <div className={SMALL}>
            <button type="button" aria-expanded={open} disabled={running} className={cn("flex items-center gap-2 text-left", MUTED, !running && "hover:text-[#1c1c1c] dark:hover:text-[#f2f3f0]")} onClick={() => setOpen((o) => !o)}>
                {tool.kind === "connector" ? (
                    <ProductIcon id={tool.app} className="size-4 shrink-0" width={16} height={16} />
                ) : (
                    <SFSymbol name={tool.kind === "native" ? tool.icon : NATIVE_ICON[tool.kind]} className="size-3.5 shrink-0" />
                )}
                <span className={running ? "motion-safe:animate-pulse" : undefined}>{toolLabel(tool, running, s)}</span>
                {!running && <SFSymbol name="chevron.down" className={cn("size-2 shrink-0 transition-transform", !open && "-rotate-90")} />}
            </button>
            {open && !running && <div className="mt-2 motion-safe:animate-in motion-safe:fade-in">{<ToolDetail tool={tool} />}</div>}
        </div>
    );
}

function ToolDetail({ tool }: { tool: Tool }) {
    const s = useText();
    const block = cn("max-h-48 overflow-auto rounded-lg border border-black/8 p-2.5 font-mono text-[11px] leading-[1.5] whitespace-pre-wrap select-text dark:border-white/10", CARD);
    switch (tool.kind) {
        case "connector":
            return (
                <div className="flex flex-col gap-1.5">
                    <p className={cn("flex items-center gap-2 text-[11px]", FAINT)}>
                        <span className="min-w-0 flex-1 truncate">{CONNECTOR_NAME[tool.app]} · {tool.name}</span>
                        <Link to={`/products/${tool.app}/`} className={cn("flex shrink-0 items-center gap-0.5 hover:underline", ACCENT)}>
                            {s([`Open ${CONNECTOR_NAME[tool.app]}`, `打开 ${CONNECTOR_NAME[tool.app]}`, `開啟 ${CONNECTOR_NAME[tool.app]}`])}
                            <SFSymbol name="chevron.right" className="size-2" />
                        </Link>
                    </p>
                    <pre className={block}>{tool.args}</pre>
                    <p className={cn("text-[11px]", FAINT)}>{s(["Result", "结果", "結果"])}</p>
                    <pre className={block}>{tool.result}</pre>
                </div>
            );
        case "native":
        case "file":
            return (
                <dl className={cn("grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border border-black/8 p-2.5 dark:border-white/10", CARD)}>
                    {tool.card.map(([k, v]) => [<dt key={`${k[0]}:k`} className={FAINT}>{s(k)}</dt>, <dd key={`${k[0]}:v`} className="select-text">{s(v)}</dd>])}
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
                        {tool.output && <pre className="mt-1 whitespace-pre-wrap text-white/60">{tool.output}</pre>}
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
        case "edit":
            return (
                <div className="flex flex-col gap-1.5">
                    <p className={cn("truncate font-mono text-[11px]", FAINT)}>{tool.path}</p>
                    <pre className={cn(block, "p-0 py-1.5")}>
                        {tool.diff.split("\n").map((line, i) => (
                            <span
                                key={i}
                                className={cn(
                                    "block px-2.5",
                                    line.startsWith("+") && "bg-[#34c759]/15 text-[#1a7f37] dark:text-[#6fdc8c]",
                                    line.startsWith("-") && "bg-[#ff3b30]/12 text-[#c4271d] dark:text-[#ff8a80]",
                                    line.startsWith("@@") && FAINT,
                                )}
                            >
                                {line || " "}
                            </span>
                        ))}
                    </pre>
                </div>
            );
        case "image":
        case "video":
            return (
                <dl className={cn("grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border border-black/8 p-2.5 dark:border-white/10", CARD)}>
                    <dt className={FAINT}>{s(["Prompt", "提示词", "提示詞"])}</dt><dd className="select-text">{tool.prompt}</dd>
                    <dt className={FAINT}>{s(["Size", "尺寸", "尺寸"])}</dt><dd>{tool.size}{tool.kind === "video" && ` · ${tool.seconds} s`}</dd>
                    <dt className={FAINT}>{s(["Saved to", "保存到", "儲存到"])}</dt><dd className="font-mono text-[11px] select-text">{tool.saved}</dd>
                </dl>
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

const TEXT_FILE = /^text\/|json|xml|javascript|typescript/;
const TEXT_NAME = /\.(md|markdown|txt|csv|tsv|json|ya?ml|toml|ini|log|swift|ts|tsx|js|jsx|py|rb|go|rs|java|c|h|cpp|sh|sql|html|css)$/i;

/** What the page can tell about a file without sending it anywhere: an image's size, a text file's length. */
async function readFile(file: File): Promise<Attachment> {
    const base = { name: file.name, size: file.size, type: file.type };
    if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.src = url;
        try {
            await img.decode();
            return { ...base, url, width: img.naturalWidth, height: img.naturalHeight };
        } catch {
            return { ...base, url };
        }
    }
    if ((TEXT_FILE.test(file.type) || TEXT_NAME.test(file.name)) && file.size < 2 * 1024 * 1024) {
        const text = await file.text();
        const first = text.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
        return { ...base, lines: text.split("\n").length, words: text.split(/\s+/).filter(Boolean).length, first: first.length > 60 ? `${first.slice(0, 58)}…` : first };
    }
    return base;
}

function FileChip({ file, onRemove }: { file: Attachment; onRemove?: () => void }) {
    const s = useText();
    const kb = file.size >= 1024 ** 2 ? `${(file.size / 1024 ** 2).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    return (
        <span className={cn("relative flex max-w-[220px] items-center gap-2 rounded-xl border border-black/8 py-1.5 pr-3 pl-2 dark:border-white/10", CARD, SMALL)}>
            {file.url ? (
                <img src={file.url} alt="" className="size-8 shrink-0 rounded-md object-cover" />
            ) : (
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md bg-[#b4581f]/12", ACCENT)}><SFSymbol name="doc.text" className="size-4" /></span>
            )}
            <span className="min-w-0 leading-tight">
                <span className="block truncate font-medium">{file.name}</span>
                <span className={cn("block", FAINT)}>{kb}</span>
            </span>
            {onRemove && (
                <button type="button" aria-label={s([`Remove ${file.name}`, `移除 ${file.name}`, `移除 ${file.name}`])} className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-[#6d6d6d] text-white" onClick={onRemove}>
                    <SFSymbol name="xmark" className="size-2" />
                </button>
            )}
        </span>
    );
}

function Composer({ model, models, busy, autoFocus, onSend, onPickModel }: {
    model: string;
    models: string[];
    busy: boolean;
    autoFocus: boolean;
    onSend: (text: string, files?: Attachment[]) => void;
    onPickModel: (name: string) => void;
}) {
    const s = useText();
    const [text, setText] = useState("");
    const [files, setFiles] = useState<Attachment[]>([]);
    const [reading, setReading] = useState(0);
    const [dropping, setDropping] = useState(false);
    const [picking, setPicking] = useState(false);
    const field = useRef<HTMLTextAreaElement>(null);
    const picker = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus) field.current?.focus({ preventScroll: true });
    }, [autoFocus]);

    const attach = async (list: FileList | null) => {
        if (!list?.length) return;
        const chosen = [...list];
        setReading((n) => n + chosen.length);
        const read = await Promise.all(chosen.map(readFile));
        setFiles((f) => [...f, ...read]);
        setReading((n) => n - chosen.length);
        field.current?.focus({ preventScroll: true });
    };

    const ready = (text.trim() || files.length) && !reading;
    const send = () => {
        if (!ready || busy) return;
        onSend(text.trim(), files);
        setText("");
        setFiles([]);
    };

    return (
        <div
            className={cn("rounded-2xl px-3.5 pt-3 pb-2.5 shadow-[0_1px_3px_rgb(0_0_0/0.06)] transition-shadow", CARD, dropping && "ring-2 ring-[#b4581f]/60")}
            onDragOver={(e) => {
                if (!e.dataTransfer.types.includes("Files")) return;
                e.preventDefault();
                setDropping(true);
            }}
            onDragLeave={() => setDropping(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDropping(false);
                attach(e.dataTransfer.files);
            }}
        >
            {(files.length > 0 || reading > 0) && (
                <div className="mb-2 flex flex-wrap gap-2 pt-1">
                    {files.map((f, i) => <FileChip key={`${f.name}-${i}`} file={f} onRemove={() => setFiles((all) => all.filter((_, j) => j !== i))} />)}
                    {reading > 0 && <span className={cn("self-center motion-safe:animate-pulse", SMALL, FAINT)}>{s(["Reading…", "正在读取…", "正在讀取…"])}</span>}
                </div>
            )}
            <textarea
                ref={field}
                rows={2}
                value={text}
                placeholder={s(["Type Anything", "输入任何内容", "輸入任何內容"])}
                aria-label={s(["Message", "消息", "訊息"])}
                className={cn("block w-full resize-none bg-transparent outline-none placeholder:text-[#a8a6a4] dark:placeholder:text-[#77757a]", BODY, TEXT)}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        send();
                    }
                }}
            />
            <input
                ref={picker}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                    attach(e.target.files);
                    e.target.value = "";
                }}
            />
            <div className="flex items-center gap-3">
                <button type="button" aria-label={s(["Attach Files", "添加文件", "加入檔案"])} title={s(["Attach Files", "添加文件", "加入檔案"])} className={cn("-ml-1 flex size-6 items-center justify-center rounded-full hover:bg-black/6 dark:hover:bg-white/10", MUTED)} onClick={() => picker.current?.click()}>
                    <SFSymbol name="plus" className="size-3.5" />
                </button>
                <div className="relative ml-auto min-w-0">
                    <button type="button" className={cn("flex max-w-full items-center gap-1 text-[13px]", ACCENT)} onClick={() => setPicking((p) => !p)}>
                        <SFSymbol name="chevron.down" className="size-2.5 shrink-0" />
                        <span className="truncate">{model}</span>
                    </button>
                    {picking && (
                        <div className={cn("absolute right-0 bottom-7 z-10 min-w-[240px] rounded-xl p-1 shadow-[0_8px_30px_rgb(0_0_0/0.18)] motion-safe:animate-in motion-safe:fade-in", CARD, SMALL)}>
                            <p className={cn("px-2.5 py-1.5", FAINT)}>{s(["Downloaded Models", "已下载的模型", "已下載的模型"])}</p>
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
                            {models.length === 1 && <p className={cn("px-2.5 py-1.5", FAINT)}>{s(["Download more in the Model Store.", "可以在模型商店下载更多模型。", "可以在模型商店下載更多模型。"])}</p>}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    aria-label={ready ? s(["Send", "发送", "傳送"]) : s(["Voice", "语音", "語音"])}
                    className={cn("flex size-7 shrink-0 items-center justify-center rounded-full transition-opacity", ACCENT_BG, busy && "opacity-50")}
                    onClick={send}
                >
                    {ready ? <SFSymbol name="arrow.up" className="size-3.5" /> : <SFSymbol name="waveform" className="size-3.5" />}
                </button>
            </div>
        </div>
    );
}
