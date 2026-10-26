import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "~/lib/utils";
import { useText } from "./demo-text";
import { CAPSULE, MAC_FONT, TOOL, TOOL_ITEM } from "./mac-window";
import { SFSymbol, type SymbolName } from "./sf-symbol";

// Pieces of a macOS 26 window with the system's own colors and accent, for the demos of apps that
// use them as they are (Quaero, Keel, Container).

export const MAC = {
    sidebar: "bg-[#efeeec] dark:bg-[#2a2928]",
    window: "bg-white dark:bg-[#1e1e1e]",
    text: "text-[#1d1d1f] dark:text-[#ececec]",
    muted: "text-[#86868b] dark:text-[#98989d]",
    line: "border-black/8 dark:border-white/10",
    accent: "text-[#007aff] dark:text-[#0a84ff]",
    accentBg: "bg-[#007aff] text-white dark:bg-[#0a84ff]",
    /** A selected row in a list that has focus. */
    selected: "bg-[#007aff] text-white dark:bg-[#0a84ff]",
    hover: "hover:bg-black/5 dark:hover:bg-white/6",
    /** Every other row of a table. */
    stripe: "even:bg-black/[0.03] dark:even:bg-white/[0.04]",
    field: "rounded-md bg-black/5 outline-none focus:ring-2 focus:ring-[#007aff]/50 dark:bg-white/8",
};

/** The window: rounded, with a shadow, at a height that fits the screen. */
export function MacWindow({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <div
            className={cn("relative flex h-[min(640px,80vh)] w-full overflow-hidden rounded-[18px] border border-black/12 text-left text-[13px] shadow-[0_24px_70px_-20px_rgb(0_0_0/0.35)] dark:border-white/12", MAC.window, MAC.text, className)}
            style={{ fontFamily: MAC_FONT }}
        >
            {children}
        </div>
    );
}

/** What a window's close, minimize and zoom buttons do, when the window sits on a desktop that handles them. */
export const WindowControls = createContext<{ close: () => void; minimize: () => void; zoom?: () => void } | null>(null);

export function TrafficLights() {
    const s = useText();
    const controls = useContext(WindowControls);
    if (!controls) {
        return (
            <span className="flex gap-2" aria-hidden>
                <i className="size-3 rounded-full bg-[#ff5f57]" />
                <i className="size-3 rounded-full bg-[#febc2e]" />
                <i className="size-3 rounded-full bg-[#28c840]" />
            </span>
        );
    }
    return (
        <span className="group/lights flex gap-2">
            <button type="button" aria-label={s(["Close", "关闭", "關閉"])} title={s(["Close", "关闭", "關閉"])} className="flex size-3 items-center justify-center rounded-full bg-[#ff5f57] text-[9px] leading-none text-black/60" onClick={controls.close}>
                <span className="opacity-0 group-hover/lights:opacity-100">×</span>
            </button>
            <button type="button" aria-label={s(["Minimize", "最小化", "縮到最小"])} title={s(["Minimize", "最小化", "縮到最小"])} className="flex size-3 items-center justify-center rounded-full bg-[#febc2e] text-[9px] leading-none text-black/60" onClick={controls.minimize}>
                <span className="opacity-0 group-hover/lights:opacity-100">−</span>
            </button>
            {controls.zoom ? (
                <button type="button" aria-label={s(["Zoom", "缩放", "縮放"])} title={s(["Zoom", "缩放", "縮放"])} className="flex size-3 items-center justify-center rounded-full bg-[#28c840] text-[8px] leading-none text-black/60" onClick={controls.zoom}>
                    <span className="opacity-0 group-hover/lights:opacity-100">⤢</span>
                </button>
            ) : (
                <i aria-hidden className="size-3 rounded-full bg-[#28c840]" />
            )}
        </span>
    );
}

/**
 * Whether the sidebar shows. It starts as "auto": shown on wide screens and hidden on narrow ones,
 * where it covers the window when shown, so opening something there puts it away again.
 */
