import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { newId, type Block, type BlockType, type Doc, type Strings } from "./content";

// The page editor, following the app's (Docs/Features/Pages.md): Return splits a block and continues
// a list, Backspace at the start turns a block back into text or joins it to the one above, "/" in an
// empty block opens the type menu, and Markdown shortcuts at the start of a line change its type.

/** Where to put the insertion point next: in which block, and at which character. */
export type Caret = { id: string; at: number | "end" };

const TEXT_TYPES: BlockType[] = ["p", "h1", "h2", "h3", "todo", "bullet", "number", "quote", "code"];
const LIST_TYPES: BlockType[] = ["todo", "bullet", "number"];

const SHORTCUTS: [RegExp, BlockType][] = [
    [/^# /, "h1"], [/^## /, "h2"], [/^### /, "h3"], [/^\[ ?\] /, "todo"], [/^[-*] /, "bullet"], [/^1[.)] /, "number"], [/^> /, "quote"], [/^```/, "code"],
];

const STYLE: Record<BlockType, string> = {
    p: "text-[15px] leading-[1.6]",
    h1: "mt-5 text-[28px] font-bold leading-[1.25] tracking-[-0.01em]",
    h2: "mt-4 text-[22px] font-bold leading-[1.3]",
    h3: "mt-3 text-[18px] font-semibold leading-[1.35]",
    todo: "text-[15px] leading-[1.6]",
    bullet: "text-[15px] leading-[1.6]",
    number: "text-[15px] leading-[1.6]",
    quote: "border-l-[3px] border-current/25 pl-3.5 text-[15px] leading-[1.6]",
    code: "rounded-md bg-black/5 px-3.5 py-2.5 font-mono text-[13px] leading-[1.55] whitespace-pre-wrap dark:bg-white/7",
    divider: "",
    page: "",
};

export function PageEditor({ page, docs, caret, strings, onChange, onCaretDone, onOpen }: {
    page: Extract<Doc, { kind: "page" }>;
    docs: Doc[];
    caret: Caret | null;
    strings: Strings;
    onChange: (blocks: Block[], caret?: Caret) => void;
    onCaretDone: () => void;
    onOpen: (id: string) => void;
}) {
    const blocks = page.blocks;
    // The "/" menu: which block it's for, what was typed after "/", and the highlighted row.
    const [slash, setSlash] = useState<{ id: string; query: string; index: number } | null>(null);
    const commands = slash ? strings.blocks.filter(([type, label]) => `${label} ${type}`.toLowerCase().includes(slash.query.toLowerCase())) : [];

    const update = (id: string, patch: Partial<Block>, caretAfter?: Caret) =>
        onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)), caretAfter);

    const insertAfter = (id: string, block: Block, patch?: Partial<Block>) => {
        const i = blocks.findIndex((b) => b.id === id);
        const next = blocks.map((b) => (b.id === id && patch ? { ...b, ...patch } : b));
        next.splice(i + 1, 0, block);
        onChange(next, { id: block.id, at: 0 });
    };

    const applyType = (block: Block, type: BlockType) => {
        setSlash(null);
        if (type === "divider") {
            insertAfter(block.id, { id: newId(), type: "p", text: "" }, { type: "divider", text: "" });
        } else {
            update(block.id, { type, text: "" }, { id: block.id, at: 0 });
        }
    };

    const onInput = (block: Block, text: string, at: number) => {
        if (block.type === "p" && text === "---") return insertAfter(block.id, { id: newId(), type: "p", text: "" }, { type: "divider", text: "" });
        if (block.type === "p") {
            for (const [pattern, type] of SHORTCUTS) {
                const m = text.match(pattern);
                if (m) return update(block.id, { type, text: text.slice(m[0].length) }, { id: block.id, at: Math.max(0, at - m[0].length) });
            }
        }
        const query = block.type !== "code" ? text.match(/^\/(\S*)$/) : null;
        setSlash(query ? { id: block.id, query: query[1], index: 0 } : null);
        update(block.id, { text });
    };

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, block: Block, i: number) => {
        if (e.nativeEvent.isComposing) return;
        const el = e.currentTarget;
        const at = caretOffset(el);
        const text = el.textContent ?? "";

        if (slash?.id === block.id && commands.length) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const step = e.key === "ArrowDown" ? 1 : -1;
                setSlash({ ...slash, index: (slash.index + step + commands.length) % commands.length });
                return;
            }
            if (e.key === "Enter") {
                e.preventDefault();
                applyType(block, commands[Math.min(slash.index, commands.length - 1)][0]);
                return;
            }
        }
        if (e.key === "Escape" && slash) {
            setSlash(null);
            return;
        }

        if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
            if (block.type === "code") {
                // Return on an empty last line leaves the code block for a paragraph below.
                if (!text.endsWith("\n") || at < text.length) return;
                e.preventDefault();
                return insertAfter(block.id, { id: newId(), type: "p", text: "" }, { text: text.slice(0, -1) });
            }
            e.preventDefault();
            if (LIST_TYPES.includes(block.type) && text === "") return update(block.id, { type: "p" }, { id: block.id, at: 0 });
            const type = LIST_TYPES.includes(block.type) ? block.type : "p";
            return insertAfter(block.id, { id: newId(), type, text: text.slice(at) }, { text: text.slice(0, at) });
        }

        if (e.key === "Backspace" && at === 0 && !hasSelection()) {
            if (block.type !== "p") {
                e.preventDefault();
                return update(block.id, { type: "p" }, { id: block.id, at: 0 });
            }
            const prev = blocks[i - 1];
            if (!prev) return;
            e.preventDefault();
            if (!TEXT_TYPES.includes(prev.type)) {
                // A divider or sub-page above goes, as the app's Backspace on a selected block does.
                return onChange(blocks.filter((b) => b.id !== prev.id), { id: block.id, at: 0 });
            }
            return onChange(
                blocks.filter((b) => b.id !== block.id).map((b) => (b.id === prev.id ? { ...b, text: b.text + text } : b)),
                { id: prev.id, at: prev.text.length },
            );
        }

        if ((e.key === "ArrowUp" && at === 0) || (e.key === "ArrowDown" && at === text.length)) {
            const step = e.key === "ArrowUp" ? -1 : 1;
            let j = i + step;
            while (blocks[j] && !TEXT_TYPES.includes(blocks[j].type)) j += step;
            if (blocks[j]) {
                e.preventDefault();
                onChange(blocks, { id: blocks[j].id, at: step < 0 ? "end" : 0 });
            }
        }
    };

    // Clicking below the last block continues writing there.
    const continueWriting = () => {
        const last = blocks[blocks.length - 1];
        if (last && last.type === "p" && last.text === "") return onChange(blocks, { id: last.id, at: 0 });
        const block: Block = { id: newId(), type: "p", text: "" };
        onChange([...blocks, block], { id: block.id, at: 0 });
    };

    let number = 0;
    return (
        <div className="flex min-h-full flex-col px-8 pt-6">
            {blocks.map((block, i) => {
                number = block.type === "number" ? number + 1 : 0;
                if (block.type === "divider") return <hr key={block.id} className="my-3 border-current/12" />;
                if (block.type === "page") {
                    const target = docs.find((d) => d.id === block.target);
                    if (!target) return null;
                                        return (
                        <button
                            key={block.id}
                            type="button"
                            className="-mx-1.5 my-px flex items-center gap-2 self-start rounded-md px-1.5 py-1 text-[15px] underline decoration-current/25 underline-offset-[3px] hover:bg-black/5 hover:text-(--cellar-accent) dark:hover:bg-white/7"
                            onClick={() => onOpen(target.id)}
                        >
                            <SFSymbol name={target.kind === "database" ? "tablecells" : "doc.text"} className="size-4 opacity-60" />
                            {target.title || strings.untitled}
                        </button>
                    );
                }
                return (
                    <div key={block.id} className={cn("relative flex items-start gap-2 py-[3px]", STYLE[block.type])}>
                        {block.type === "todo" && (
                            <button
                                type="button"
                                role="checkbox"
                                aria-checked={!!block.checked}
                                aria-label={block.text}
                                className={cn(
                                    "mt-[5px] flex size-[15px] shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                                    block.checked ? "border-(--cellar-accent) bg-(--cellar-accent) text-white" : "border-current/30",
                                )}
                                onClick={() => update(block.id, { checked: !block.checked })}
                            >
                                {block.checked && <SFSymbol name="checkmark" className="size-2.5" />}
                            </button>
                        )}
                        {block.type === "bullet" && <span className="w-4 shrink-0 text-center">•</span>}
                        {block.type === "number" && <span className="w-4 shrink-0 text-right tabular-nums">{number}.</span>}
                        <Editable
                            block={block}
                            caret={caret?.id === block.id ? caret : null}
                            placeholder={i === blocks.length - 1 || block.type !== "p" ? strings.placeholder : ""}
                            className={cn("min-w-0 flex-1", block.type === "todo" && block.checked && "text-current/45 line-through")}
                            onCaretDone={onCaretDone}
                            onInput={(text, at) => onInput(block, text, at)}
                            onKeyDown={(e) => onKeyDown(e, block, i)}
                            onBlur={() => setSlash((s) => (s?.id === block.id ? null : s))}
                        />
                        {slash?.id === block.id && commands.length > 0 && (
                            <SlashMenu
                                title={strings.basic}
                                commands={commands}
                                index={slash.index}
                                onPick={(type) => applyType(block, type)}
                                onHover={(j) => setSlash({ ...slash, index: j })}
                            />
                        )}
                    </div>
                );
            })}
            <div className="min-h-16 flex-1 cursor-text" onClick={continueWriting} />
        </div>
    );
}

