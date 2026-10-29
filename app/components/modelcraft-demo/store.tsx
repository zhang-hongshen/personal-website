import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { useText } from "~/components/demo-text";
import { Spinner } from "~/components/mac-ui";
import { ProductIcon } from "~/components/product-icon";
import { SFSymbol, type SymbolName } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { CATEGORY_NAME, CONNECTORS, DEFAULT_MODEL, MODELS, type Category, type Model } from "./data";
import { ACCENT, ACCENT_BG, BAR, CAPSULE, CARD, FAINT, LINE, MUTED, SMALL, TEXT, TITLE, TOOL } from "./ui";

/** The icon the app shows while a model's organization avatar loads; avatars aren't fetched here. */
const CATEGORY_ICON: Record<Category, SymbolName> = { Text: "text.bubble", Vision: "eye", Omni: "sparkles" };

/** Where a model's download stands: progress from 0 to 1, and whether it's stopped. */
export type Download = { progress: number; stopped: boolean };

export function StoreView({ downloads, sidebarButton, onDownload }: {
    downloads: Record<string, Download>;
    sidebarButton: ReactNode;
    /** Starts, stops or resumes a download. */
    onDownload: (name: string) => void;
}) {
    const s = useText();
    const [category, setCategory] = useState<Category>("Text");
    const [grid, setGrid] = useState(true);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!loading) return;
        const timer = setTimeout(() => setLoading(false), 700);
        return () => clearTimeout(timer);
    }, [loading]);

    const models = MODELS.filter((m) => m.category === category && m.name.toLowerCase().includes(query.trim().toLowerCase()));

    return (
        <div className="flex h-full flex-col">
            <header className={cn(BAR, "flex-wrap gap-y-2")}>
                {sidebarButton}
                <h4 className={cn("mr-auto", TITLE)}>{s(["Model Store", "模型商店", "模型商店"])}</h4>
                <div className={cn(CAPSULE, "p-0.5 text-[13px]")}>
                    {(["Text", "Vision", "Omni"] as Category[]).map((c) => (
                        <button
                            key={c}
                            type="button"
                            className={cn("h-7 rounded-full px-3", c === category ? "bg-black/8 font-medium dark:bg-white/14" : "opacity-80")}
                            onClick={() => {
                                setCategory(c);
                                setLoading(true);
                            }}
                        >
                            {s(CATEGORY_NAME[c])}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    aria-label={grid ? s(["as List", "以列表显示", "以列表顯示"]) : s(["as Grid", "以网格显示", "以格狀顯示"])}
                    title={grid ? s(["as List", "以列表显示", "以列表顯示"]) : s(["as Grid", "以网格显示", "以格狀顯示"])}
                    className={cn(CAPSULE, "gap-1 px-2.5")} onClick={() => setGrid((g) => !g)}>
                    <SFSymbol name={grid ? "square.grid.2x2" : "list.bullet"} className="size-4" />
                    <SFSymbol name="chevron.down" className="size-2" />
                </button>
                <button type="button" aria-label={s(["Refresh", "刷新", "重新整理"])} title={s(["Refresh", "刷新", "重新整理"])} className={TOOL} onClick={() => setLoading(true)}>
                    {loading ? <Spinner className="size-4" /> : <SFSymbol name="arrow.triangle.2.circlepath" className="size-4" />}
                </button>
                <label className={cn(CAPSULE, "w-48 gap-1.5 px-3 text-[13px]")}>
                    <SFSymbol name="magnifyingglass" className="size-3.5 shrink-0 opacity-70" />
                    <input value={query} placeholder={s(["Search", "搜索", "搜尋"])} aria-label={s(["Search models", "搜索模型", "搜尋模型"])} className={cn("min-w-0 flex-1 bg-transparent outline-none placeholder:text-current", TEXT)} onChange={(e) => setQuery(e.target.value)} />
                </label>
            </header>

            <div className={cn("min-h-0 flex-1 overflow-y-auto px-3 pb-4", grid ? "grid auto-rows-min grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3" : "flex flex-col gap-3")}>
                {loading
                    ? Array.from({ length: 8 }, (_, i) => <div key={i} className={cn("rounded-xl bg-black/5 dark:bg-white/6", grid ? "h-[132px]" : "h-[68px]")} />)
                    : models.map((m) => <ModelCard key={m.name} model={m} grid={grid} download={downloads[m.name]} onDownload={() => onDownload(m.name)} />)}
                {!loading && models.length === 0 && <p className={cn("col-span-full py-10 text-center text-[13px]", MUTED)}>{s([`No models match “${query}”.`, `没有匹配“${query}”的模型。`, `沒有符合「${query}」的模型。`])}</p>}
            </div>
        </div>
    );
}

function ModelCard({ model, grid, download, onDownload }: { model: Model; grid: boolean; download?: Download; onDownload: () => void }) {
        const icon = (
        <span className={cn("flex shrink-0 items-center justify-center rounded-[10px] border border-black/6 bg-[#b4581f]/12 dark:border-white/8 dark:bg-[#e8915a]/14", ACCENT, grid ? "size-10" : "size-11")}>
            <SFSymbol name={CATEGORY_ICON[model.category]} className="size-[18px]" />
        </span>
    );
    const meta = (
        <p className={cn("flex items-center gap-2.5 text-[11px]", MUTED)}>
            <span className="flex items-center gap-1"><SFSymbol name="internaldrive" className="size-3" />{model.size}</span>
            <span className="flex items-center gap-1"><SFSymbol name="arrow.down.circle" className="size-3" />{model.downloads}</span>
        </p>
    );
    const name = <h5 className={cn("text-[13px] font-semibold break-all", grid ? "line-clamp-2 min-h-[2lh]" : "truncate")} title={model.name}>{model.name}</h5>;
    return (
        <article
            className={cn(
                "rounded-xl border border-black/8 p-3.5 transition-colors hover:border-black/25 dark:border-white/8 dark:hover:border-white/25 motion-safe:animate-in motion-safe:fade-in",
                CARD,
                grid ? "flex flex-col gap-2.5" : "flex items-center gap-3",
            )}
        >
            {grid ? (
                <>
                    <div className="flex items-start justify-between">{icon}<DownloadButton name={model.name} download={download} onClick={onDownload} /></div>
                    {name}
                    {meta}
                </>
            ) : (
                <>
                    {icon}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">{name}{meta}</div>
                    <DownloadButton name={model.name} download={download} onClick={onDownload} />
                </>
            )}
        </article>
    );
}

/** Download, a progress ring that stops or resumes it, or the green check of a downloaded model. */
function DownloadButton({ name, download, onClick }: { name: string; download?: Download; onClick: () => void }) {
    const s = useText();
    if (name === DEFAULT_MODEL || download?.progress === 1) return <DoneMark />;
    if (!download) {
        return (
            <button type="button" aria-label={s([`Download ${name}`, `下载 ${name}`, `下載 ${name}`])} title={s(["Download", "下载", "下載"])} className={cn("flex size-7 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/8 dark:hover:bg-white/14", ACCENT)} onClick={onClick}>
                <SFSymbol name="arrow.down" className="size-3" />
            </button>
        );
    }
    const label = download.stopped ? s(["Resume Download", "继续下载", "繼續下載"]) : s(["Stop Download", "停止下载", "停止下載"]);
    return (
        <button type="button" aria-label={`${label} ${name}`} title={label} className={cn("relative flex size-7 items-center justify-center", ACCENT)} onClick={onClick}>
            <svg viewBox="0 0 24 24" className="absolute inset-0.5 -rotate-90">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" pathLength="1" strokeDasharray={`${download.progress} 1`} strokeLinecap="round" />
            </svg>
            <SFSymbol name={download.stopped ? "play.fill" : "stop.fill"} className="size-2" />
        </button>
    );
}

/** The green check the app shows on a downloaded model. */
function DoneMark() {
    const s = useText();
    return <SFSymbol name="checkmark.circle.fill" aria-label={s(["Downloaded", "已下载", "已下載"])} className="size-5 text-[#34c759] motion-safe:animate-in motion-safe:zoom-in-50 dark:text-[#30d158]" />;
}

export function ConnectorsView({ installed, sidebarButton, onToggle }: {
    installed: Record<string, boolean>;
    sidebarButton: ReactNode;
    onToggle: (name: string) => void;
}) {
    const s = useText();
    const [installing, setInstalling] = useState<string | null>(null);
    useEffect(() => {
        if (!installing) return;
        const timer = setTimeout(() => {
            onToggle(installing);
            setInstalling(null);
        }, 900);
        return () => clearTimeout(timer);
    }, [installing, onToggle]);

    return (
        <div className="flex h-full flex-col">
            <header className={BAR}>
                {sidebarButton}
                <h4 className={TITLE}>{s(["Connectors", "连接器", "連接器"])}</h4>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-4">
                {CONNECTORS.map((c) => (
                    <article key={c.name} className={cn("flex items-center gap-3 rounded-xl p-4", CARD)}>
                        <ProductIcon id={c.id} className="size-11 shrink-0" width={44} height={44} />
                        <div className="min-w-0 flex-1">
                            <h5 className="text-[17px] font-semibold" style={{ fontFamily: "ui-rounded, -apple-system, system-ui, sans-serif" }}>
                                <Link to={`/products/${c.id}/`} className="hover:underline">{c.name}</Link>
                            </h5>
                            <p className={cn("text-[13px]", MUTED)}>{s(c.summary)}</p>
                        </div>
                        {installing === c.name ? (
                            <Spinner className={cn("size-4", MUTED)} label={s(["Installing", "正在安装", "正在安裝"])} />
                        ) : installed[c.name] ? (
                            <button type="button" className="h-7 shrink-0 rounded-md bg-black/5 px-3 text-[13px] text-[#d6382c] hover:bg-black/8 dark:bg-white/8 dark:text-[#ff6961]" onClick={() => onToggle(c.name)}>
                                {s(["Uninstall", "卸载", "解除安裝"])}
                            </button>
                        ) : (
                            <button type="button" className={cn("h-7 shrink-0 rounded-md px-3 text-[13px] font-medium", ACCENT_BG)} onClick={() => setInstalling(c.name)}>
                                {s(["Install", "安装", "安裝"])}
                            </button>
                        )}
                    </article>
                ))}
            </div>
        </div>
    );
}

/** Downloaded Models: picking one makes it the chat's model; any but the first can be deleted. */
export function DownloadedView({ models, current, sidebarButton, onPick, onDelete }: {
    models: Model[];
    current: string;
    sidebarButton: ReactNode;
    onPick: (name: string) => void;
    onDelete: (name: string) => void;
}) {
    const s = useText();
    return (
        <div className="flex h-full flex-col">
            <header className={BAR}>
                {sidebarButton}
                <h4 className={TITLE}>{s(["Downloaded Models", "已下载的模型", "已下載的模型"])}</h4>
            </header>
            <div className={cn("mx-3 mb-4 min-h-0 overflow-y-auto rounded-xl", CARD)}>
                {models.map((m, i) => (
                    <div key={m.name} className={cn("flex items-center gap-3 px-4 py-3 motion-safe:animate-in motion-safe:fade-in", i > 0 && "border-t", LINE)}>
                        <SFSymbol name="shippingbox" className={cn("size-5 shrink-0", ACCENT)} />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold">{m.name}</p>
                            <p className={cn(SMALL, MUTED)}>{m.size} · {s(CATEGORY_NAME[m.category])}</p>
                        </div>
                        {m.name === current ? (
                            <span className={cn("rounded-full px-2.5 py-0.5 text-[12px]", ACCENT_BG)}>{s(["In use", "使用中", "使用中"])}</span>
                        ) : (
                            <button type="button" className={cn("text-[13px] hover:underline", ACCENT)} onClick={() => onPick(m.name)}>{s(["Use in Chat", "在对话中使用", "在對話中使用"])}</button>
                        )}
                        {m.name !== DEFAULT_MODEL && (
                            <button type="button" aria-label={s([`Delete ${m.name}`, `删除 ${m.name}`, `刪除 ${m.name}`])} title={s(["Delete", "删除", "刪除"])} className={cn("rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/8", FAINT)} onClick={() => onDelete(m.name)}>
                                <SFSymbol name="trash" className="size-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <p className={cn("px-5 text-[12px]", MUTED)}>{s(["Models you download in the Model Store show up here.", "在模型商店下载的模型会显示在这里。", "在模型商店下載的模型會顯示在這裡。"])}</p>
        </div>
    );
}
