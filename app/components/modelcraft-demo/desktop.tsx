import { lazy, Suspense, type ReactNode } from "react";

import finderIcon from "~/assets/macos/finder.png";
import { useText, type L } from "~/components/demo-text";
import { Spinner, WindowControls } from "~/components/mac-ui";
import { MAC_FONT } from "~/components/mac-window";
import { ProductIcon } from "~/components/product-icon";
import { cn } from "~/lib/utils";
import { CONNECTOR_NAME, type ConnectorId, type Tool } from "./conversations";

// The Mac around the ModelCraft window: a wallpaper, the menu bar and a Dock with Finder, ModelCraft and
// the apps it connects to. Each app opens as a window running its own full demo.

/** An app on the desktop: Finder, ModelCraft, or a connector's product id. */
export type AppKey = ConnectorId | "modelcraft" | "Finder";

const DOCK: AppKey[] = ["Finder", "modelcraft", "container", "quaero", "keel", "cellar", "arthub", "tunestudio", "pinch"];

const appName = (app: AppKey) => (app === "modelcraft" ? "ModelCraft" : app === "Finder" ? "Finder" : CONNECTOR_NAME[app]);

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
const PinchDemo = lazy(() => import("~/components/pinch-demo").then((m) => ({ default: m.PinchDemo })));
const QuaeroDemo = lazy(() => import("~/components/quaero-demo").then((m) => ({ default: m.QuaeroDemo })));
const TuneStudioDemo = lazy(() => import("~/components/tunestudio-demo").then((m) => ({ default: m.TuneStudioDemo })));

const WINDOW = "h-full rounded-[12px] shadow-[0_20px_60px_-15px_rgb(0_0_0/0.45)]";

function Demo({ app }: { app: ConnectorId }) {
    switch (app) {
        case "arthub": return <ArthubDemo className={WINDOW} />;
        case "cellar": return <CellarDemo className="h-full" embedded />;
        case "container": return <ContainerDemo className={WINDOW} />;
        case "keel": return <KeelDemo className={WINDOW} />;
        // Pinch is a small window beside a desk, so it floats on the wallpaper rather than filling a frame.
        case "pinch": return <PinchDemo className="max-h-full justify-center overflow-y-auto p-3 lg:items-center" />;
        case "quaero": return <QuaeroDemo className={WINDOW} />;
        case "tunestudio": return <TuneStudioDemo className={WINDOW} />;
    }
}

function AppIcon({ app, className }: { app: AppKey; className?: string }) {
    if (app === "Finder") return <img src={finderIcon} alt="" width={48} height={48} className={className} draggable={false} />;
    return <ProductIcon id={app} className={className} width={48} height={48} />;
}

export function Desktop({ modelcraft, finder, opened, order, bouncing, onRaise, onClose, onDock }: {
    /** The ModelCraft window, always open. */
    modelcraft: ReactNode;
    finder: ReactNode;
    /** Every other app whose window has been opened, in the order they first opened; closed ones keep their state. */
    opened: AppKey[];
    /** The windows showing, back to front. */
    order: AppKey[];
    /** The app launching or being used, with a count that changes each time so the bounce plays again. */
    bouncing: { app: AppKey; n: number } | null;
    onRaise: (app: AppKey) => void;
    onClose: (app: AppKey) => void;
    onDock: (app: AppKey) => void;
}) {
    const front = order[order.length - 1] ?? "Finder";
    // Windows keep their place in the page and stack by z-index, so moving one forward doesn't reset what it's doing.
    const frame = (app: AppKey, className: string, content: ReactNode, top?: number) => (
        <div
            key={app}
            aria-label={appName(app)}
            className={cn("absolute bottom-[clamp(62px,9cqw,84px)]", className, !order.includes(app) && "hidden")}
            style={{ zIndex: 10 + order.indexOf(app), top }}
            onPointerDownCapture={() => onRaise(app)}
        >
            {content}
        </div>
    );

    return (
        <div
            className="@container relative h-[min(760px,88vh)] w-full overflow-hidden rounded-[18px] border border-black/12 shadow-[0_24px_70px_-20px_rgb(0_0_0/0.35)] dark:border-white/12"
            style={{ fontFamily: MAC_FONT }}
        >
            <div
                aria-hidden
                className="absolute inset-0 bg-[#f6d9bf] dark:hidden"
                style={{ backgroundImage: "radial-gradient(120% 90% at 0% 0%, rgb(255 190 140 / 0.9), transparent 60%), radial-gradient(90% 80% at 100% 10%, rgb(214 150 220 / 0.55), transparent 60%), radial-gradient(120% 90% at 60% 110%, rgb(224 120 70 / 0.75), transparent 60%)" }}
            />
            <div
                aria-hidden
                className="absolute inset-0 hidden bg-[#1c120d] dark:block"
                style={{ backgroundImage: "radial-gradient(120% 90% at 0% 0%, rgb(150 70 30 / 0.7), transparent 60%), radial-gradient(90% 80% at 100% 10%, rgb(110 50 120 / 0.5), transparent 60%), radial-gradient(120% 90% at 60% 110%, rgb(170 80 40 / 0.6), transparent 60%)" }}
            />
            <MenuBar app={appName(front)} />

            {frame("modelcraft", "top-9 inset-x-2 sm:right-[14%] sm:left-[2%]", modelcraft)}
            {opened.map((app, i) =>
                frame(
                    app,
                    "inset-x-2 sm:right-[2%] sm:left-[14%]",
                    <WindowControls.Provider value={{ close: () => onClose(app), minimize: () => onClose(app) }}>
                        <Suspense fallback={<Loading app={app} />}>{app === "Finder" ? finder : app === "modelcraft" ? null : <Demo app={app} />}</Suspense>
                    </WindowControls.Provider>,
                    48 + (i % 4) * 16,
                ),
            )}

            <Dock running={["Finder", ...order]} bouncing={bouncing} onDock={onDock} />
        </div>
    );
}

function Loading({ app }: { app: AppKey }) {
    const s = useText();
    return (
        <div className={cn("flex items-center justify-center bg-white/85 backdrop-blur-xl dark:bg-[#1e1e1e]/85", WINDOW)}>
            <AppIcon app={app} className="size-12" />
            <Spinner className="ml-3 size-4 text-[#86868b]" label={s([`Opening ${appName(app)}`, `正在打开 ${appName(app)}`, `正在開啟 ${appName(app)}`])} />
        </div>
    );
}

const MENUS: L[] = [["File", "文件", "檔案"], ["Edit", "编辑", "編輯"], ["View", "显示", "顯示方式"], ["Window", "窗口", "視窗"], ["Help", "帮助", "輔助說明"]];

function MenuBar({ app }: { app: string }) {
    const s = useText();
    return (
        <div className="absolute inset-x-0 top-0 z-[60] flex h-7 items-center gap-4 px-3 text-[13px] text-[#1d1d1f] select-none dark:text-white/90">
            <b className="font-semibold">{app}</b>
            {MENUS.map((m) => <span key={m[0]} className="hidden sm:inline">{s(m)}</span>)}
            <span className="ml-auto tabular-nums">{s(["Mon 26 Oct 9:41", "10月26日 周一 9:41", "10月26日 週一 上午9:41"])}</span>
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
                    <button key={app} type="button" aria-label={appName(app)} className="group relative flex flex-col items-center" onClick={() => onDock(app)}>
                        <span className="pointer-events-none absolute -top-8 rounded-md bg-white/85 px-2 py-0.5 text-[12px] whitespace-nowrap text-[#1d1d1f] opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 dark:bg-[#2a2a2a]/90 dark:text-white">
                            {appName(app)}
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
