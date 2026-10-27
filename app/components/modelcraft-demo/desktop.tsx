import { lazy, Suspense, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Link } from "react-router";

import finderIcon from "~/assets/macos/finder.png";
import { locale, useLang, useText, type L } from "~/components/demo-text";
import { Spinner, TrafficLights, WindowControls } from "~/components/mac-ui";
import { MAC_FONT } from "~/components/mac-window";
import { ProductIcon } from "~/components/product-icon";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { CONNECTOR_NAME, type ConnectorId, type Tool } from "./conversations";
import { CONNECTORS } from "./data";
import { FinderWindow, folderTitle, type FolderId } from "./finder";
import { AppleLogo, MenuBar, Spotlight, type Menu, type MenuItem } from "./menubar";

// The Mac around the ModelCraft window: a wallpaper, the menu bar and a Dock with Finder,
// ModelCraft and the apps it connects to. Each app opens as a window running its own full demo; windows
// drag by their title bar, resize from their edges, zoom, minimize and close, and the menus, Spotlight
// and Control Center work.

/** An app on the desktop: Finder, ModelCraft, or a connector's product id. */
export type AppKey = ConnectorId | "modelcraft" | "Finder";

/** What the ModelCraft window can ask of the desktop. */
export type DesktopApi = {
    /** An app is being used: its icon bounces and its window comes forward. */
    use: (app: AppKey) => void;
    /** Brings a window forward. */
    focus: (app: AppKey) => void;
};

const DOCK: AppKey[] = ["Finder", "modelcraft", "container", "quaero", "keel", "cellar", "arthub"];
const FOLDERS: FolderId[] = ["desktop", "documents", "downloads", "applications", "music", "movies", "pictures"];

const appLabel = (app: AppKey): L | string => (app === "modelcraft" ? "ModelCraft" : app === "Finder" ? ["Finder", "访达", "Finder"] : CONNECTOR_NAME[app]);

/** The app a tool call works in, if it is on this desktop. */
export function appOf(tool: Tool): AppKey | null {
    if (tool.kind === "connector") return tool.app;
    if (tool.kind === "file") return "Finder";
    return null;
}

// The other apps' demos load when their window first opens.
const ArthubDemo = lazy(() => import("~/components/arthub-demo").then((m) => ({ default: m.ArthubDemo })));
const CellarDemo = lazy(() => import("~/components/cellar-demo").then((m) => ({ default: m.CellarDemo })));
const ContainerDemo = lazy(() => import("~/components/container-demo").then((m) => ({ default: m.ContainerDemo })));
const KeelDemo = lazy(() => import("~/components/keel-demo").then((m) => ({ default: m.KeelDemo })));
const QuaeroDemo = lazy(() => import("~/components/quaero-demo").then((m) => ({ default: m.QuaeroDemo })));

const WINDOW = "h-full rounded-[12px] shadow-[0_20px_60px_-15px_rgb(0_0_0/0.45)]";

function Demo({ app }: { app: ConnectorId }) {
    switch (app) {
        case "arthub": return <ArthubDemo className={WINDOW} />;
        case "cellar": return <CellarDemo className="h-full" embedded />;
        case "container": return <ContainerDemo className={WINDOW} />;
        case "keel": return <KeelDemo className={WINDOW} />;
        case "quaero": return <QuaeroDemo className={WINDOW} />;
    }
}

function AppIcon({ app, className }: { app: AppKey; className?: string }) {
    if (app === "Finder") return <img src={finderIcon} alt="" width={48} height={48} className={className} draggable={false} />;
    return <ProductIcon id={app} className={className} width={48} height={48} />;
}

/** The width the desktop never shrinks below; narrower screens scroll it sideways instead. */
export const DESKTOP_MIN_WIDTH = 960;

