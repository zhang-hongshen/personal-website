import { Fragment, useEffect, useState, type DragEvent } from "react";

import { locale, useLang, useText, type L } from "~/components/demo-text";
import { Inspector, MAC, MacSidebar, MacWindow, Popover, SearchField, Segmented, ShowSidebarButton, SidebarHeader, TitleBar, ToolButton, Unavailable, useSidebar } from "~/components/mac-ui";
import { CAPSULE } from "~/components/mac-window";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import {
    PROTOCOLS, UPLOADS, clone, folderAt, formatSize, freeName, iconOf, initialConnections, kindOf, totalSize,
    type Connection, type Item,
} from "./data";

// A Ferry window that works like the app: connections in the sidebar (an S3 connection lists its
// buckets), the folder as a Finder-style list or icons, and the inspector. Uploads, downloads and
// copies run as transfers: incoming files show at their destination with a progress ring until they
// land. Drag a file onto a folder to move it, or onto another connection to copy it there. The
// storage lives in the page; a reload starts over.

type Place = { conn: string; path: string[] };
type Transfer = { id: number; kind: "upload" | "download" | "copy"; conn: string; dir: string[]; item: Item; progress: number };

const key = (path: string[]) => path.join("/");
const DRAG = "application/x-ferry-item";
const EXPIRIES: { value: string; label: L; seconds: number }[] = [
    { value: "hour", label: ["1 Hour", "1 小时", "1 小時"], seconds: 3600 },
    { value: "day", label: ["1 Day", "1 天", "1 天"], seconds: 86400 },
    { value: "week", label: ["7 Days", "7 天", "7 天"], seconds: 604800 },
];

/** A transfer's ring: the share done, drawn as an arc. */
function Ring({ progress, className }: { progress: number; className?: string }) {
    const r = 6, c = 2 * Math.PI * r;
    return (
        <svg viewBox="0 0 16 16" className={cn("size-3.5 shrink-0 -rotate-90", className)} aria-hidden>
            <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth="2" />
            <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} strokeLinecap="round" />
        </svg>
    );
}

