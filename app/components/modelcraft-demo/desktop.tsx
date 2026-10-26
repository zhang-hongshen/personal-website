import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";

import { TrafficLights } from "~/components/mac-ui";
import { MAC_FONT } from "~/components/mac-window";
import { ProductIcon } from "~/components/product-icon";
import { SFSymbol, type SymbolName } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { CONNECTOR_NAME, type ConnectorId, type Tool } from "./conversations";
import { CONNECTORS } from "./data";

// The Mac around the ModelCraft window: a wallpaper, the menu bar and a Dock with Finder, ModelCraft,
// the other apps it connects to and a few of the Mac's own. When a reply uses an app, its icon bounces
// and a small window of it opens with what the call did.

/** An app on the desktop: a connector's product id, or the name of one of the Mac's apps. */
export type AppKey = ConnectorId | "modelcraft" | "Finder" | "Safari" | "Mail" | "Calendar" | "Reminders" | "Terminal";

const SYSTEM: Record<string, { icon: SymbolName; tile: string }> = {
    Finder: { icon: "folder", tile: "bg-gradient-to-b from-[#5ac8fa] to-[#1e7cf2] text-white" },
    Safari: { icon: "safari", tile: "bg-gradient-to-b from-white to-[#e8eef6] text-[#1a8cff]" },
    Mail: { icon: "envelope", tile: "bg-gradient-to-b from-[#5fb8ff] to-[#1572ea] text-white" },
    Calendar: { icon: "calendar", tile: "bg-white text-[#ff3b30]" },
    Reminders: { icon: "checklist", tile: "bg-white text-[#ff9500]" },
    Terminal: { icon: "terminal", tile: "bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] text-[#e5e5e7]" },
};

const DOCK: (AppKey | "|")[] = ["Finder", "modelcraft", "container", "quaero", "keel", "cellar", "arthub", "tunestudio", "pinch", "|", "Safari", "Mail", "Calendar", "Reminders", "Terminal"];

export const appName = (app: AppKey) => (app === "modelcraft" ? "ModelCraft" : app in CONNECTOR_NAME ? CONNECTOR_NAME[app as ConnectorId] : app);
const isProduct = (app: AppKey) => app === "modelcraft" || app in CONNECTOR_NAME;

/** Which app a tool call works in. */
export function appOf(tool: Tool): AppKey {
    switch (tool.kind) {
        case "connector": return tool.app;
        case "native": return tool.app as AppKey;
        case "command": return "Terminal";
        case "fetch": return "Safari";
        case "file": return "Finder";
    }
}

function AppIcon({ app, className }: { app: AppKey; className?: string }) {
    if (isProduct(app)) return <ProductIcon id={app} className={className} width={48} height={48} />;
    const { icon, tile } = SYSTEM[app];
    return (
        <span className={cn("flex items-center justify-center rounded-[23%] shadow-[0_0_0_0.5px_rgb(0_0_0/0.12)]", tile, className)}>
            <SFSymbol name={icon} className="size-[55%]" />
        </span>
    );
}

