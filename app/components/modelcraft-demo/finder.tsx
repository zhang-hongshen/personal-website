import { useEffect, useState } from "react";

import applicationsIcon from "~/assets/macos/sidebar/applications.png";
import desktopIcon from "~/assets/macos/sidebar/desktop.png";
import documentsIcon from "~/assets/macos/sidebar/documents.png";
import downloadsIcon from "~/assets/macos/sidebar/downloads.png";
import moviesIcon from "~/assets/macos/sidebar/movies.png";
import musicIcon from "~/assets/macos/sidebar/music.png";
import picturesIcon from "~/assets/macos/sidebar/pictures.png";
import { useText, type L } from "~/components/demo-text";
import { MAC, MacSidebar, MacWindow, Popover, ShowSidebarButton, SidebarHeader, useSidebar } from "~/components/mac-ui";
import { CAPSULE, TOOL_ITEM } from "~/components/mac-window";
import { ProductIcon } from "~/components/product-icon";
import { SFSymbol, type SymbolName } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";

// A Finder window on the ModelCraft demo's desktop, after the macOS one: the Favorites everyone has in the
// sidebar (with Finder's own icons, exported from macOS at 3x), back and forward, the icon and list views,
// Sort By and the path bar. Applications holds the apps on this site; double-clicking one opens its demo.
// The other folders are empty, as on a new Mac.

export type FolderId = "desktop" | "documents" | "downloads" | "applications" | "music" | "movies" | "pictures";

/** Each Favorite with its sidebar icon, as [image, width, height] in points. */
const FOLDERS: Record<FolderId, { title: L; icon: [string, number, number] }> = {
    desktop: { title: ["Desktop", "桌面", "桌面"], icon: [desktopIcon, 77 / 3, 59 / 3] },
    documents: { title: ["Documents", "文稿", "文件"], icon: [documentsIcon, 59 / 3, 67 / 3] },
    downloads: { title: ["Downloads", "下载", "下載項目"], icon: [downloadsIcon, 64 / 3, 64 / 3] },
    applications: { title: ["Applications", "应用程序", "應用程式"], icon: [applicationsIcon, 64 / 3, 64 / 3] },
    music: { title: ["Music", "音乐", "音樂"], icon: [musicIcon, 47 / 3, 64 / 3] },
    movies: { title: ["Movies", "影片", "影片"], icon: [moviesIcon, 77 / 3, 59 / 3] },
    pictures: { title: ["Pictures", "图片", "圖片"], icon: [picturesIcon, 77 / 3, 59 / 3] },
};
const FAVORITES = Object.keys(FOLDERS) as FolderId[];

export const folderTitle = (id: FolderId) => FOLDERS[id].title;

type App = { id: string; name: string; bytes: number; modified: number };

/** The apps in Applications, with their size and when they were last updated (a day in October 2026). */
const APPS: App[] = [
    { id: "arthub", name: "Arthub", bytes: 38.2e6, modified: 12 },
    { id: "cellar", name: "Cellar", bytes: 21.7e6, modified: 13 },
    { id: "container", name: "Container", bytes: 14.9e6, modified: 14 },
    { id: "keel", name: "Keel", bytes: 9.8e6, modified: 15 },
    { id: "modelcraft", name: "ModelCraft", bytes: 52.4e6, modified: 20 },
    { id: "quaero", name: "Quaero", bytes: 12.3e6, modified: 17 },
];

type Sort = "name" | "kind" | "modified" | "size";
const SORTS: { id: Sort; label: L }[] = [
    { id: "name", label: ["Name", "名称", "名稱"] },
    { id: "kind", label: ["Kind", "种类", "種類"] },
    { id: "modified", label: ["Date Modified", "修改日期", "修改日期"] },
    { id: "size", label: ["Size", "大小", "大小"] },
];
const KIND: L = ["Application", "应用程序", "應用程式"];