/** The desktop, started again from scratch by Restart. */
export function Desktop({ className, children }: { className?: string; /** The ModelCraft window. */ children: (api: DesktopApi) => ReactNode }) {
    const [boot, setBoot] = useState(0);
    const [restarting, setRestarting] = useState(false);
    useEffect(() => {
        if (!restarting) return;
        const timer = setTimeout(() => {
            setBoot((b) => b + 1);
            setRestarting(false);
        }, 1800);
        return () => clearTimeout(timer);
    }, [restarting]);

    return (
        <div
            className={cn("@container relative h-[min(760px,88vh)] w-full shrink-0 overflow-hidden rounded-[18px] border border-black/12 shadow-[0_24px_70px_-20px_rgb(0_0_0/0.35)] dark:border-white/12", className)}
            style={{ fontFamily: MAC_FONT, minWidth: DESKTOP_MIN_WIDTH }}
        >
            <Session key={boot} onRestart={() => setRestarting(true)}>{children}</Session>
            {restarting && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-black motion-safe:animate-in motion-safe:fade-in">
                    <AppleLogo className="size-14 text-white" />
                    <span className="h-1 w-40 overflow-hidden rounded-full bg-white/25">
                        <i className="block h-full w-full origin-left rounded-full bg-white motion-safe:animate-[boot_1.6s_ease-in-out_forwards]" />
                    </span>
                </div>
            )}
        </div>
    );
}

/** Where a window has been moved (from its usual spot) and, once resized, its size. */
type Place = { dx: number; dy: number; zoomed: boolean; width?: number; height?: number };
type Found = { app?: AppKey; folder?: FolderId };
type Dialog = { kind: "mac" } | { kind: "app"; app: AppKey };