/** The "/" menu, below its block, or above it when it doesn't fit below and there is more room above. */
function SlashMenu({ title, commands, index, onPick, onHover }: {
    title: string;
    commands: [BlockType, string][];
    index: number;
    onPick: (type: BlockType) => void;
    onHover: (index: number) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [above, setAbove] = useState(false);
    useLayoutEffect(() => {
        const el = ref.current;
        const scroller = el?.closest("[data-scroller]");
        if (!el || !scroller) return;
        const block = el.parentElement!.getBoundingClientRect();
        const area = scroller.getBoundingClientRect();
        const below = area.bottom - block.bottom;
        setAbove(below < el.offsetHeight + 8 && block.top - area.top > below);
    }, [commands.length]);
    return (
        <div
            ref={ref}
            className={cn(
                "absolute left-0 z-20 w-60 rounded-lg border border-black/10 bg-(--cellar-window) p-1 text-[13px] font-normal shadow-[0_10px_30px_rgb(0_0_0/0.18)] dark:border-white/10",
                above ? "bottom-full mb-1" : "top-full mt-1",
            )}
        >
            <p className="px-2 pt-1 pb-1.5 text-[11px] font-semibold text-(--cellar-muted)">{title}</p>
            {commands.map(([type, label], j) => (
                <button
                    key={type}
                    type="button"
                    className={cn("flex w-full items-center rounded-md px-2 py-1.5 text-left", j === index && "bg-(--cellar-accent) text-white")}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onPick(type);
                    }}
                    onMouseEnter={() => onHover(j)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

/** One block's text, typed in place. The DOM holds the text while typing; it is rewritten only when the block's text changes from outside. */
function Editable({ block, caret, placeholder, className, onCaretDone, onInput, onKeyDown, onBlur }: {
    block: Block;
    caret: Caret | null;
    placeholder: string;
    className?: string;
    onCaretDone: () => void;
    onInput: (text: string, at: number) => void;
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
    onBlur: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const el = ref.current;
        if (el && el.textContent !== block.text) el.textContent = block.text;
    }, [block.text]);

    useEffect(() => {
        const el = ref.current;
        if (!el || !caret) return;
        el.focus({ preventScroll: true });
        el.scrollIntoView({ block: "nearest" });
        placeCaret(el, caret.at === "end" ? block.text.length : caret.at);
        onCaretDone();
    }, [caret, block.text, onCaretDone]);

    return (
        <div
            ref={ref}
            contentEditable="plaintext-only"
            suppressContentEditableWarning
            spellCheck={false}
            role="textbox"
            aria-multiline={block.type === "code"}
            data-placeholder={placeholder}
            className={cn(
                "outline-none focus:empty:before:text-current/35 focus:empty:before:content-[attr(data-placeholder)]",
                className,
            )}
            onInput={(e) => onInput(e.currentTarget.textContent ?? "", caretOffset(e.currentTarget))}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
        />
    );
}

function hasSelection() {
    const sel = window.getSelection();
    return !!sel && !sel.isCollapsed;
}

/** The insertion point as a character offset into `el`'s text. */
function caretOffset(el: HTMLElement) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !el.contains(sel.anchorNode)) return 0;
    const range = sel.getRangeAt(0).cloneRange();
    range.selectNodeContents(el);
    range.setEnd(sel.anchorNode!, sel.anchorOffset);
    return range.toString().length;
}

function placeCaret(el: HTMLElement, offset: number) {
    const sel = window.getSelection();
    if (!sel) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let left = offset;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const length = node.textContent?.length ?? 0;
        if (left <= length) {
            sel.collapse(node, left);
            return;
        }
        left -= length;
    }
    sel.selectAllChildren(el);
    sel.collapseToEnd();
}