export function useSidebar() {
    const [state, setState] = useState<boolean | null>(null);
    return {
        state,
        show: () => setState(true),
        hide: () => setState(false),
        /** Call after navigating from the sidebar. */
        done: () => {
            if (!matchMedia("(min-width: 640px)").matches) setState(null);
        },
        className: cn(
            "absolute inset-y-0 left-0 z-30 transition-transform duration-200 sm:static",
            state === null ? "-translate-x-full sm:translate-x-0" : state ? "translate-x-0 shadow-xl sm:shadow-none" : "-translate-x-full sm:hidden",
        ),
    };
}
export type Sidebar = ReturnType<typeof useSidebar>;

/** The sidebar column: window buttons and the toggle on top, then its content. */
export function MacSidebar({ sidebar, width = 220, toolbar, children }: { sidebar: Sidebar; width?: number; toolbar?: ReactNode; children: ReactNode }) {
    const label = useText()(["Hide Sidebar", "隐藏边栏", "隱藏側邊欄"]);
    return (
        <aside className={cn("flex shrink-0 flex-col", MAC.sidebar, sidebar.className)} style={{ width }}>
            <div className="flex h-[52px] shrink-0 items-center gap-2 px-4">
                <TrafficLights />
                <span className="ml-auto flex items-center gap-2">
                    {toolbar}
                    <button type="button" aria-label={label} title={label} className={TOOL} onClick={sidebar.hide}>
                        <SFSymbol name="sidebar.left" className="h-3.5 w-[18px]" />
                    </button>
                </span>
            </div>
            {children}
        </aside>
    );
}

/** The button that brings the sidebar back, for the first toolbar of the window. */
export function ShowSidebarButton({ sidebar }: { sidebar: Sidebar }) {
    const label = useText()(["Show Sidebar", "显示边栏", "顯示側邊欄"]);
    if (sidebar.state === true) return null;
    return (
        <button type="button" aria-label={label} title={label} className={cn(TOOL, sidebar.state === null && "sm:hidden")} onClick={sidebar.show}>
            <SFSymbol name="sidebar.left" className="h-3.5 w-[18px]" />
        </button>
    );
}

export function SidebarHeader({ children }: { children: ReactNode }) {
    return <p className={cn("mt-3 mb-1 px-5 text-[11px] font-semibold", MAC.muted)}>{children}</p>;
}

export function SidebarRow({ icon, iconClass, label, detail, selected, onClick, className }: {
    icon: SymbolName;
    /** The icon's color when the row isn't selected; the accent by default. */
    iconClass?: string;
    label: ReactNode;
    detail?: ReactNode;
    selected: boolean;
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            type="button"
            aria-current={selected || undefined}
            className={cn("mx-2.5 flex h-8 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors", selected ? MAC.selected : MAC.hover, className)}
            onClick={onClick}
        >
            <SFSymbol name={icon} className={cn("size-4 shrink-0", !selected && (iconClass ?? MAC.accent))} />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {detail && <span className={cn("shrink-0 text-[11px]", selected ? "text-white/80" : MAC.muted)}>{detail}</span>}
        </button>
    );
}

/** A column's title bar: optional leading items, the title (and subtitle), then trailing items. */
export function TitleBar({ leading, title, subtitle, children, className }: { leading?: ReactNode; title: ReactNode; subtitle?: ReactNode; children?: ReactNode; className?: string }) {
    return (
        <header className={cn("flex h-[52px] shrink-0 items-center gap-2 px-3", className)}>
            {leading}
            <div className="mr-auto min-w-0 pl-1 leading-tight">
                <h4 className="truncate text-[15px] font-semibold">{title}</h4>
                {subtitle && <p className={cn("truncate text-[11px]", MAC.muted)}>{subtitle}</p>}
            </div>
            {children}
        </header>
    );
}