function Session({ onRestart, children }: { onRestart: () => void; children: (api: DesktopApi) => ReactNode }) {
    const s = useText();
    const desk = useRef<HTMLDivElement>(null);
    // Windows opened so far (closed ones keep their state until quit) and the ones showing, back to front.
    const [opened, setOpened] = useState<AppKey[]>([]);
    const [order, setOrder] = useState<AppKey[]>(["modelcraft"]);
    const [places, setPlaces] = useState<Partial<Record<AppKey, Place>>>({});
    const [bounce, setBounce] = useState<{ app: AppKey; n: number } | null>(null);
    const [finderAt, setFinderAt] = useState<{ folder: FolderId; n: number } | null>(null);
    const [spotlight, setSpotlight] = useState(false);
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const [screen, setScreen] = useState<"on" | "sleep" | "locked">("on");
    const [brightness, setBrightness] = useState(1);
    const [volume, setVolume] = useState(0.6);
    // Off to start with: ModelCraft works without a network.
    const [wifi, setWifi] = useState(false);

    const front = order[order.length - 1] ?? null;
    // With no window in front, Finder is the active app, as on a Mac.
    const active: AppKey = front ?? "Finder";
    const name = s(appLabel(active));

    const raise = (app: AppKey) => {
        setOpened((o) => (app === "modelcraft" || o.includes(app) ? o : [...o, app]));
        setOrder((o) => (o[o.length - 1] === app ? o : [...o.filter((x) => x !== app), app]));
    };
    const close = (app: AppKey) => setOrder((o) => o.filter((x) => x !== app));
    const quit = (app: AppKey) => {
        close(app);
        if (app !== "modelcraft") setOpened((o) => o.filter((x) => x !== app));
        setPlaces(({ [app]: _, ...rest }) => rest);
    };
    const bounceOnce = (app: AppKey) => setBounce((b) => ({ app, n: (b?.n ?? 0) + 1 }));
    const launch = (app: AppKey) => {
        if (!order.includes(app)) bounceOnce(app);
        raise(app);
    };
    const zoom = (app: AppKey) => setPlaces((p) => ({ ...p, [app]: { dx: 0, dy: 0, ...p[app], zoomed: !p[app]?.zoomed } }));
    const openFolder = (folder: FolderId) => {
        setFinderAt((f) => ({ folder, n: (f?.n ?? 0) + 1 }));
        launch("Finder");
    };
    // Clicking the frontmost app's icon puts its window away, as minimizing would; any other brings it forward.
    const dock = (app: AppKey) => (front === app ? close(app) : launch(app));

    const api = useRef<DesktopApi>({ use: () => {}, focus: () => {} });
    api.current.use = (app) => {
        bounceOnce(app);
        raise(app);
    };
    api.current.focus = raise;

    const controls = (app: AppKey) => ({ close: () => close(app), minimize: () => close(app), zoom: () => zoom(app) });
    const frame = (app: AppKey, className: string, top: number, content: ReactNode) => (
        <Frame
            key={app}
            app={app}
            desk={desk}
            label={s(appLabel(app))}
            className={className}
            top={top}
            z={10 + order.indexOf(app)}
            hidden={!order.includes(app)}
            place={places[app] ?? { dx: 0, dy: 0, zoomed: false }}
            onRaise={() => raise(app)}
            onPlace={(change) => setPlaces((p) => ({ ...p, [app]: { dx: 0, dy: 0, zoomed: false, ...p[app], ...change } }))}
            onZoom={() => zoom(app)}
        >
            <WindowControls.Provider value={controls(app)}>{content}</WindowControls.Provider>
        </Frame>
    );

    const menus = menuBar({
        s, active, name, front, order, opened,
        actions: { setDialog, setScreen, onRestart, close, quit, zoom, raise, launch, openFolder, hideOthers: () => front && setOrder([front]), bringAll: () => setOrder((o) => [...(["modelcraft", ...opened] as AppKey[]).filter((x) => !o.includes(x)), ...o]) },
    });

    return (
        <div
            ref={desk}
            tabIndex={-1}
            className="absolute inset-0 outline-none"
            onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === " ") {
                    e.preventDefault();
                    setSpotlight(true);
                }
            }}
        >
            <Wallpaper />

            <MenuBar
                menus={menus}
                wifi={wifi}
                brightness={brightness}
                volume={volume}
                onWifi={setWifi}
                onBrightness={setBrightness}
                onVolume={setVolume}
                onSpotlight={() => setSpotlight(true)}
            />

            {frame("modelcraft", "right-[14%] left-[2%]", 36, children(api.current))}
            {opened.map((app, i) =>
                frame(
                    app,
                    "right-[2%] left-[14%]",
                    48 + (i % 4) * 16,
                    <Suspense fallback={<Loading app={app} />}>
                        {app === "Finder" ? <FinderWindow goTo={finderAt} onOpenApp={(a) => launch(a as AppKey)} /> : app === "modelcraft" ? null : <Demo app={app} />}
                    </Suspense>,
                ),
            )}

            {dialog && (
                <WindowControls.Provider value={{ close: () => setDialog(null), minimize: () => setDialog(null) }}>
                    <AboutDialog dialog={dialog} />
                </WindowControls.Provider>
            )}

            <Dock running={["Finder", ...order]} bouncing={bounce} onDock={dock} />

            {spotlight && (
                <Spotlight
                    results={(query) => {
                        const q = query.trim().toLowerCase();
                        if (!q) return [];
                        const matches = (l: L | string) => (typeof l === "string" ? [l] : l).some((n) => n.toLowerCase().includes(q));
                        const apps = DOCK.filter((a) => matches(appLabel(a)))
                            .map((a) => ({ key: a, icon: <AppIcon app={a} className="size-7" />, label: s(appLabel(a)), kind: s(["Application", "应用程序", "應用程式"]), value: { app: a } as Found }));
                        const folders = FOLDERS.filter((f) => matches(folderTitle(f)))
                            .map((f) => ({ key: f, icon: <FolderIcon className="size-7" />, label: s(folderTitle(f)), kind: s(["Folder", "文件夹", "檔案夾"]), value: { folder: f } as Found }));
                        return [...apps, ...folders];
                    }}
                    onPick={(v) => (v.app ? launch(v.app) : v.folder && openFolder(v.folder))}
                    onClose={() => {
                        setSpotlight(false);
                        desk.current?.focus({ preventScroll: true });
                    }}
                />
            )}

            {/* Display brightness from Control Center dims everything, menu bar included. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-[85] bg-black" style={{ opacity: (1 - brightness) * 0.75 }} />
            {screen !== "on" && <Screen state={screen} onWake={() => setScreen(screen === "sleep" ? "locked" : "on")} />}
        </div>
    );
}

/** The menus for the app in front: the Apple menu, the app's own, then File, Edit, View, (Go), Window and Help. */
function menuBar({ s, active, name, front, order, opened, actions: a }: {
    s: ReturnType<typeof useText>;
    active: AppKey;
    name: string;
    front: AppKey | null;
    order: AppKey[];
    opened: AppKey[];
    actions: {
        setDialog: (d: Dialog) => void;
        setScreen: (state: "sleep" | "locked") => void;
        onRestart: () => void;
        close: (app: AppKey) => void;
        quit: (app: AppKey) => void;
        zoom: (app: AppKey) => void;
        raise: (app: AppKey) => void;
        launch: (app: AppKey) => void;
        openFolder: (folder: FolderId) => void;
        hideOthers: () => void;
        bringAll: () => void;
    };
}): Menu[] {
    const q = (en: string, cn: string, tw: string): L => [en, cn, tw];
    const finder = active === "Finder";
    const windows = (["modelcraft", ...opened] as AppKey[]).filter((app) => order.includes(app));
    const menus: Menu[] = [
        {
            id: "apple", aria: "Apple", title: <AppleLogo className="size-[15px]" />,
            items: [
                { label: q("About This Mac", "关于本机", "關於這台 Mac"), onSelect: () => a.setDialog({ kind: "mac" }) },
                "-",
                { label: q("System Settings…", "系统设置…", "系統設定⋯"), disabled: true },
                { label: q("App Store…", "App Store…", "App Store⋯"), disabled: true },
                "-",
                { label: q("Sleep", "睡眠", "睡眠"), onSelect: () => a.setScreen("sleep") },
                { label: q("Restart…", "重新启动…", "重新開機⋯"), onSelect: a.onRestart },
                { label: q("Shut Down…", "关机…", "關機⋯"), disabled: true },
                "-",
                { label: q("Lock Screen", "锁定屏幕", "鎖定螢幕"), shortcut: "⌃⌘Q", onSelect: () => a.setScreen("locked") },
            ],
        },
        {
            id: "app", aria: name, title: name, bold: true,
            items: [
                { label: q(`About ${name}`, `关于“${name}”`, `關於「${name}」`), onSelect: () => a.setDialog({ kind: "app", app: active }) },
                "-",
                { label: q(`Hide ${name}`, `隐藏“${name}”`, `隱藏「${name}」`), shortcut: "⌘H", disabled: !front, onSelect: () => front && a.close(front) },
                { label: q("Hide Others", "隐藏其他", "隱藏其他"), shortcut: "⌥⌘H", disabled: order.length < 2, onSelect: a.hideOthers },
                "-",
                { label: q(`Quit ${name}`, `退出“${name}”`, `結束「${name}」`), shortcut: "⌘Q", disabled: finder, onSelect: () => a.quit(active) },
            ],
        },
        {
            id: "file", aria: s(q("File", "文件", "檔案")), title: s(q("File", "文件", "檔案")),
            items: [
                finder
                    ? { label: q("New Finder Window", "新建“访达”窗口", "新增 Finder 視窗"), shortcut: "⌘N", onSelect: () => a.launch("Finder") }
                    : { label: q("New Finder Window", "新建“访达”窗口", "新增 Finder 視窗"), shortcut: "⌥⌘N", onSelect: () => a.launch("Finder") },
                "-",
                { label: q("Close Window", "关闭窗口", "關閉視窗"), shortcut: "⌘W", disabled: !front, onSelect: () => front && a.close(front) },
            ],
        },
        {
            id: "edit", aria: s(q("Edit", "编辑", "編輯")), title: s(q("Edit", "编辑", "編輯")),
            items: [
                { label: q("Undo", "撤销", "還原"), shortcut: "⌘Z", disabled: true },
                { label: q("Redo", "重做", "重做"), shortcut: "⇧⌘Z", disabled: true },
                "-",
                { label: q("Cut", "剪切", "剪下"), shortcut: "⌘X", disabled: true },
                { label: q("Copy", "拷贝", "拷貝"), shortcut: "⌘C", onSelect: () => document.execCommand("copy") },
                { label: q("Paste", "粘贴", "貼上"), shortcut: "⌘V", disabled: true },
            ],
        },
        {
            id: "view", aria: s(q("View", "显示", "顯示方式")), title: s(q("View", "显示", "顯示方式")),
            items: [{ label: q("Enter Full Screen", "进入全屏幕", "進入全螢幕"), shortcut: "⌃⌘F", disabled: !front, onSelect: () => front && a.zoom(front) }],
        },
    ];
    if (finder) {
        const go: [FolderId, string][] = [["applications", "⇧⌘A"], ["desktop", "⇧⌘D"], ["documents", "⇧⌘O"], ["downloads", "⌥⌘L"]];
        menus.push({
            id: "go", aria: s(q("Go", "前往", "前往")), title: s(q("Go", "前往", "前往")),
            items: go.map(([folder, shortcut]): MenuItem => ({ label: folderTitle(folder), shortcut, onSelect: () => a.openFolder(folder) })),
        });
    }
    menus.push(
        {
            id: "window", aria: s(q("Window", "窗口", "視窗")), title: s(q("Window", "窗口", "視窗")),
            items: [
                { label: q("Minimize", "最小化", "縮到最小"), shortcut: "⌘M", disabled: !front, onSelect: () => front && a.close(front) },
                { label: q("Zoom", "缩放", "縮放"), disabled: !front, onSelect: () => front && a.zoom(front) },
                "-",
                { label: q("Bring All to Front", "前置全部窗口", "將此程式所有視窗移至最前"), onSelect: a.bringAll },
                ...(windows.length ? ["-" as const] : []),
                ...windows.map((app): MenuItem => ({ label: appLabel(app), checked: app === front, onSelect: () => a.raise(app) })),
            ],
        },
        {
            id: "help", aria: s(q("Help", "帮助", "輔助說明")), title: s(q("Help", "帮助", "輔助說明")),
            items: finder
                ? [{ label: q("macOS Help", "macOS 帮助", "macOS 使用手冊"), disabled: true }]
                : [{ label: q(`${name} Website`, `${name} 网站`, `${name} 網站`), href: `/products/${active}/` }],
        },
    );
    return menus;
}

/** The edges and corners a window resizes from, with their cursors. */
const EDGES = [
    ["n", "-top-1 inset-x-3 h-2 cursor-ns-resize"],
    ["s", "-bottom-1 inset-x-3 h-2 cursor-ns-resize"],
    ["e", "-right-1 inset-y-3 w-2 cursor-ew-resize"],
    ["w", "-left-1 inset-y-3 w-2 cursor-ew-resize"],
    ["ne", "-top-1 -right-1 size-4 cursor-nesw-resize"],
    ["sw", "-bottom-1 -left-1 size-4 cursor-nesw-resize"],
    ["nw", "-top-1 -left-1 size-4 cursor-nwse-resize"],
    ["se", "-bottom-1 -right-1 size-4 cursor-nwse-resize"],
] as const;
const MIN_WIDTH = 420;
const MIN_HEIGHT = 280;

/**
 * A window on the desktop: dragged by its title bar (the top 52 points), zoomed by double-clicking it, and
 * resized from any edge or corner, never smaller than MIN_WIDTH × MIN_HEIGHT or past the desktop's edges.
 */
function Frame({ app, desk, label, className, top, z, hidden, place, onRaise, onPlace, onZoom, children }: {
    app: AppKey;
    desk: RefObject<HTMLDivElement | null>;
    label: string;
    className: string;
    top: number;
    z: number;
    hidden: boolean;
    place: Place;
    onRaise: () => void;
    onPlace: (change: Partial<Place>) => void;
    onZoom: () => void;
    children: ReactNode;
}) {
    const el = useRef<HTMLDivElement>(null);
    const drag = useRef<{ x: number; y: number; dx: number; dy: number; min: [number, number]; max: [number, number] } | null>(null);
    const [dragging, setDragging] = useState(false);
    const resize = useRef<{ edge: string; x: number; y: number; width: number; height: number; dx: number; dy: number; room: { left: number; top: number; right: number; bottom: number } } | null>(null);

    const inTitleBar = (e: { clientY: number; target: EventTarget }) => {
        const r = el.current!.getBoundingClientRect();
        return e.clientY - r.top <= 52 && !(e.target as HTMLElement).closest('button, a, input, textarea, select, [contenteditable="true"], [role="slider"], [role="tab"], [role="switch"]');
    };

    return (
        <div
            ref={el}
            aria-label={label}
            data-app={app}
            className={cn(
                "absolute bottom-[clamp(62px,9cqw,84px)]",
                className,
                hidden && "hidden",
                !dragging && "transition-[top,left,right,bottom] duration-200",
                dragging && "select-none",
            )}
            style={place.zoomed ? { zIndex: z, top: 28, left: 0, right: 0, bottom: 0 } : {
                zIndex: z, top, transform: `translate(${place.dx}px, ${place.dy}px)`,
                ...(place.width ? { width: place.width, right: "auto" } : {}),
                ...(place.height ? { height: place.height, bottom: "auto" } : {}),
            }}
            onPointerDownCapture={onRaise}
            onPointerDown={(e) => {
                if (e.button !== 0 || place.zoomed || !inTitleBar(e)) return;
                const r = el.current!.getBoundingClientRect();
                const d = desk.current!.getBoundingClientRect();
                // Keep the title bar below the menu bar and a part of the window on the desktop.
                drag.current = {
                    x: e.clientX, y: e.clientY, dx: place.dx, dy: place.dy,
                    min: [place.dx - (r.right - d.left - 80), place.dy - (r.top - d.top - 28)],
                    max: [place.dx + (d.right - r.left - 80), place.dy + (d.bottom - r.top - 90)],
                };
                el.current!.setPointerCapture(e.pointerId);
                setDragging(true);
                e.preventDefault();
            }}
            onPointerMove={(e) => {
                const g = drag.current;
                if (!g) return;
                const clamp = (v: number, i: 0 | 1) => Math.min(g.max[i], Math.max(g.min[i], v));
                onPlace({ dx: clamp(g.dx + e.clientX - g.x, 0), dy: clamp(g.dy + e.clientY - g.y, 1) });
            }}
            onPointerUp={() => {
                drag.current = null;
                setDragging(false);
            }}
            onPointerCancel={() => {
                drag.current = null;
                setDragging(false);
            }}
            onDoubleClick={(e) => inTitleBar(e) && onZoom()}
        >
            {children}
            {!place.zoomed && EDGES.map(([edge, position]) => (
                <span
                    key={edge}
                    aria-hidden
                    className={cn("absolute z-20 touch-none", position)}
                    onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        e.stopPropagation();
                        e.preventDefault();
                        const r = el.current!.getBoundingClientRect();
                        const d = desk.current!.getBoundingClientRect();
                        resize.current = {
                            edge, x: e.clientX, y: e.clientY, width: r.width, height: r.height, dx: place.dx, dy: place.dy,
                            room: { left: r.left - d.left, top: r.top - d.top - 28, right: d.right - r.right, bottom: d.bottom - r.bottom },
                        };
                        e.currentTarget.setPointerCapture(e.pointerId);
                        setDragging(true);
                    }}
                    onPointerMove={(e) => {
                        const g = resize.current;
                        if (!g) return;
                        const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
                        const change: Partial<Place> = { width: g.width, height: g.height };
                        if (g.edge.includes("e")) change.width = clamp(g.width + e.clientX - g.x, MIN_WIDTH, g.width + g.room.right);
                        if (g.edge.includes("w")) {
                            const by = clamp(e.clientX - g.x, -g.room.left, g.width - MIN_WIDTH);
                            change.width = g.width - by;
                            change.dx = g.dx + by;
                        }
                        if (g.edge.includes("s")) change.height = clamp(g.height + e.clientY - g.y, MIN_HEIGHT, g.height + g.room.bottom);
                        if (g.edge.includes("n")) {
                            const by = clamp(e.clientY - g.y, -g.room.top, g.height - MIN_HEIGHT);
                            change.height = g.height - by;
                            change.dy = g.dy + by;
                        }
                        onPlace(change);
                    }}
                    onPointerUp={() => {
                        resize.current = null;
                        setDragging(false);
                    }}
                    onPointerCancel={() => {
                        resize.current = null;
                        setDragging(false);
                    }}
                />
            ))}
        </div>
    );
}