export function FerryDemo({ className }: { className?: string }) {
    const s = useText();
    const lang = useLang();
    const sidebar = useSidebar();
    const [conns, setConns] = useState<Connection[]>(initialConnections);
    const [place, setPlace] = useState<Place>({ conn: "s3", path: ["site-assets"] });
    const [back, setBack] = useState<Place[]>([]);
    const [forward, setForward] = useState<Place[]>([]);
    const [view, setView] = useState<"list" | "icons">("list");
    const [expanded, setExpanded] = useState<string[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [renaming, setRenaming] = useState<{ path: string; name: string } | null>(null);
    const [filter, setFilter] = useState("");
    const [inspector, setInspector] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [uploads, setUploads] = useState(0);
    const [dropTarget, setDropTarget] = useState<string | null>(null);
    const [expiry, setExpiry] = useState("day");
    const [link, setLink] = useState<string | null>(null);
    const [, redraw] = useState(0);
    const changed = () => redraw((n) => n + 1);

    const conn = conns.find((c) => c.id === place.conn)!;
    const folder = folderAt(conn.root, place.path) ?? conn.root;
    const selectedPath = selected?.split("/") ?? null;
    const selectedItem = selectedPath ? itemAt(conn.root, selectedPath) : undefined;

    // Transfers move at a pace set by their size, between one and six seconds.
    useEffect(() => {
        if (!transfers.length) return;
        const timer = setInterval(() => {
            setTransfers((list) => list.map((t) => ({ ...t, progress: Math.min(1, t.progress + 0.1 / Math.min(6, Math.max(1.2, totalSize(t.item) / 60e6))) })));
        }, 100);
        return () => clearInterval(timer);
    }, [transfers.length]);

    // Finished uploads and copies land in their folder.
    useEffect(() => {
        const done = transfers.filter((t) => t.progress >= 1);
        if (!done.length) return;
        for (const t of done) {
            if (t.kind === "download") continue;
            const target = folderAt(conns.find((c) => c.id === t.conn)!.root, t.dir);
            target?.children!.push({ ...clone(t.item), name: freeName(target, t.item.name), modified: now() });
        }
        setTransfers((list) => list.filter((t) => t.progress < 1));
        setConns((cs) => [...cs]);
    }, [transfers, conns]);

    const go = (to: Place, remember = true) => {
        if (remember) { setBack((b) => [...b, place]); setForward([]); }
        setPlace(to);
        setSelected(null);
        setRenaming(null);
        setFilter("");
        setLink(null);
        setConfirmDelete(false);
        sidebar.done();
    };
    const goBack = () => { const to = back.at(-1); if (!to) return; setBack((b) => b.slice(0, -1)); setForward((f) => [place, ...f]); go(to, false); };
    const goForward = () => { const to = forward[0]; if (!to) return; setForward((f) => f.slice(1)); setBack((b) => [...b, place]); go(to, false); };
    const select = (path: string | null) => { setSelected(path); setLink(null); setConfirmDelete(false); };

    const start = (kind: Transfer["kind"], conn: string, dir: string[], item: Item) =>
        setTransfers((list) => [...list, { id: Date.now() + Math.random(), kind, conn, dir, item, progress: 0 }]);

    const newFolder = () => {
        const name = freeName(folder, s(["untitled folder", "未命名文件夹", "未命名檔案夾"]));
        folder.children!.push({ name, modified: now(), children: [] });
        const path = key([...place.path, name]);
        select(path);
        setRenaming({ path, name });
        changed();
    };
    const commitRename = () => {
        if (!renaming) return;
        const path = renaming.path.split("/");
        const parent = folderAt(conn.root, path.slice(0, -1));
        const item = parent?.children?.find((c) => c.name === path.at(-1));
        const name = renaming.name.trim();
        if (item && parent && name && name !== item.name && !parent.children!.some((c) => c.name === name)) {
            item.name = name;
            select(key([...path.slice(0, -1), name]));
        }
        setRenaming(null);
        changed();
    };
    const remove = () => {
        if (!selectedPath) return;
        const parent = folderAt(conn.root, selectedPath.slice(0, -1));
        if (parent) parent.children = parent.children!.filter((c) => c.name !== selectedPath.at(-1));
        select(null);
        changed();
    };
    const upload = () => {
        start("upload", conn.id, place.path, UPLOADS[uploads % UPLOADS.length]);
        setUploads((n) => n + 1);
    };
    const download = () => {
        if (selectedItem && selectedPath && !transfers.some((t) => t.kind === "download" && t.conn === conn.id && key(t.dir) === selected)) {
            start("download", conn.id, selectedPath, selectedItem);
        }
    };

    // Dropping a file: onto a folder of the same connection moves it; onto another connection copies it.
    const dragStart = (e: DragEvent, path: string) => {
        e.dataTransfer.setData(DRAG, JSON.stringify({ conn: conn.id, path }));
        e.dataTransfer.effectAllowed = "copyMove";
    };
    const dropOn = (target: string, accept: (from: { conn: string; path: string }) => void) => ({
        onDragOver: (e: DragEvent) => { if (e.dataTransfer.types.includes(DRAG)) { e.preventDefault(); setDropTarget(target); } },
        onDragLeave: () => setDropTarget((t) => (t === target ? null : t)),
        onDrop: (e: DragEvent) => {
            e.preventDefault();
            setDropTarget(null);
            const raw = e.dataTransfer.getData(DRAG);
            if (raw) accept(JSON.parse(raw));
        },
    });
    const dropIntoFolder = (dir: string[]) => (from: { conn: string; path: string }) => {
        const source = from.path.split("/");
        const target = folderAt(conn.root, dir);
        const parent = folderAt(conn.root, source.slice(0, -1));
        const item = parent?.children?.find((c) => c.name === source.at(-1));
        if (!item || !target || !parent || target === parent || key(dir).startsWith(from.path)) return;
        if (from.conn !== conn.id) return;
        parent.children = parent.children!.filter((c) => c !== item);
        target.children!.push({ ...item, name: freeName(target, item.name) });
        select(null);
        changed();
    };
    const dropOnConnection = (to: string, dir: string[]) => (from: { conn: string; path: string }) => {
        const source = conns.find((c) => c.id === from.conn);
        const item = source && itemAt(source.root, from.path.split("/"));
        if (!item || (to === from.conn && key(dir) === from.path.split("/").slice(0, -1).join("/"))) return;
        start("copy", to, dir, item);
    };

    // Rows: the folder's items, sorted folders first, with expanded folders' contents in place.
    const query = filter.trim().toLowerCase();
    const rows: { item: Item; path: string[]; depth: number }[] = [];
    const walk = (f: Item, path: string[], depth: number) => {
        for (const item of [...f.children!].sort((a, b) => Number(!!b.children) - Number(!!a.children) || a.name.localeCompare(b.name))) {
            const p = [...path, item.name];
            if (!query || item.name.toLowerCase().includes(query)) rows.push({ item, path: p, depth });
            if (item.children && (expanded.includes(`${conn.id}:${key(p)}`) && !query)) walk(item, p, depth + 1);
        }
    };
    walk(folder, place.path, 0);
    const incoming = transfers.filter((t) => t.kind !== "download" && t.conn === conn.id && key(t.dir) === key(place.path));
    const downloading = (path: string) => transfers.find((t) => t.kind === "download" && t.conn === conn.id && key(t.dir) === path);

    const date = (iso: string) => new Intl.DateTimeFormat(locale(lang), iso.includes("T") ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(new Date(iso.includes("T") ? iso : `${iso}T00:00`));
    // The inspector takes room from the list, so its secondary columns go sooner.
    const dateColumn = cn("w-40 max-md:hidden", inspector && "max-xl:hidden");
    const kindColumn = cn("w-28 pl-6 max-sm:hidden", inspector && "max-lg:hidden");
    const title = place.path.at(-1) ?? s(conn.name);
    const open = (path: string[], item: Item) => {
        if (item.children) go({ conn: conn.id, path });
        else select(key(path));
    };

    return (
        <MacWindow className={className}>
            <MacSidebar sidebar={sidebar}>
                <SidebarHeader>{s(["Connections", "连接", "連線"])}</SidebarHeader>
                <nav className="flex flex-col gap-0.5 overflow-y-auto pb-3">
                    {conns.map((c) => {
                        const current = c.id === place.conn && (c.protocol !== "s3" || !place.path.length);
                        return (
                            <Fragment key={c.id}>
                                <button
                                    type="button"
                                    aria-current={current || undefined}
                                    className={cn("mx-2.5 flex h-8 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-left", current ? MAC.selected : MAC.hover, dropTarget === c.id && "ring-2 ring-[#007aff]")}
                                    onClick={() => go({ conn: c.id, path: [] })}
                                    {...dropOn(c.id, dropOnConnection(c.id, []))}
                                >
                                    <SFSymbol name={PROTOCOLS[c.protocol].icon} className={cn("size-4 shrink-0", !current && MAC.accent)} />
                                    <span className="min-w-0 flex-1 truncate">{s(c.name)}</span>
                                    {transfers.some((t) => t.conn === c.id && t.kind !== "download") && <Ring progress={Math.min(...transfers.filter((t) => t.conn === c.id).map((t) => t.progress))} className={current ? "" : MAC.accent} />}
                                </button>
                                {c.protocol === "s3" && c.root.children!.filter((b) => b.children).map((bucket) => {
                                    const here = c.id === place.conn && place.path[0] === bucket.name;
                                    const target = `${c.id}/${bucket.name}`;
                                    return (
                                        <button
                                            key={bucket.name}
                                            type="button"
                                            aria-current={here || undefined}
                                            className={cn("mx-2.5 flex h-7 shrink-0 items-center gap-2 rounded-lg pr-2.5 pl-9 text-left", here ? MAC.selected : MAC.hover, dropTarget === target && "ring-2 ring-[#007aff]")}
                                            onClick={() => go({ conn: c.id, path: [bucket.name] })}
                                            {...dropOn(target, dropOnConnection(c.id, [bucket.name]))}
                                        >
                                            <SFSymbol name="cylinder" className={cn("size-3.5 shrink-0", !here && MAC.muted)} />
                                            <span className="min-w-0 flex-1 truncate">{bucket.name}</span>
                                        </button>
                                    );
                                })}
                            </Fragment>
                        );
                    })}
                </nav>
            </MacSidebar>

            <main className="relative flex min-w-0 flex-1 flex-col">
                <TitleBar
                    leading={
                        <>
                            <ShowSidebarButton sidebar={sidebar} />
                            <div className={cn(CAPSULE, "px-0.5 max-sm:hidden")}>
                                <ToolButton grouped icon="chevron.left" label={s(["Back", "返回", "返回"])} disabled={!back.length} onClick={goBack} className="size-3" />
                                <ToolButton grouped icon="chevron.right" label={s(["Forward", "前进", "前進"])} disabled={!forward.length} onClick={goForward} className="size-3" />
                            </div>
                        </>
                    }
                    title={title}
                    subtitle={s([`${folder.children!.length} items`, `${folder.children!.length} 项`, `${folder.children!.length} 個項目`])}
                >
                    <div className={cn(CAPSULE, "px-0.5 max-lg:hidden")}>
                        <ToolButton grouped icon="list.bullet" label={s(["as List", "列表", "列表"])} active={view === "list"} onClick={() => setView("list")} className="size-3.5" />
                        <ToolButton grouped icon="square.grid.2x2" label={s(["as Icons", "图标", "圖像"])} active={view === "icons"} onClick={() => setView("icons")} className="size-3.5" />
                    </div>
                    <div className={cn(CAPSULE, "relative gap-0.5 px-0.5")}>
                        <ToolButton grouped icon="plus" label={s(["New Folder", "新建文件夹", "新增檔案夾"])} onClick={newFolder} className="size-3.5" />
                        <ToolButton grouped icon="trash" label={s(["Delete", "删除", "刪除"])} disabled={!selectedItem} active={confirmDelete} onClick={() => setConfirmDelete((d) => !d)} />
                        <Popover open={confirmDelete && !!selectedItem} onClose={() => setConfirmDelete(false)} className="w-60 p-3">
                            <p className="font-semibold">{s([`Delete “${selectedItem?.name}”?`, `删除“${selectedItem?.name}”？`, `刪除「${selectedItem?.name}」？`])}</p>
                            <p className={cn("mt-1", MAC.muted)}>{s(["This can’t be undone.", "此操作无法撤销。", "此操作無法還原。"])}</p>
                            <div className="mt-3 flex justify-end gap-2">
                                <button type="button" className={cn("h-7 rounded-md px-3", MAC.field)} onClick={() => setConfirmDelete(false)}>{s(["Cancel", "取消", "取消"])}</button>
                                <button type="button" className="h-7 rounded-md bg-[#ff3b30] px-3 font-medium text-white" onClick={remove}>{s(["Delete", "删除", "刪除"])}</button>
                            </div>
                        </Popover>
                    </div>
                    <div className={cn(CAPSULE, "gap-0.5 px-0.5")}>
                        <ToolButton grouped icon="arrow.up" label={s(["Upload", "上传", "上傳"])} onClick={upload} className="size-3.5" />
                        <ToolButton grouped icon="arrow.down" label={s(["Download", "下载", "下載"])} disabled={!selectedItem || !!selectedItem.children} onClick={download} className="size-3.5" />
                    </div>
                    <ToolButton icon="sidebar.right" label={s(["Inspector", "检查器", "檢閱器"])} active={inspector} onClick={() => setInspector((o) => !o)} className="h-3.5 w-[18px]" />
                </TitleBar>

                <div className="flex items-center gap-2 px-3 pb-2">
                    <SearchField value={filter} placeholder={s(["Filter", "过滤", "過濾"])} onChange={setFilter} className="w-full sm:w-56" />
                </div>

                <div
                    className={cn("relative min-h-0 flex-1 overflow-y-auto border-t", MAC.line)}
                    onClick={(e) => e.target === e.currentTarget && select(null)}
                    {...dropOn("here", dropIntoFolder(place.path))}
                >
                    {view === "list" ? (
                        <div role="table" className="min-w-0" onClick={(e) => e.target === e.currentTarget && select(null)}>
                            <div role="row" className={cn("sticky top-0 z-10 flex h-7 items-center border-b px-3 text-[11px] font-medium", MAC.line, MAC.window, MAC.muted)}>
                                <span className="min-w-0 flex-1 pl-5">{s(["Name", "名称", "名稱"])}</span>
                                <span className={dateColumn}>{s(["Date Modified", "修改日期", "修改日期"])}</span>
                                <span className="w-20 text-right">{s(["Size", "大小", "大小"])}</span>
                                <span className={kindColumn}>{s(["Kind", "种类", "類型"])}</span>
                            </div>
                            {rows.map(({ item, path, depth }) => {
                                const k = key(path);
                                const isSelected = selected === k;
                                const isOpen = expanded.includes(`${conn.id}:${k}`);
                                const dl = downloading(k);
                                return (
                                    <div
                                        key={k}
                                        role="row"
                                        aria-selected={isSelected}
                                        draggable={renaming?.path !== k}
                                        onDragStart={(e) => dragStart(e, k)}
                                        {...(item.children ? dropOn(k, dropIntoFolder(path)) : {})}
                                        className={cn("mx-1.5 flex h-7 cursor-default items-center rounded-md px-1.5 select-none", isSelected ? MAC.selected : MAC.stripe, dropTarget === k && "ring-2 ring-[#007aff] ring-inset")}
                                        onClick={() => select(k)}
                                        onDoubleClick={() => open(path, item)}
                                    >
                                        <span className="flex min-w-0 flex-1 items-center gap-1.5" style={{ paddingLeft: depth * 16 }}>
                                            {item.children ? (
                                                <button
                                                    type="button"
                                                    aria-label={isOpen ? s(["Collapse", "收起", "收合"]) : s(["Expand", "展开", "展開"])}
                                                    aria-expanded={isOpen}
                                                    className="flex size-4 shrink-0 items-center justify-center"
                                                    onClick={(e) => { e.stopPropagation(); setExpanded((x) => (isOpen ? x.filter((p) => p !== `${conn.id}:${k}`) : [...x, `${conn.id}:${k}`])); }}
                                                >
                                                    <SFSymbol name="chevron.right" className={cn("size-2.5 transition-transform", !isSelected && MAC.muted, isOpen && "rotate-90")} />
                                                </button>
                                            ) : <span className="w-4 shrink-0" />}
                                            <SFSymbol name={iconOf(item)} className={cn("size-4 shrink-0", !isSelected && (item.children ? "text-[#1a8cff]" : MAC.muted))} />
                                            {renaming?.path === k ? (
                                                <input
                                                    autoFocus
                                                    aria-label={s(["Name", "名称", "名稱"])}
                                                    value={renaming.name}
                                                    className="min-w-0 flex-1 rounded-[3px] bg-white px-1 text-[#1d1d1f] outline-2 outline-[#007aff] dark:bg-[#1e1e1e] dark:text-[#ececec]"
                                                    onFocus={(e) => e.target.select()}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => setRenaming({ path: k, name: e.target.value })}
                                                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(null); }}
                                                    onBlur={commitRename}
                                                />
                                            ) : (
                                                <span className="truncate">{item.name}</span>
                                            )}
                                            {dl && <Ring progress={dl.progress} className="ml-auto" />}
                                        </span>
                                        <span className={cn(dateColumn, "truncate", !isSelected && MAC.muted)}>{date(item.modified)}</span>
                                        <span className={cn("w-20 text-right tabular-nums", !isSelected && MAC.muted)}>{item.children ? "--" : formatSize(item.size!)}</span>
                                        <span className={cn(kindColumn, "truncate", !isSelected && MAC.muted)}>{s(kindOf(item))}</span>
                                    </div>
                                );
                            })}
                            {incoming.map((t) => (
                                <div key={t.id} role="row" className={cn("mx-1.5 flex h-7 items-center rounded-md px-1.5 opacity-60", MAC.stripe)}>
                                    <span className="flex min-w-0 flex-1 items-center gap-1.5">
                                        <span className="w-4 shrink-0" />
                                        <SFSymbol name={iconOf(t.item)} className={cn("size-4 shrink-0", MAC.muted)} />
                                        <span className="truncate">{t.item.name}</span>
                                        <Ring progress={t.progress} className={cn("ml-auto", MAC.accent)} />
                                    </span>
                                    <span className={dateColumn} />
                                    <span className={cn("w-20 text-right tabular-nums", MAC.muted)}>{formatSize(Math.round(totalSize(t.item) * t.progress))}</span>
                                    <span className={cn(kindColumn, "truncate", MAC.muted)}>{s(kindOf(t.item))}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 p-3" onClick={(e) => e.target === e.currentTarget && select(null)}>
                            {rows.filter((r) => r.depth === 0).map(({ item, path }) => {
                                const k = key(path);
                                const isSelected = selected === k;
                                return (
                                    <div
                                        key={k}
                                        draggable
                                        onDragStart={(e) => dragStart(e, k)}
                                        {...(item.children ? dropOn(k, dropIntoFolder(path)) : {})}
                                        className={cn("flex cursor-default flex-col items-center gap-1 rounded-lg p-2 text-center select-none", dropTarget === k && "ring-2 ring-[#007aff]")}
                                        onClick={() => select(k)}
                                        onDoubleClick={() => open(path, item)}
                                    >
                                        <span className={cn("flex size-14 items-center justify-center rounded-lg", isSelected && "bg-black/8 dark:bg-white/12")}>
                                            <SFSymbol name={iconOf(item)} className={cn("size-10", item.children ? "text-[#1a8cff]" : MAC.muted)} />
                                        </span>
                                        <span className={cn("line-clamp-2 rounded px-1 text-[12px] break-all", isSelected && MAC.selected)}>{item.name}</span>
                                    </div>
                                );
                            })}
                            {incoming.map((t) => (
                                <div key={t.id} className="flex flex-col items-center gap-1 p-2 text-center opacity-60">
                                    <span className="relative flex size-14 items-center justify-center">
                                        <SFSymbol name={iconOf(t.item)} className={cn("size-10", MAC.muted)} />
                                        <Ring progress={t.progress} className={cn("absolute right-0 bottom-0 size-4", MAC.accent)} />
                                    </span>
                                    <span className="line-clamp-2 text-[12px] break-all">{t.item.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {!rows.length && !incoming.length && (
                        <p className={cn("absolute inset-x-0 top-1/3 text-center", MAC.muted)}>{query ? s(["No Results", "无结果", "沒有結果"]) : s(["Empty Folder", "空文件夹", "空檔案夾"])}</p>
                    )}
                </div>

                <nav className={cn("flex h-7 shrink-0 items-center gap-1 overflow-x-auto border-t px-3 text-[11px] whitespace-nowrap", MAC.line, MAC.muted)} aria-label={s(["Path", "路径", "路徑"])}>
                    <button type="button" className="flex items-center gap-1 hover:underline" onClick={() => go({ conn: conn.id, path: [] })}>
                        <SFSymbol name={PROTOCOLS[conn.protocol].icon} className="size-3" />{s(conn.name)}
                    </button>
                    {place.path.map((name, i) => (
                        <Fragment key={i}>
                            <SFSymbol name="chevron.right" className="size-2 opacity-60" />
                            <button type="button" className="hover:underline" onClick={() => go({ conn: conn.id, path: place.path.slice(0, i + 1) })}>{name}</button>
                        </Fragment>
                    ))}
                </nav>
            </main>

            <Inspector open={inspector} width={280}>
                <TitleBar title={s(["Inspector", "检查器", "檢閱器"])}>
                    <ToolButton icon="xmark" label={s(["Close", "关闭", "關閉"])} onClick={() => setInspector(false)} className="size-3" />
                </TitleBar>
                {selectedItem && selectedPath ? (
                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                        <div className="flex flex-col items-center gap-2 py-2 text-center">
                            <SFSymbol name={iconOf(selectedItem)} className={cn("size-14", selectedItem.children ? "text-[#1a8cff]" : MAC.muted)} />
                            <p className="font-semibold break-all">{selectedItem.name}</p>
                            <p className={MAC.muted}>{s(kindOf(selectedItem))} · {formatSize(totalSize(selectedItem))}</p>
                        </div>
                        <Info title={s(["Information", "信息", "資訊"])} rows={[
                            [s(["Modified", "修改时间", "修改時間"]), date(selectedItem.modified)],
                            [s(["Path", "路径", "路徑"]), `/${key(selectedPath)}`],
                            ...(selectedItem.mode ? [[s(["Permissions", "权限", "權限"]), selectedItem.mode], [s(["Owner", "所有者", "擁有者"]), selectedItem.owner!]] as [string, string][] : []),
                            ...(conn.protocol === "webdav" ? [["URL", `https://${conn.address}/remote.php/dav/files/team/${key(selectedPath)}`]] as [string, string][] : []),
                        ]} />
                        {selectedItem.meta && (
                            <section>
                                <h5 className={cn("mb-1.5 text-[11px] font-semibold", MAC.muted)}>{s(["Metadata", "元数据", "中繼資料"])}</h5>
                                {(["type", "cache"] as const).map((field) => (
                                    <label key={field} className="mb-1.5 flex items-center gap-2">
                                        <span className={cn("w-24 shrink-0 text-[12px]", MAC.muted)}>{field === "type" ? "Content-Type" : "Cache-Control"}</span>
                                        <input value={selectedItem.meta![field]} className={cn("h-6 min-w-0 flex-1 px-1.5 font-mono text-[11px]", MAC.field)} onChange={(e) => { selectedItem.meta![field] = e.target.value; changed(); }} />
                                    </label>
                                ))}
                            </section>
                        )}
                        {conn.protocol === "s3" && !selectedItem.children && (
                            <section>
                                <h5 className={cn("mb-1.5 text-[11px] font-semibold", MAC.muted)}>{s(["Share Link", "分享链接", "分享連結"])}</h5>
                                <Segmented options={EXPIRIES.map((x) => ({ value: x.value, label: s(x.label) }))} value={expiry} onChange={(v) => { setExpiry(v); setLink(null); }} className="w-full" />
                                {link ? (
                                    <button type="button" className={cn("mt-2 block w-full truncate px-2 py-1.5 text-left font-mono text-[11px]", MAC.field)} title={link} onClick={() => void navigator.clipboard?.writeText(link)}>
                                        {link}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className={cn("mt-2 h-7 w-full rounded-md font-medium", MAC.accentBg)}
                                        onClick={() => setLink(`https://${place.path[0]}.s3.amazonaws.com/${selectedPath.slice(1).join("/")}?X-Amz-Expires=${EXPIRIES.find((x) => x.value === expiry)!.seconds}&X-Amz-Signature=${Math.random().toString(16).slice(2, 14)}`)}
                                    >
                                        {s(["Copy Link", "拷贝链接", "拷貝連結"])}
                                    </button>
                                )}
                            </section>
                        )}
                    </div>
                ) : (
                    <Unavailable icon="info.circle" title={s(["No Selection", "未选择", "未選擇"])} />
                )}
            </Inspector>
        </MacWindow>
    );
}

function Info({ title, rows }: { title: string; rows: [string, string][] }) {
    return (
        <section>
            <h5 className={cn("mb-1.5 text-[11px] font-semibold", MAC.muted)}>{title}</h5>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
                {rows.map(([label, value]) => (
                    <Fragment key={label}>
                        <dt className={MAC.muted}>{label}</dt>
                        <dd className="min-w-0 break-all">{value}</dd>
                    </Fragment>
                ))}
            </dl>
        </section>
    );
}

/** The local time as an ISO date and minute, like the dates in the data. */
function now() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function itemAt(root: Item, path: string[]): Item | undefined {
    let at: Item | undefined = root;
    for (const name of path) at = at?.children?.find((c) => c.name === name);
    return at;
}