export function FinderWindow({ goTo, onOpenApp }: {
    /** A folder to show, with a count that changes each time it should be shown again. */
    goTo: { folder: FolderId; n: number } | null;
    onOpenApp: (app: string) => void;
}) {
    const s = useText();
    const sidebar = useSidebar();
    // Back and forward, as in a browser: folders behind the current one, and ones gone back from.
    const [history, setHistory] = useState<{ back: FolderId[]; at: FolderId; forward: FolderId[] }>({ back: [], at: "applications", forward: [] });
    const [view, setView] = useState<"icons" | "list">("icons");
    const [sort, setSort] = useState<{ by: Sort; up: boolean }>({ by: "name", up: true });
    const [sorting, setSorting] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const folder = history.at;

    const go = (to: FolderId) => {
        setHistory((h) => (h.at === to ? h : { back: [...h.back, h.at], at: to, forward: [] }));
        setSelected(null);
    };
    useEffect(() => {
        if (goTo) go(goTo.folder);
    }, [goTo]);

    const step = (dir: "back" | "forward") => {
        setHistory((h) => {
            const from = dir === "back" ? h.back : h.forward;
            if (!from.length) return h;
            const to = from[from.length - 1];
            return dir === "back"
                ? { back: h.back.slice(0, -1), at: to, forward: [h.at, ...h.forward] }
                : { back: [...h.back, h.at], at: to, forward: h.forward.slice(1) };
        });
        setSelected(null);
    };

    const apps = folder === "applications"
        ? [...APPS].sort((a, b) => {
            const by = sort.by === "size" ? a.bytes - b.bytes : sort.by === "modified" ? a.modified - b.modified : a.name.localeCompare(b.name);
            return (sort.up ? 1 : -1) * (by || a.name.localeCompare(b.name));
        })
        : [];
    const date = (day: number) => s([`${day} Oct 2026 at 10:24`, `2026年10月${day}日 10:24`, `2026年10月${day}日 上午10:24`]);
    const size = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`;
    const pick = (by: Sort) => setSort((x) => ({ by, up: x.by === by ? !x.up : by === "name" || by === "kind" }));

    return (
        <MacWindow className="h-full rounded-[12px]">
            <MacSidebar sidebar={sidebar} width={190}>
                <SidebarHeader>{s(["Favorites", "个人收藏", "喜好項目"])}</SidebarHeader>
                <nav className="flex flex-col gap-0.5">
                    {FAVORITES.map((id) => {
                        const [src, width, height] = FOLDERS[id].icon;
                        const on = folder === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                aria-current={on || undefined}
                                className={cn("mx-2.5 flex h-8 shrink-0 items-center gap-2 rounded-lg px-2 text-left", on ? "bg-black/8 font-semibold dark:bg-white/12" : MAC.hover)}
                                onClick={() => go(id)}
                            >
                                {/* The image is a template: its shape, filled with the accent color. */}
                                <span className="flex w-[26px] shrink-0 justify-center">
                                    <span
                                        aria-hidden
                                        className="bg-[#007aff] dark:bg-[#0a84ff]"
                                        style={{ width, height, mask: `url(${src}) center / contain no-repeat`, WebkitMask: `url(${src}) center / contain no-repeat` }}
                                    />
                                </span>
                                <span className="min-w-0 flex-1 truncate">{s(FOLDERS[id].title)}</span>
                            </button>
                        );
                    })}
                </nav>
            </MacSidebar>

            <main className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-[52px] shrink-0 items-center gap-2 px-3">
                    <ShowSidebarButton sidebar={sidebar} />
                    <div className={cn(CAPSULE, "px-0.5")}>
                        <button type="button" aria-label={s(["Back", "返回", "上一頁"])} disabled={!history.back.length} className={TOOL_ITEM} onClick={() => step("back")}>
                            <SFSymbol name="chevron.left" className="size-3.5" />
                        </button>
                        <i className="h-4 w-px bg-black/12 dark:bg-white/15" />
                        <button type="button" aria-label={s(["Forward", "前进", "下一頁"])} disabled={!history.forward.length} className={TOOL_ITEM} onClick={() => step("forward")}>
                            <SFSymbol name="chevron.right" className="size-3.5" />
                        </button>
                    </div>
                    <h4 className="mr-auto min-w-0 truncate pl-1 text-[15px] font-semibold">{s(FOLDERS[folder].title)}</h4>
                    <div role="radiogroup" aria-label={s(["View", "显示", "顯示方式"])} className={cn(CAPSULE, "gap-0.5 px-0.5")}>
                        {([["icons", "square.grid.2x2", ["as Icons", "图标", "圖像"]], ["list", "list.bullet", ["as List", "列表", "列表"]]] as [typeof view, SymbolName, L][]).map(([id, icon, label]) => (
                            <button
                                key={id}
                                type="button"
                                role="radio"
                                aria-checked={view === id}
                                aria-label={s(label)}
                                title={s(label)}
                                className={cn(TOOL_ITEM, "w-9", view === id && "bg-black/10 dark:bg-white/15")}
                                onClick={() => setView(id)}
                            >
                                <SFSymbol name={icon} className="size-4" />
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <button type="button" aria-label={s(["Sort By", "排序方式", "排序方式"])} title={s(["Sort By", "排序方式", "排序方式"])} aria-expanded={sorting} className={cn(CAPSULE, "gap-1 px-2.5")} onClick={() => setSorting((o) => !o)}>
                            <SFSymbol name="line.3.horizontal.decrease.circle" className="size-4" />
                            <SFSymbol name="chevron.down" className="size-2" />
                        </button>
                        <Popover open={sorting} onClose={() => setSorting(false)} className="w-[190px]">
                            <p className={cn("px-2 pt-0.5 pb-1 text-[11px] font-semibold", MAC.muted)}>{s(["Sort By", "排序方式", "排序方式"])}</p>
                            {SORTS.map((o) => (
                                <button
                                    key={o.id}
                                    type="button"
                                    className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1 text-left", MAC.hover)}
                                    onClick={() => {
                                        setSort({ by: o.id, up: o.id === "name" || o.id === "kind" });
                                        setSorting(false);
                                    }}
                                >
                                    <SFSymbol name="checkmark" className={cn("size-2.5", sort.by !== o.id && "invisible")} />
                                    {s(o.label)}
                                </button>
                            ))}
                        </Popover>
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto" onClick={() => setSelected(null)}>
                    {view === "icons" ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] content-start gap-y-4 p-4">
                            {apps.map((app) => {
                                const on = selected === app.id;
                                return (
                                    <button
                                        key={app.id}
                                        type="button"
                                        aria-pressed={on}
                                        className="flex cursor-default flex-col items-center gap-1.5"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelected(app.id);
                                        }}
                                        onDoubleClick={() => onOpenApp(app.id)}
                                    >
                                        <span className={cn("rounded-lg p-1.5", on && "bg-black/8 dark:bg-white/12")}>
                                            <ProductIcon id={app.id} className="size-16" width={64} height={64} />
                                        </span>
                                        <span className={cn("max-w-full truncate rounded px-1.5 text-[12px]", on && MAC.selected)}>{app.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <table className="w-full table-fixed text-[13px]">
                            <thead className={cn("sticky top-0 border-b text-left text-[11px]", MAC.line, MAC.window, MAC.muted)}>
                                <tr>
                                    {SORTS.map((o) => (
                                        <th
                                            key={o.id}
                                            className={cn("px-3 py-1 font-normal", o.id === "name" ? "w-[38%]" : o.id === "modified" ? "w-[30%]" : o.id === "size" ? "w-[14%] text-right" : "w-[18%]")}
                                            aria-sort={sort.by === o.id ? (sort.up ? "ascending" : "descending") : undefined}
                                        >
                                            <button type="button" className={cn("inline-flex items-center gap-1", sort.by === o.id && "font-semibold text-[#1d1d1f] dark:text-[#ececec]")} onClick={() => pick(o.id)}>
                                                {s(o.label)}
                                                {sort.by === o.id && <SFSymbol name="chevron.down" className={cn("size-2", sort.up && "rotate-180")} />}
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {apps.map((app) => {
                                    const on = selected === app.id;
                                    return (
                                        <tr
                                            key={app.id}
                                            aria-selected={on}
                                            className={cn("cursor-default", on ? MAC.selected : MAC.stripe)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelected(app.id);
                                            }}
                                            onDoubleClick={() => onOpenApp(app.id)}
                                        >
                                            <td className="px-3 py-1">
                                                <span className="flex items-center gap-2">
                                                    <ProductIcon id={app.id} className="size-5 shrink-0" width={20} height={20} />
                                                    <span className="truncate">{app.name}</span>
                                                </span>
                                            </td>
                                            <td className={cn("truncate px-3 py-1", !on && MAC.muted)}>{s(KIND)}</td>
                                            <td className={cn("truncate px-3 py-1", !on && MAC.muted)}>{date(app.modified)}</td>
                                            <td className={cn("px-3 py-1 text-right", !on && MAC.muted)}>{size(app.bytes)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <PathBar folder={folder} />
            </main>
        </MacWindow>
    );
}

/** The path bar along the bottom: where the folder is, from the disk down. */
function PathBar({ folder }: { folder: FolderId }) {
    const s = useText();
    const path: [SymbolName, string][] = folder === "applications"
        ? [["internaldrive", "Macintosh HD"], ["folder", s(FOLDERS.applications.title)]]
        : [["internaldrive", "Macintosh HD"], ["folder", s(["Users", "用户", "使用者"])], ["folder", "guest"], ["folder", s(FOLDERS[folder].title)]];
    return (
        <footer className={cn("flex h-7 shrink-0 items-center gap-1 overflow-hidden border-t px-3 text-[11px] whitespace-nowrap", MAC.line, MAC.muted)}>
            {path.map(([icon, name], i) => (
                <span key={i} className="flex items-center gap-1">
                    {i > 0 && <SFSymbol name="chevron.right" className="size-2 opacity-60" />}
                    <SFSymbol name={icon} className={cn("size-3", icon === "folder" && "text-[#1e9bf0]")} />
                    {name}
                </span>
            ))}
        </footer>
    );
}