function Wallpaper() {
    return (
        <div aria-hidden className="absolute inset-0">
            <div
                className="absolute inset-0 bg-[#f6d9bf] dark:hidden"
                style={{ backgroundImage: "radial-gradient(120% 90% at 0% 0%, rgb(255 190 140 / 0.9), transparent 60%), radial-gradient(90% 80% at 100% 10%, rgb(214 150 220 / 0.55), transparent 60%), radial-gradient(120% 90% at 60% 110%, rgb(224 120 70 / 0.75), transparent 60%)" }}
            />
            <div
                className="absolute inset-0 hidden bg-[#1c120d] dark:block"
                style={{ backgroundImage: "radial-gradient(120% 90% at 0% 0%, rgb(150 70 30 / 0.7), transparent 60%), radial-gradient(90% 80% at 100% 10%, rgb(110 50 120 / 0.5), transparent 60%), radial-gradient(120% 90% at 60% 110%, rgb(170 80 40 / 0.6), transparent 60%)" }}
            />
        </div>
    );
}

function FolderIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 64 52" aria-hidden className={className}>
            <path d="M4 8a4 4 0 0 1 4-4h16l5 5h27a4 4 0 0 1 4 4v3H4z" fill="#5fb3f5" />
            <rect x="4" y="13" width="56" height="35" rx="4" fill="#79c3fb" />
            <rect x="4" y="13" width="56" height="2" fill="#a8d8ff" />
        </svg>
    );
}

