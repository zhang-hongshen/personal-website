import { useEffect, useState } from "react";

import { useText, type L } from "~/components/demo-text";
import applicationsIcon from "~/assets/macos/sidebar/applications.png";
import desktopIcon from "~/assets/macos/sidebar/desktop.png";
import documentsIcon from "~/assets/macos/sidebar/documents.png";
import downloadsIcon from "~/assets/macos/sidebar/downloads.png";
import moviesIcon from "~/assets/macos/sidebar/movies.png";
import musicIcon from "~/assets/macos/sidebar/music.png";
import picturesIcon from "~/assets/macos/sidebar/pictures.png";
import { MAC, MacSidebar, MacWindow, ShowSidebarButton, SidebarHeader, TitleBar, ToolButton, useSidebar } from "~/components/mac-ui";
import { ProductIcon } from "~/components/product-icon";
import { SFSymbol, type SymbolName } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";

// A Finder window on the ModelCraft demo's desktop: a few folders of a made-up home folder, with the
// apps in Applications. Opening an app opens its demo. The sidebar uses Finder's own icons, exported
// from macOS at 3x.

export type FolderId = "applications" | "desktop" | "documents" | "downloads" | "music" | "movies" | "pictures" | "takes";
export type Item = { name: L | string; date: L | string; size: string } & ({ kind: "app"; app: string } | { kind: "folder"; to: FolderId } | { kind: "file"; icon: SymbolName });

const APPS = ["arthub", "cellar", "container", "keel", "modelcraft", "quaero"];
const APP_NAME: Record<string, string> = {
    arthub: "Arthub", cellar: "Cellar", container: "Container", keel: "Keel", modelcraft: "ModelCraft", quaero: "Quaero",
};

const TODAY = (time: string): L => [`Today, ${time}`, `今天 ${time}`, `今天 ${time}`];
const OCTOBER = (day: number): L => [`${day} Oct 2026`, `2026年10月${day}日`, `2026年10月${day}日`];

/** Each folder, with the image of its row in the sidebar (with its size in points) for the ones listed there. */
const FOLDERS: Record<FolderId, { title: L; icon?: [src: string, width: number, height: number]; items: Item[] }> = {
    applications: {
        title: ["Applications", "应用程序", "應用程式"], icon: [applicationsIcon, 64 / 3, 64 / 3],
        items: APPS.map((app, i) => ({ kind: "app", app, name: APP_NAME[app], date: OCTOBER(12 + i), size: ["38.2 MB", "21.7 MB", "14.9 MB", "9.8 MB", "52.4 MB", "12.3 MB"][i] })),
    },
    desktop: {
        title: ["Desktop", "桌面", "桌面"], icon: [desktopIcon, 77 / 3, 59 / 3],
        items: [
            { kind: "file", icon: "doc.text", name: ["Lumen 2.0 launch plan.pdf", "Lumen 2.0 发布计划.pdf", "Lumen 2.0 發布計畫.pdf"], date: TODAY("09:42"), size: "1.2 MB" },
            { kind: "file", icon: "doc", name: ["Screenshot 2026-10-24 at 21.14.png", "截屏2026-10-24 21.14.png", "截圖 2026-10-24 21.14.png"], date: OCTOBER(24), size: "842 KB" },
        ],
    },
    documents: {
        title: ["Documents", "文稿", "文件"], icon: [documentsIcon, 59 / 3, 67 / 3],
        items: [
            { kind: "file", icon: "doc.text", name: ["Kyoto trip.pdf", "京都旅行.pdf", "京都旅行.pdf"], date: TODAY("16:03"), size: "3.4 MB" },
            { kind: "file", icon: "doc.text", name: ["Sync engine design.pdf", "同步引擎设计.pdf", "同步引擎設計.pdf"], date: TODAY("11:15"), size: "615 KB" },
            { kind: "file", icon: "tablecells", name: ["Preset pricing.csv", "预设定价.csv", "預設定價.csv"], date: OCTOBER(22), size: "4 KB" },
        ],
    },
    downloads: {
        title: ["Downloads", "下载", "下載項目"], icon: [downloadsIcon, 64 / 3, 64 / 3],
        items: [
            { kind: "file", icon: "externaldrive", name: "ModelCraft-0.9.0.dmg", date: OCTOBER(20), size: "48.9 MB" },
            { kind: "file", icon: "doc.text", name: ["Klara and the Sun.epub", "克拉拉与太阳.epub", "克拉拉與太陽.epub"], date: OCTOBER(3), size: "1.8 MB" },
        ],
    },
    music: {
        title: ["Music", "音乐", "音樂"], icon: [musicIcon, 47 / 3, 64 / 3],
        items: [{ kind: "folder", to: "takes", name: "Takes", date: TODAY("10:20"), size: "--" }],
    },
    movies: {
        title: ["Movies", "影片", "影片"], icon: [moviesIcon, 77 / 3, 59 / 3],
        items: [
            { kind: "file", icon: "film", name: ["Kyoto trip.mov", "京都旅行.mov", "京都旅行.mov"], date: OCTOBER(18), size: "1.4 GB" },
            { kind: "file", icon: "film", name: ["Lumen 2.0 teaser.mp4", "Lumen 2.0 预告片.mp4", "Lumen 2.0 預告片.mp4"], date: OCTOBER(9), size: "86.2 MB" },
        ],
    },
    pictures: {
        title: ["Pictures", "图片", "圖片"], icon: [picturesIcon, 77 / 3, 59 / 3],
        items: [
            { kind: "file", icon: "doc", name: "IMG_2041.HEIC", date: OCTOBER(18), size: "2.9 MB" },
            { kind: "file", icon: "doc", name: "IMG_2042.HEIC", date: OCTOBER(18), size: "3.1 MB" },
            { kind: "file", icon: "doc", name: ["Preset cover.png", "预设封面.png", "預設封面.png"], date: OCTOBER(21), size: "1.6 MB" },
        ],
    },
    takes: {
        title: ["Takes", "Takes", "Takes"],
        items: [
            { kind: "file", icon: "waveform", name: "chorus-take-3.wav", date: TODAY("10:20"), size: "21.3 MB" },
            { kind: "file", icon: "waveform", name: "verse-take-1.wav", date: ["Yesterday, 22:47", "昨天 22:47", "昨天 22:47"], size: "18.6 MB" },
        ],
    },
};