/** A toolbar button with a symbol, on its own or (`grouped`) inside a `CAPSULE`. */
export function ToolButton({ icon, label, onClick, disabled, grouped, active, className }: {
    icon: SymbolName;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    grouped?: boolean;
    /** Shown pressed, for a toggle that is on. */
    active?: boolean;
    className?: string;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={active}
            disabled={disabled}
            className={cn(grouped ? TOOL_ITEM : TOOL, active && "!bg-[#007aff]/15 !text-[#007aff] dark:!bg-[#0a84ff]/25 dark:!text-[#4da3ff]", disabled && "opacity-35")}
            onClick={onClick}
        >
            <SFSymbol name={icon} className={cn("size-4", className)} />
        </button>
    );
}

export function Segmented<T extends string>({ options, value, onChange, className }: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
}) {
    return (
        <div role="radiogroup" className={cn(CAPSULE, "p-0.5 text-[12px]", className)}>
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={o.value === value}
                    className={cn("h-7 flex-1 rounded-full px-3 whitespace-nowrap", o.value === value ? "bg-black/8 font-medium dark:bg-white/14" : "opacity-80")}
                    onClick={() => onChange(o.value)}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

/** A toolbar search field. */
export function SearchField({ value, placeholder, onChange, className }: { value: string; placeholder: string; onChange: (value: string) => void; className?: string }) {
    return (
        <label className={cn(CAPSULE, "w-44 gap-1.5 px-3", className)}>
            <SFSymbol name="magnifyingglass" className="size-3 shrink-0 opacity-70" />
            <input value={value} placeholder={placeholder} aria-label={placeholder} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-current placeholder:opacity-60" onChange={(e) => onChange(e.target.value)} />
        </label>
    );
}

/** The trailing inspector column; on narrow screens it covers the window instead. */
export function Inspector({ open, width = 320, className, children }: { open: boolean; width?: number; className?: string; children: ReactNode }) {
    if (!open) return null;
    return (
        <aside
            className={cn("absolute inset-y-0 right-0 z-20 flex max-w-full shrink-0 flex-col border-l shadow-xl motion-safe:animate-in motion-safe:slide-in-from-right-4 md:static md:shadow-none", MAC.line, MAC.window, className)}
            style={{ width }}
        >
            {children}
        </aside>
    );
}

/** The macOS progress spinner: eight bars fading around a circle, stepping round. */
export function Spinner({ className, label }: { className?: string; label?: string }) {
    return (
        <svg viewBox="0 0 24 24" role={label ? "img" : undefined} aria-label={label} aria-hidden={!label} className={cn("motion-safe:animate-[spin_0.8s_steps(8)_infinite]", className)}>
            {Array.from({ length: 8 }, (_, i) => (
                <rect key={i} x="11" y="2" width="2" height="6.5" rx="1" fill="currentColor" opacity={0.25 + (0.75 * (8 - i)) / 8} transform={`rotate(${-i * 45} 12 12)`} />
            ))}
        </svg>
    );
}

/** An empty column's message, like ContentUnavailableView. */
export function Unavailable({ icon, title, children }: { icon: SymbolName; title: string; children?: ReactNode }) {
    return (
        <div className={cn("flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center", MAC.muted)}>
            <SFSymbol name={icon} className="mb-1 size-10 opacity-70" />
            <p className={cn("text-[17px] font-semibold", MAC.text)}>{title}</p>
            {children && <p className="max-w-[280px] text-[13px]">{children}</p>}
        </div>
    );
}

/** A small menu under a toolbar button, closed by clicking elsewhere. */
export function Popover({ open, onClose, children, className }: { open: boolean; onClose: () => void; children: ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const close = (e: PointerEvent) => !ref.current?.parentElement?.contains(e.target as Node) && onClose();
        document.addEventListener("pointerdown", close);
        return () => document.removeEventListener("pointerdown", close);
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div ref={ref} className={cn("absolute top-9 right-0 z-30 rounded-xl border p-1.5 text-[12px] shadow-[0_10px_30px_rgb(0_0_0/0.2)] motion-safe:animate-in motion-safe:fade-in", MAC.line, MAC.window, className)}>
            {children}
        </div>
    );
}