function AboutDialog({ dialog }: { dialog: Dialog }) {
    const s = useText();
    const body = dialog.kind === "mac" ? (
        <>
            <svg viewBox="0 0 120 76" aria-hidden className="mx-auto mt-2 w-28">
                <rect x="14" y="2" width="92" height="60" rx="5" fill="#2b2b2e" />
                <rect x="18" y="6" width="84" height="52" rx="2" fill="#f2b98a" />
                <path d="M2 64h116l-4 8a6 6 0 0 1-5 3H11a6 6 0 0 1-5-3z" fill="#c9c9ce" />
            </svg>
            <h3 className="mt-3 text-[20px] font-bold">MacBook Pro</h3>
            <p className="text-[11px] opacity-60">{s(["14-inch, 2026", "14 英寸，2026 年", "14 吋，2026 年"])}</p>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-left text-[12px]">
                {([
                    [["Chip", "芯片", "晶片"], "Apple M5 Pro"],
                    [["Memory", "内存", "記憶體"], "24 GB"],
                    [["Startup disk", "启动磁盘", "啟動磁碟"], "Macintosh HD"],
                    ["macOS", "27.1"],
                ] as [L | string, string][]).map(([k, v]) => (
                    <div key={s(k)} className="contents">
                        <dt className="text-right opacity-60">{s(k)}</dt>
                        <dd>{v}</dd>
                    </div>
                ))}
            </dl>
        </>
    ) : (
        <>
            <AppIcon app={dialog.app} className="mx-auto mt-2 size-20" />
            <h3 className="mt-3 text-[20px] font-bold">{s(appLabel(dialog.app))}</h3>
            <p className="text-[11px] opacity-60">{s(["Version", "版本", "版本"])} {dialog.app === "modelcraft" ? "0.9.0" : dialog.app === "Finder" ? "27.1" : "1.0"}</p>
            <p className="mt-3 text-[12px] opacity-80">
                {s(dialog.app === "modelcraft"
                    ? ["A private AI assistant that runs entirely on your Mac.", "完全在你 Mac 上运行的私人 AI 助手。", "完全在你 Mac 上執行的私人 AI 助理。"]
                    : dialog.app === "Finder"
                        ? ["Browse the files and folders on your Mac.", "浏览 Mac 上的文件和文件夹。", "瀏覽 Mac 上的檔案和檔案夾。"]
                        : CONNECTORS.find((c) => c.id === dialog.app)!.summary)}
            </p>
            {dialog.app !== "Finder" && (
                <Link to={`/products/${dialog.app}/`} className="mt-3 inline-block text-[12px] text-[#0a82ff] hover:underline">
                    {s(["Learn more…", "了解更多…", "進一步瞭解⋯"])}
                </Link>
            )}
        </>
    );
    return (
        <div role="dialog" aria-label={dialog.kind === "mac" ? s(["About This Mac", "关于本机", "關於這台 Mac"]) : s(appLabel(dialog.app))} className="absolute top-[22%] left-1/2 z-[65] w-[280px] -translate-x-1/2 rounded-[14px] border border-black/10 bg-[#f6f6f6]/95 px-5 pt-3 pb-5 text-center text-[13px] text-[#1d1d1f] shadow-[0_20px_60px_-10px_rgb(0_0_0/0.45)] backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 dark:border-white/12 dark:bg-[#2b2b2b]/95 dark:text-[#f0f0f0]">
            <div className="flex"><TrafficLights /></div>
            {body}
        </div>
    );
}