const SIDEBAR: FolderId[] = ["desktop", "documents", "downloads", "applications", "music", "movies", "pictures"];

export const folderTitle = (id: FolderId) => FOLDERS[id].title;

export function FinderWindow({ goTo, onOpenApp }: {
    /** A folder to show, with a count that changes each time it should be shown again. */
    goTo: { folder: FolderId; n: number } | null;
    onOpenApp: (app: string) => void;
}) {
    const s = useText();
    const sidebar = useSidebar();
    // Folders visited, the current one last.
    const [path, setPath] = useState<FolderId[]>(["applications"]);
    const [selected, setSelected] = useState<string | null>(null);
    const folder = path[path.length - 1];
    const items = FOLDERS[folder].items;

    useEffect(() => {
        if (!goTo) return;
        setPath(goTo.folder === "takes" ? ["music", "takes"] : [goTo.folder]);
        setSelected(null);
    }, [goTo]);

    const go = (to: FolderId, from: FolderId[] = []) => {
        setPath([...from, to]);
        setSelected(null);
        sidebar.done();
    };
    const open = (item: Item) => {
        if (item.kind === "app") onOpenApp(item.app);
        else if (item.kind === "folder") go(item.to, path);
    };

    return (
        <MacWindow className="h-full rounded-[12px]">
            <MacSidebar sidebar={sidebar} width={180}>
                <SidebarHeader>{s(["Favorites", "个人收藏", "喜好項目"])}</SidebarHeader>
                <nav className="flex flex-col gap-0.5">
                    {SIDEBAR.map((id) => {
                        const [src, width, height] = FOLDERS[id].icon!;
                        const on = path[0] === id;
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
                <TitleBar
                    leading={
                        <>
                            <ShowSidebarButton sidebar={sidebar} />
                            <ToolButton icon="chevron.left" label={s(["Back", "返回", "返回"])} disabled={path.length < 2} onClick={() => setPath((p) => p.slice(0, -1))} />
                        </>
                    }
                    title={s(FOLDERS[folder].title)}
                    subtitle={s([`${items.length} items`, `${items.length} 项`, `${items.length} 個項目`])}
                />
                <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2" onClick={() => setSelected(null)}>
                    <table className="w-full table-fixed">
                        <thead>
                            <tr className={cn("text-left text-[11px]", MAC.muted)}>
                                <th className="px-2 py-1 font-normal">{s(["Name", "名称", "名稱"])}</th>
                                <th className="hidden w-[140px] px-2 py-1 font-normal sm:table-cell">{s(["Date Modified", "修改日期", "修改日期"])}</th>
                                <th className="w-[72px] px-2 py-1 text-right font-normal">{s(["Size", "大小", "大小"])}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                const name = s(item.name);
                                const on = selected === name;
                                return (
                                    <tr
                                        key={name}
                                        aria-selected={on}
                                        className={cn("cursor-default", on ? MAC.selected : MAC.stripe)}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelected(name);
                                        }}
                                        onDoubleClick={() => open(item)}
                                    >
                                        <td className="rounded-l-md px-2 py-1">
                                            <span className="flex items-center gap-2">
                                                {item.kind === "app" ? (
                                                    <ProductIcon id={item.app} className="size-5 shrink-0" width={20} height={20} />
                                                ) : (
                                                    <SFSymbol name={item.kind === "folder" ? "folder" : item.icon} className={cn("size-4 shrink-0", !on && (item.kind === "folder" ? "text-[#1e9bf0]" : MAC.muted))} />
                                                )}
                                                <span className="truncate">{name}</span>
                                            </span>
                                        </td>
                                        <td className={cn("hidden truncate px-2 py-1 sm:table-cell", !on && MAC.muted)}>{s(item.date)}</td>
                                        <td className={cn("rounded-r-md px-2 py-1 text-right", !on && MAC.muted)}>{item.size}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {folder === "applications" && <p className={cn("mt-3 px-2 text-[11px]", MAC.muted)}>{s(["Double-click an app to open it.", "连按一个 App 来打开它。", "按兩下 App 來打開它。"])}</p>}
                </div>
            </main>
        </MacWindow>
    );
}
