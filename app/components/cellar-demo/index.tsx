import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DemoScroll, TrafficLights } from "~/components/mac-ui";
import { CAPSULE, MAC_FONT, TOOL_ITEM } from "~/components/mac-window";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { newId, seed, strings, type Block, type Doc, type Lang, type Row } from "./content";
import { DatabaseView, type Layout } from "./database";
import { PageEditor, type Caret } from "./page";

// A Cellar window drawn in HTML that works like the app, within limits: pages to write in (blocks,
// "/" menu, Markdown shortcuts, to-dos), new pages from "+", renaming in the sidebar, page search,
// and databases with a table and a board. Everything stays in the page; a reload starts over.

const VARS = {
    "--cellar-accent": "#0a7aff",
} as CSSProperties;

export function CellarDemo({ className, embedded }: { className?: string; /** In a window on another demo's desktop: filling it, without the hint. */ embedded?: boolean }) {
    const { t, i18n } = useTranslation();
    const lang = (["en", "zh-CN", "zh-TW"].includes(i18n.language) ? i18n.language : "en") as Lang;
    const s = strings(lang);

    const [docs, setDocs] = useState<Doc[]>(() => seed(lang));
    const [history, setHistory] = useState({ list: ["home"], at: 0 });
    const [caret, setCaret] = useState<Caret | null>(null);
    const [layouts, setLayouts] = useState<Record<string, Layout>>({});
    const [renaming, setRenaming] = useState<string | null>(null);
    const [query, setQuery] = useState<string | null>(null);
    // Shown or hidden by the toggle; null until then, which shows it on wide screens only.
    const [sidebar, setSidebar] = useState(true);
    const edited = useRef(false);

    // Pages are prerendered in English and switch to the visitor's language after hydration; follow
    // it until the visitor changes something.
    useEffect(() => {
        if (!edited.current) setDocs(seed(lang));
    }, [lang]);

    const openId = history.list[history.at];
    const doc = docs.find((d) => d.id === openId) ?? docs[0];
    const layout = layouts[doc.id] ?? "table";

    const open = (id: string) => {
        setQuery(null);
        if (id === openId) return;
        setHistory((h) => ({ list: [...h.list.slice(0, h.at + 1), id], at: h.at + 1 }));
    };
    const go = (step: number) => setHistory((h) => ({ ...h, at: Math.min(h.list.length - 1, Math.max(0, h.at + step)) }));

    const change = (id: string, patch: Partial<Doc>) => {
        edited.current = true;
        setDocs((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } as Doc : d)));
    };

    const newPage = () => {
        const block: Block = { id: newId(), type: "p", text: "" };
        const page: Doc = { kind: "page", id: newId(), title: "", blocks: [block] };
        edited.current = true;
        // Top-level pages are listed by date created, so a new one goes last.
        setDocs((ds) => [...ds, page]);
        open(page.id);
        setCaret({ id: block.id, at: 0 });
    };

    const onCaretDone = useCallback(() => setCaret(null), []);
    const matches = query === null ? [] : docs.filter((d) => (d.title || s.untitled).toLowerCase().includes(query.toLowerCase()));

    const frame = (
        <div
            style={VARS}
            className={cn(
                "relative flex w-full overflow-hidden rounded-[18px] border border-black/12 text-left text-[#1d1d1f] shadow-[0_24px_70px_-20px_rgb(0_0_0/0.35)] [--cellar-line:rgb(0_0_0/0.07)] [--cellar-muted:#86868b] [--cellar-window:#ffffff]",
                "dark:border-white/12 dark:text-[#ececec] dark:[--cellar-accent:#0a84ff] dark:[--cellar-line:rgb(255_255_255/0.08)] dark:[--cellar-muted:#98989d] dark:[--cellar-window:#1f1f1f]",
                embedded ? "h-full rounded-[12px]" : "h-[min(620px,78vh)]",
            )}
        >
            {/* Sidebar. */}
            <aside
                className={cn(
                    "flex w-[230px] shrink-0 flex-col border-r border-(--cellar-line) bg-[#f2f0ee] text-[13px] dark:bg-[#2a2827]",
                    !sidebar && "hidden",
                )}
                style={{ fontFamily: MAC_FONT }}
            >
                <div className="flex h-[52px] shrink-0 items-center px-4">
                    <TrafficLights />
                    <span className={cn(CAPSULE, "ml-auto gap-0.5 px-0.5")}>
                        <IconButton label={s.newPage} onClick={newPage} hint={!edited.current}><SFSymbol name="plus" className="size-3.5" /></IconButton>
                        <IconButton label={s.hidePanel} onClick={() => setSidebar(false)}><SFSymbol name="sidebar.left" className="h-3.5 w-[18px]" /></IconButton>
                    </span>
                </div>

                <div className="relative flex items-center gap-1 px-2.5 pb-1.5">
                    <label className="flex flex-1 items-center gap-1.5 rounded-md bg-black/6 px-2 py-[5px] text-(--cellar-muted) dark:bg-white/8">
                        <SFSymbol name="magnifyingglass" className="size-3 shrink-0" />
                        <input
                            value={query ?? ""}
                            placeholder={s.search}
                            className="w-full min-w-0 bg-transparent text-current outline-none placeholder:text-(--cellar-muted)"
                            onFocus={() => setQuery((q) => q ?? "")}
                            onChange={(e) => setQuery(e.target.value)}
                            onBlur={() => setTimeout(() => setQuery(null), 150)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && matches[0]) open(matches[0].id);
                                if (e.key === "Escape") e.currentTarget.blur();
                            }}
                        />
                    </label>
                    <SFSymbol name="line.3.horizontal.decrease.circle" className="size-4 shrink-0 text-(--cellar-muted)" />
                    {query !== null && query !== "" && (
                        <div className="absolute top-full right-2.5 left-2.5 z-10 rounded-lg border border-black/10 bg-(--cellar-window) p-1 shadow-[0_10px_30px_rgb(0_0_0/0.18)] dark:border-white/10">
                            {matches.length === 0 && <p className="px-2 py-1.5 text-(--cellar-muted)">{s.noResults}</p>}
                            {matches.map((d) => (
                                <button key={d.id} type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-(--cellar-accent) hover:text-white" onMouseDown={() => open(d.id)}>
                                    <DocIcon doc={d} />
                                    {d.title || s.untitled}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto px-2.5 py-1">
                    {docs.map((d) => (
                        <div
                            key={d.id}
                            className={cn(
                                "flex h-7 items-center gap-2 rounded-md px-2 motion-safe:animate-in motion-safe:fade-in",
                                d.id === doc.id ? "bg-black/9 dark:bg-white/12" : "hover:bg-black/4 dark:hover:bg-white/5",
                            )}
                            onClick={() => renaming !== d.id && open(d.id)}
                            onDoubleClick={() => setRenaming(d.id)}
                        >
                            <DocIcon doc={d} />
                            {renaming === d.id ? (
                                <RenameField
                                    value={d.title}
                                    onDone={(title) => {
                                        if (title !== null) change(d.id, { title });
                                        setRenaming(null);
                                    }}
                                />
                            ) : (
                                <button type="button" className={cn("min-w-0 flex-1 truncate text-left", !d.title && "text-(--cellar-muted)")}>
                                    {d.title || s.untitled}
                                </button>
                            )}
                        </div>
                    ))}
                </nav>
            </aside>

            <main className="relative flex min-w-0 flex-1 flex-col bg-(--cellar-window)" style={{ fontFamily: MAC_FONT }}>
                <header className="flex h-[52px] shrink-0 items-center gap-2 px-3">
                    {!sidebar && (
                        <span className={cn(CAPSULE, "px-0.5")}>
                            <IconButton label={s.showPanel} onClick={() => setSidebar(true)}><SFSymbol name="sidebar.left" className="h-3.5 w-[18px]" /></IconButton>
                        </span>
                    )}
                    <span className={cn(CAPSULE, "gap-0.5 px-0.5")}>
                        <IconButton label={s.back} disabled={history.at === 0} onClick={() => go(-1)}><SFSymbol name="chevron.left" className="size-3.5" /></IconButton>
                        <IconButton label={s.forward} disabled={history.at === history.list.length - 1} onClick={() => go(1)}><SFSymbol name="chevron.right" className="size-3.5" /></IconButton>
                    </span>
                    <h4 className="ml-1.5 min-w-0 truncate text-[15px] font-semibold text-[#1d1d1f] dark:text-[#ececec]">{doc.title || s.untitled}</h4>
                    {doc.kind === "database" && (
                        <div className="ml-auto flex items-center gap-2">
                            <div className={cn(CAPSULE, "p-0.5 text-[12px]")}>
                                {(["table", "board"] as Layout[]).map((l) => (
                                    <button
                                        key={l}
                                        type="button"
                                        className={cn("rounded-[5px] px-2.5 py-0.5", l === layout ? "bg-(--cellar-window) text-current shadow-sm" : "hover:text-current")}
                                        onClick={() => setLayouts((ls) => ({ ...ls, [doc.id]: l }))}
                                    >
                                        {l === "table" ? s.table : s.board}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </header>

                <div data-scroller className="min-h-0 flex-1 overflow-y-auto text-[#1d1d1f] dark:text-[#ececec]">
                    {doc.kind === "page" ? (
                        <PageEditor
                            key={doc.id}
                            page={doc}
                            docs={docs}
                            caret={caret}
                            strings={s}
                            onChange={(blocks, next) => {
                                change(doc.id, { blocks });
                                if (next) setCaret(next);
                            }}
                            onCaretDone={onCaretDone}
                            onOpen={open}
                        />
                    ) : (
                        <DatabaseView key={doc.id} db={doc} layout={layout} strings={s} onChange={(rows: Row[]) => change(doc.id, { rows })} />
                    )}
                </div>
            </main>
        </div>
    );

    return (
        <div className={className}>
            {embedded ? frame : <DemoScroll minWidth={960}>{frame}</DemoScroll>}
            {!embedded && <p className="mt-5 text-center text-[13px] text-faint">{t("cellar.demo_hint")}</p>}
        </div>
    );
}

function DocIcon({ doc }: { doc: Doc }) {
    return <SFSymbol name={doc.kind === "database" ? "tablecells" : "doc.text"} className="size-[15px] shrink-0 text-(--cellar-accent)" />;
}

function IconButton({ label, disabled, hint, onClick, children }: { label: string; disabled?: boolean; hint?: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            className={TOOL_ITEM}
            onClick={onClick}
        >
            {children}
            {hint && <span className="absolute inset-0 rounded-full shadow-[0_0_0_2px_var(--cellar-accent)] motion-safe:animate-pulse" />}
        </button>
    );
}

/** Renames a sidebar row in place: Return or leaving saves, Escape cancels (null). */
function RenameField({ value, onDone }: { value: string; onDone: (value: string | null) => void }) {
    const ref = useRef<HTMLInputElement>(null);
    const done = useRef(false);
    useEffect(() => {
        ref.current?.focus();
        ref.current?.select();
    }, []);
    const finish = (v: string | null) => {
        if (done.current) return;
        done.current = true;
        onDone(v);
    };
    return (
        <input
            ref={ref}
            defaultValue={value}
            className="min-w-0 flex-1 rounded-[4px] bg-(--cellar-window) px-1 outline-2 outline-(--cellar-accent)"
            onBlur={(e) => finish(e.target.value.trim())}
            onKeyDown={(e) => {
                if (e.key === "Enter") finish(e.currentTarget.value.trim());
                if (e.key === "Escape") finish(null);
            }}
        />
    );
}