/** Sleep (a black screen; a click wakes it to the lock screen) and the lock screen (a click unlocks). */
function Screen({ state, onWake }: { state: "sleep" | "locked"; onWake: () => void }) {
    const s = useText();
    const lang = useLang();
    const now = new Date();
    if (state === "sleep") {
        return <button type="button" aria-label={s(["Wake", "唤醒", "喚醒"])} className="absolute inset-0 z-[95] cursor-default bg-black motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700" onClick={onWake} />;
    }
    return (
        <button
            type="button"
            aria-label={s(["Unlock", "解锁", "解鎖"])}
            className="absolute inset-0 z-[95] flex cursor-default flex-col items-center bg-black/25 pt-[10%] text-white backdrop-blur-2xl motion-safe:animate-in motion-safe:fade-in"
            onClick={onWake}
        >
            <span className="text-[clamp(15px,2.4cqw,22px)] font-semibold opacity-90">{new Intl.DateTimeFormat(locale(lang), { weekday: "long", month: "long", day: "numeric" }).format(now)}</span>
            <span className="text-[clamp(56px,13cqw,120px)] leading-none font-bold tracking-tight">{new Intl.DateTimeFormat(locale(lang), { hour: "numeric", minute: "2-digit", hourCycle: "h23" }).format(now)}</span>
            <span className="mt-auto mb-[12%] flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-[13px]">
                <SFSymbol name="key.fill" className="size-3" />
                {s(["Click to unlock", "点按以解锁", "按一下來解鎖"])}
            </span>
        </button>
    );
}