export function Desktop({ children, windows, running, bouncing, onDock }: {
    /** The ModelCraft window. */
    children: ReactNode;
    /** Small app windows, frontmost last. */
    windows: { app: AppKey; tool: Tool | null }[];
    /** Apps with a dot under them. */
    running: AppKey[];
    /** The app being used right now, with a count that changes each time so the bounce plays again. */
    bouncing: { app: AppKey; n: number } | null;
    onDock: (app: AppKey) => void;
}) {
    return (
        <div className="@container relative h-[min(720px,86vh)] w-full overflow-hidden rounded-[18px] border border-black/12 shadow-[0_24px_70px_-20px_rgb(0_0_0/0.35)] select-none dark:border-white/12" style={{ fontFamily: MAC_FONT }}>
            {/* Wallpaper */}
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
            <MenuBar />

            <div className="absolute inset-x-2 top-8 bottom-[76px] sm:inset-x-4 sm:top-9 sm:bottom-[84px]">{children}</div>

            {windows.map((w, i) => (
                <AppWindow key={w.app} app={w.app} tool={w.tool} index={i} onClose={() => onDock(w.app)} />
            ))}

            <nav aria-label="Dock" className="absolute inset-x-0 bottom-2 flex justify-center px-2">
                <div className="flex max-w-full items-end gap-[3px] rounded-[20px] border border-white/40 bg-white/35 px-1.5 pt-1.5 pb-1 shadow-[0_8px_30px_rgb(0_0_0/0.18)] backdrop-blur-xl sm:gap-1 sm:px-2 dark:border-white/12 dark:bg-black/30">
                    {DOCK.map((app, i) =>
                        app === "|" ? (
                            <span key={i} aria-hidden className="mx-0.5 mb-2 h-[clamp(17px,5.2cqw,40px)] w-px shrink-0 self-end bg-black/15 dark:bg-white/20" />
                        ) : (
                            <button
                                key={app}
                                type="button"
                                title={appName(app)}
                                aria-label={appName(app)}
                                className="group flex shrink-0 flex-col items-center"
                                onClick={() => onDock(app)}
                            >
                                <span key={bouncing?.app === app ? bouncing.n : 0} className={cn("block transition-transform group-hover:-translate-y-1", bouncing?.app === app && "dock-bounce")}>
                                    <AppIcon app={app} className="size-[clamp(17px,5.2cqw,40px)]" />
                                </span>
                                <i className={cn("mt-[3px] size-1 rounded-full bg-black/70 dark:bg-white/80", !running.includes(app) && "invisible")} />
                            </button>
                        ),
                    )}
                </div>
            </nav>
        </div>
    );
}

function MenuBar() {
    return (
        <div className="absolute inset-x-0 top-0 flex h-6 items-center gap-4 bg-white/30 px-3 text-[12px] text-[#1d1d1f] backdrop-blur-md sm:h-7 sm:text-[13px] dark:bg-black/25 dark:text-white/90">
            <b className="font-semibold">ModelCraft</b>
            {["File", "Edit", "View", "Window", "Help"].map((m) => <span key={m} className="hidden sm:inline">{m}</span>)}
            <span className="ml-auto tabular-nums">Mon 26 Oct 9:41</span>
        </div>
    );
}

/** A small window of an app, cascading down the right of the desktop, showing its latest call. */
function AppWindow({ app, tool, index, onClose }: { app: AppKey; tool: Tool | null; index: number; onClose: () => void }) {
    const dark = app === "Terminal";
    return (
        <section
            aria-label={appName(app)}
            className={cn(
                "absolute right-3 z-20 flex max-h-[46%] w-[min(290px,72%)] flex-col overflow-hidden rounded-[12px] border text-left text-[12px] leading-[1.45] shadow-[0_18px_50px_-12px_rgb(0_0_0/0.45)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-6 sm:right-5",
                dark ? "border-white/10 bg-[#1e1e1e] text-[#e5e5e5]" : "border-black/10 bg-white/95 text-[#1d1d1f] backdrop-blur-xl dark:border-white/12 dark:bg-[#2a2a2a]/95 dark:text-[#ececec]",
            )}
            style={{ top: `calc(${8 + index * 9}% + 24px)`, marginRight: `${index * 14}px` }}
        >
            <header className={cn("flex h-8 shrink-0 items-center gap-2 border-b px-2.5", dark ? "border-white/10" : "border-black/8 dark:border-white/10")}>
                <button type="button" aria-label={`Close ${appName(app)}`} className="flex" onClick={onClose}><TrafficLights /></button>
                <AppIcon app={app} className="ml-1 size-4" />
                <span className="min-w-0 flex-1 truncate font-semibold">{appName(app)}</span>
                {isProduct(app) && app !== "modelcraft" && (
                    <Link to={`/products/${app}/`} className="flex shrink-0 items-center gap-0.5 text-[11px] text-[#007aff] hover:underline dark:text-[#0a84ff]">
                        Learn more <SFSymbol name="chevron.right" className="size-2" />
                    </Link>
                )}
            </header>
            <div className="min-h-0 overflow-auto p-2.5 select-text">{tool ? <Content tool={tool} /> : <Idle app={app} />}</div>
        </section>
    );
}