function Loading({ app }: { app: AppKey }) {
    const s = useText();
    const name = s(appLabel(app));
    return (
        <div className={cn("flex items-center justify-center bg-white/85 backdrop-blur-xl dark:bg-[#1e1e1e]/85", WINDOW)}>
            <AppIcon app={app} className="size-12" />
            <Spinner className="ml-3 size-4 text-[#86868b]" label={s([`Opening ${name}`, `正在打开 ${name}`, `正在開啟 ${name}`])} />
        </div>
    );
}

/** The Dock in macOS 27's Liquid Glass: one row of same-size icons on a glass shelf, a dot under each running app. */
function Dock({ running, bouncing, onDock }: { running: AppKey[]; bouncing: { app: AppKey; n: number } | null; onDock: (app: AppKey) => void }) {
    const s = useText();
    return (
        <nav aria-label={s(["Dock", "程序坞", "Dock"])} className="absolute inset-x-0 bottom-[clamp(4px,0.8cqw,8px)] z-[60] flex justify-center select-none">
            <div className="flex items-end gap-[clamp(3px,0.6cqw,6px)] rounded-[clamp(16px,2.4cqw,24px)] border border-white/50 bg-white/25 px-[clamp(5px,0.8cqw,8px)] pt-[clamp(5px,0.8cqw,8px)] shadow-[inset_0_1px_1px_rgb(255_255_255/0.6),inset_0_-1px_1px_rgb(255_255_255/0.15),0_12px_32px_rgb(0_0_0/0.18)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/15 dark:bg-white/8 dark:shadow-[inset_0_1px_1px_rgb(255_255_255/0.2),0_12px_32px_rgb(0_0_0/0.4)]">
                {DOCK.map((app) => (
                    <button key={app} type="button" aria-label={s(appLabel(app))} className="group relative flex flex-col items-center" onClick={() => onDock(app)}>
                        <span className="pointer-events-none absolute -top-8 rounded-md bg-white/85 px-2 py-0.5 text-[12px] whitespace-nowrap text-[#1d1d1f] opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 dark:bg-[#2a2a2a]/90 dark:text-white">
                            {s(appLabel(app))}
                        </span>
                        <span key={bouncing?.app === app ? bouncing.n : 0} className={cn("block", bouncing?.app === app && "dock-bounce")}>
                            <AppIcon app={app} className="block size-[clamp(32px,5.6cqw,54px)]" />
                        </span>
                        <i className={cn("my-[clamp(2px,0.4cqw,4px)] size-1 rounded-full bg-black/60 dark:bg-white/80", !running.includes(app) && "invisible")} />
                    </button>
                ))}
            </div>
        </nav>
    );
}