/** What an app shows before ModelCraft has used it. */
function Idle({ app }: { app: AppKey }) {
    const connector = CONNECTORS.find((c) => c.id === app);
    return <p className="text-[#86868b] dark:text-[#98989d]">{connector ? connector.summary : `ModelCraft hasn't used ${appName(app)} yet. Ask it something in the chat.`}</p>;
}

const MUTED = "text-[#86868b] dark:text-[#98989d]";

function Content({ tool }: { tool: Tool }) {
    switch (tool.kind) {
        case "connector":
            return (
                <div className="flex flex-col gap-1.5">
                    <p className={cn("font-mono text-[11px]", MUTED)}>{tool.name}</p>
                    <Result value={JSON.parse(tool.result)} />
                </div>
            );
        case "native":
        case "file":
            return (
                <div className="flex flex-col gap-2">
                    {tool.kind === "file" && (
                        <p className="flex items-center gap-2 font-medium"><SFSymbol name="waveform" className="size-3.5 text-[#007aff]" />{tool.name}</p>
                    )}
                    <Pairs pairs={tool.card} />
                </div>
            );
        case "command":
            return (
                <div className="font-mono text-[11px]">
                    <p><span className="font-bold text-[#e8915a]">&gt;</span> {tool.command}</p>
                    <pre className="mt-1 whitespace-pre-wrap text-white/60">{tool.output}</pre>
                </div>
            );
        case "fetch":
            return (
                <div className="flex flex-col gap-1.5">
                    <p className={cn("truncate rounded-md bg-black/5 px-2 py-1 text-[11px] dark:bg-white/8", MUTED)}>{new URL(tool.url).hostname}{new URL(tool.url).pathname}</p>
                    <p className="font-semibold">{tool.title}</p>
                    <p className={cn("whitespace-pre-wrap", MUTED)}>{tool.excerpt}</p>
                </div>
            );
    }
}

function Pairs({ pairs }: { pairs: [string, string][] }) {
    return (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            {pairs.map(([k, v]) => (
                <Fragment key={k}>
                    <dt className={MUTED}>{k}</dt>
                    <dd className="min-w-0 break-words">{v}</dd>
                </Fragment>
            ))}
        </dl>
    );
}

const show = (v: unknown) => (v === null ? "NULL" : Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v));

/** A call's result the way its app would show it: rows as a table, anything else as labeled values. */
function Result({ value }: { value: unknown }) {
    const table = (columns: string[], rows: unknown[][]) => (
        <div className="overflow-x-auto rounded-md border border-black/8 dark:border-white/10">
            <table className="w-full text-[11px]">
                <thead><tr className={MUTED}>{columns.map((c) => <th key={c} className="px-2 py-1 text-left font-medium whitespace-nowrap">{c}</th>)}</tr></thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="border-t border-black/6 dark:border-white/8">
                            {r.map((v, j) => <td key={j} className="px-2 py-1 whitespace-nowrap">{show(v)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    if (Array.isArray(value) && value.every((v) => v && typeof v === "object" && !Array.isArray(v))) {
        const columns = [...new Set(value.flatMap((v) => Object.keys(v as object)))];
        return table(columns, value.map((v) => columns.map((c) => (v as Record<string, unknown>)[c] ?? null)));
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
        const v = value as Record<string, unknown>;
        if (Array.isArray(v.columns) && Array.isArray(v.rows)) return table(v.columns as string[], v.rows as unknown[][]);
        const list = Object.entries(v).find(([, x]) => Array.isArray(x) && x.every((y) => y && typeof y === "object"));
        if (list) {
            const rest = Object.entries(v).filter(([k]) => k !== list[0]);
            return (
                <div className="flex flex-col gap-1.5">
                    <Result value={list[1]} />
                    {rest.length > 0 && <Pairs pairs={rest.map(([k, x]) => [k, show(x)])} />}
                </div>
            );
        }
        return <Pairs pairs={Object.entries(v).map(([k, x]) => [k, show(x)])} />;
    }
    return <p>{show(value)}</p>;
}
