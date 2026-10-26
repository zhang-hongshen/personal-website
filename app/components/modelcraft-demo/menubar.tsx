import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { locale, useLang, useText, type L } from "~/components/demo-text";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";

// The macOS menu bar of the ModelCraft demo's desktop: the Apple menu, the front app's menus and the
// status items on the right (Wi-Fi, battery, Control Center, Spotlight and the clock), each a menu or
// panel that opens on click and switches as the pointer moves along the bar, the way macOS does.

export type MenuItem =
    | "-"
    | { label: L | string; shortcut?: string; disabled?: boolean; checked?: boolean; onSelect?: () => void; href?: string };
export type Menu = { id: string; title: ReactNode; /** What a screen reader calls the title. */ aria: string; bold?: boolean; items: MenuItem[] };

/** The menus' and panels' glass. */
const PANEL = "rounded-[12px] border border-black/10 bg-white/80 p-1 text-[13px] text-[#1d1d1f] shadow-[0_12px_40px_rgb(0_0_0/0.22)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/12 dark:bg-[#2b2b2b]/80 dark:text-[#f0f0f0]";

export function AppleLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
            <path d="M16.37 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.21-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8C4 18.38 2.96 15.57 2.96 12.92c0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.68.95 3.6.95.87 0 2.22-1.01 3.9-1.01.61 0 2.89.06 4.37 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.95 4.45z" />
        </svg>
    );
}

function WifiIcon({ on, className }: { on: boolean; className?: string }) {
    return (
        <svg viewBox="0 0 20 16" aria-hidden className={className} fill="currentColor">
            <path opacity={on ? 1 : 0.3} d="M10 2.2c3.1 0 5.9 1.2 8 3.2l1.3-1.4C16.8 1.6 13.5.2 10 .2S3.2 1.6.7 4l1.3 1.4c2.1-2 4.9-3.2 8-3.2z" />
            <path opacity={on ? 1 : 0.3} d="M10 6.3c2 0 3.8.8 5.2 2.1l1.3-1.4C14.8 5.3 12.5 4.3 10 4.3S5.2 5.3 3.5 7l1.3 1.4C6.2 7.1 8 6.3 10 6.3z" />
            <path opacity={on ? 1 : 0.3} d="M10 10.4c.9 0 1.7.3 2.3.9l1.4-1.4c-1-1-2.3-1.5-3.7-1.5s-2.7.6-3.7 1.5l1.4 1.4c.6-.6 1.4-.9 2.3-.9z" />
            <circle opacity={on ? 1 : 0.3} cx="10" cy="14" r="1.6" />
        </svg>
    );
}

function BatteryIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 27 13" aria-hidden className={className}>
            <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity="0.45" />
            <rect x="2" y="2" width="17.5" height="9" rx="2" fill="currentColor" />
            <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity="0.45" />
        </svg>
    );
}

function ControlCenterIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 18 16" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1.5" width="16" height="5" rx="2.5" />
            <circle cx="14.5" cy="4" r="1.2" fill="currentColor" stroke="none" />
            <rect x="1" y="9.5" width="16" height="5" rx="2.5" />
            <circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </svg>
    );
}

/** The clock on the right of the menu bar, set to this computer's time once the page is running. */
function Clock() {
    const lang = useLang();
    const [now, setNow] = useState<Date | null>(null);
    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 10_000);
        return () => clearInterval(timer);
    }, []);
    if (!now) return null;
    const text = new Intl.DateTimeFormat(locale(lang), { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(now);
    return <span className="tabular-nums">{text}</span>;
}

export function MenuBar({ menus, wifi, brightness, volume, onWifi, onBrightness, onVolume, onSpotlight }: {
    menus: Menu[];
    wifi: boolean;
    brightness: number;
    volume: number;
    onWifi: (on: boolean) => void;
    onBrightness: (value: number) => void;
    onVolume: (value: number) => void;
    onSpotlight: () => void;
}) {
    const s = useText();
    const [open, setOpen] = useState<string | null>(null);
    const bar = useRef<HTMLDivElement>(null);

    // A click outside the bar or Escape closes whatever is open.
    useEffect(() => {
        if (!open) return;
        const away = (e: PointerEvent) => {
            if (!bar.current?.contains(e.target as Node)) setOpen(null);
        };
        const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
        document.addEventListener("pointerdown", away);
        document.addEventListener("keydown", key);
        return () => {
            document.removeEventListener("pointerdown", away);
            document.removeEventListener("keydown", key);
        };
    }, [open]);

    /** A title in the bar: opens on click, and takes over from another open one on hover. */
    const title = (id: string, label: ReactNode, children: ReactNode, opts: { bold?: boolean; align?: "left" | "right"; className?: string; aria: string }) => (
        <div className="relative flex h-full items-center">
            <button
                type="button"
                aria-label={opts.aria}
                aria-expanded={open === id}
                className={cn("flex h-[22px] items-center rounded-[5px] px-2", open === id ? "bg-black/12 dark:bg-white/20" : "", opts.bold && "font-semibold", opts.className)}
                onClick={() => setOpen((o) => (o === id ? null : id))}
                onPointerEnter={() => open && open !== id && setOpen(id)}
            >
                {label}
            </button>
            {open === id && <div className={cn("absolute top-[26px] z-10 motion-safe:animate-in motion-safe:fade-in", opts.align === "right" ? "right-0" : "left-0")}>{children}</div>}
        </div>
    );

    const list = (items: MenuItem[]) => (
        <div role="menu" className={cn(PANEL, "min-w-[220px]")}>
            {items.map((item, i) => {
                if (item === "-") return <hr key={i} className="mx-2.5 my-1 border-black/10 dark:border-white/12" />;
                const body = (
                    <>
                        <span className="w-4 shrink-0 text-[11px]">{item.checked && <SFSymbol name="checkmark" className="size-2.5" />}</span>
                        <span className="flex-1 whitespace-nowrap">{s(item.label)}</span>
                        {item.shortcut && <span className="ml-6 opacity-50">{item.shortcut}</span>}
                    </>
                );
                const cls = cn("flex h-[22px] w-full items-center rounded-[5px] pr-2.5 pl-1.5 text-left", item.disabled ? "opacity-35" : "hover:bg-[#0a82ff] hover:text-white");
                if (item.href && !item.disabled) {
                    return <Link key={i} role="menuitem" to={item.href} className={cls} onClick={() => setOpen(null)}>{body}</Link>;
                }
                return (
                    <button
                        key={i}
                        type="button"
                        role="menuitem"
                        disabled={item.disabled}
                        className={cls}
                        onClick={() => {
                            setOpen(null);
                            item.onSelect?.();
                        }}
                    >
                        {body}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div ref={bar} className="absolute inset-x-0 top-0 z-[70] flex h-7 items-center gap-0.5 bg-white/25 px-1.5 text-[13px] text-[#1d1d1f] backdrop-blur-xl select-none dark:bg-black/20 dark:text-white/90">
            {menus.map((m, i) => (
                <Fragment key={m.id}>
                    {title(m.id, m.title, list(m.items), { bold: m.bold, aria: m.aria, className: i > 1 ? "hidden sm:flex" : undefined })}
                </Fragment>
            ))}

            <span className="ml-auto" />
            {title("wifi", <WifiIcon on={wifi} className="h-[13px] w-4" />, (
                <div className={cn(PANEL, "w-[260px] p-3")}>
                    <Toggle label="Wi-Fi" on={wifi} onChange={onWifi} />
                    {wifi && (
                        <>
                            <p className="mt-3 mb-1 px-1 text-[11px] font-semibold opacity-50">{s(["Known Network", "已知网络", "已知網路"])}</p>
                            <p className="flex items-center gap-2 rounded-md bg-black/5 px-2 py-1.5 dark:bg-white/8">
                                <span className="flex size-6 items-center justify-center rounded-full bg-[#0a82ff] text-white"><WifiIcon on className="h-2.5 w-3" /></span>
                                Lumen Studio
                                <SFSymbol name="checkmark" className="ml-auto size-2.5 opacity-60" />
                            </p>
                        </>
                    )}
                </div>
            ), { align: "right", aria: "Wi-Fi", className: "hidden sm:flex" })}
            {title("battery", <BatteryIcon className="h-[11px] w-[23px]" />, (
                <div className={cn(PANEL, "w-[220px] p-3")}>
                    <p className="flex items-center justify-between font-semibold">{s(["Battery", "电池", "電池"])}<span className="font-normal opacity-60">87%</span></p>
                    <p className="mt-1 text-[12px] opacity-60">{s(["Power Source: Battery", "电源：电池", "電源：電池"])}</p>
                </div>
            ), { align: "right", aria: s(["Battery", "电池", "電池"]), className: "hidden sm:flex" })}
            {title("control", <ControlCenterIcon className="h-[13px] w-[15px]" />, (
                <div className={cn(PANEL, "grid w-[280px] gap-2 p-2.5")}>
                    <div className="grid grid-cols-2 gap-2">
                        <Tile label="Wi-Fi" detail={wifi ? "Lumen Studio" : s(["Off", "关闭", "關閉"])} on={wifi} onClick={() => onWifi(!wifi)} />
                        <TileGroup />
                    </div>
                    <Slider label={s(["Display", "显示器", "顯示器"])} icon="☀︎" value={brightness} min={0.3} onChange={onBrightness} />
                    <Slider label={s(["Sound", "声音", "聲音"])} icon="🔈︎" value={volume} min={0} onChange={onVolume} />
                </div>
            ), { align: "right", aria: s(["Control Center", "控制中心", "控制中心"]) })}
            <button type="button" aria-label="Spotlight" className="flex h-[22px] items-center rounded-[5px] px-2" onClick={() => { setOpen(null); onSpotlight(); }}>
                <SFSymbol name="magnifyingglass" className="size-[13px]" />
            </button>
            <span className="px-2"><Clock /></span>
        </div>
    );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
    return (
        <label className="flex items-center justify-between px-1 font-semibold">
            {label}
            <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={label}
                className={cn("relative h-[22px] w-[38px] rounded-full transition-colors", on ? "bg-[#0a82ff]" : "bg-black/15 dark:bg-white/20")}
                onClick={() => onChange(!on)}
            >
                <i className={cn("absolute top-0.5 size-[18px] rounded-full bg-white shadow transition-[left]", on ? "left-[18px]" : "left-0.5")} />
            </button>
        </label>
    );
}

function Tile({ label, detail, on, onClick }: { label: string; detail: string; on: boolean; onClick: () => void }) {
    return (
        <button type="button" aria-pressed={on} className="flex items-center gap-2 rounded-[10px] bg-black/5 p-2 text-left dark:bg-white/8" onClick={onClick}>
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", on ? "bg-[#0a82ff] text-white" : "bg-black/10 dark:bg-white/15")}>
                <WifiIcon on className="h-3 w-3.5" />
            </span>
            <span className="min-w-0 leading-tight">
                <b className="block text-[12px] font-semibold">{label}</b>
                <span className="block truncate text-[11px] opacity-60">{detail}</span>
            </span>
        </button>
    );
}

/** Bluetooth, AirDrop and Focus: toggles that only change how they look. */
function TileGroup() {
    const s = useText();
    const [on, setOn] = useState({ bluetooth: true, airdrop: false, focus: false });
    const items: { id: keyof typeof on; label: L }[] = [
        { id: "bluetooth", label: ["Bluetooth", "蓝牙", "藍牙"] },
        { id: "airdrop", label: ["AirDrop", "隔空投送", "AirDrop"] },
        { id: "focus", label: ["Focus", "专注模式", "專注模式"] },
    ];
    return (
        <div className="flex flex-col gap-1 rounded-[10px] bg-black/5 p-1.5 dark:bg-white/8">
            {items.map((item) => (
                <button key={item.id} type="button" aria-pressed={on[item.id]} className="flex items-center gap-1.5 text-left text-[11px]" onClick={() => setOn((o) => ({ ...o, [item.id]: !o[item.id] }))}>
                    <i className={cn("size-3 shrink-0 rounded-full", on[item.id] ? "bg-[#0a82ff]" : "bg-black/15 dark:bg-white/25")} />
                    {s(item.label)}
                </button>
            ))}
        </div>
    );
}

function Slider({ label, icon, value, min, onChange }: { label: string; icon: string; value: number; min: number; onChange: (value: number) => void }) {
    return (
        <div className="rounded-[10px] bg-black/5 p-2 dark:bg-white/8">
            <p className="mb-1.5 text-[12px] font-semibold">{label}</p>
            <label className="relative flex h-6 items-center overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
                <span className="absolute inset-y-0 left-0 rounded-full bg-white shadow-sm dark:bg-white/90" style={{ width: `${Math.max(12, ((value - min) / (1 - min)) * 100)}%` }} />
                <span className="relative pl-2 text-[11px] text-black/60">{icon}</span>
                <input
                    type="range"
                    aria-label={label}
                    min={min}
                    max={1}
                    step={0.01}
                    value={value}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => onChange(Number(e.target.value))}
                />
            </label>
        </div>
    );
}

/** Spotlight: a search field over the desktop that finds apps and folders and opens the one picked. */
export function Spotlight<T>({ results, onPick, onClose }: {
    results: (query: string) => { key: string; icon: ReactNode; label: string; kind: string; value: T }[];
    onPick: (value: T) => void;
    onClose: () => void;
}) {
    const s = useText();
    const [query, setQuery] = useState("");
    const [index, setIndex] = useState(0);
    const found = results(query);
    const pick = (value: T) => {
        onClose();
        onPick(value);
    };
    return (
        <div className="absolute inset-0 z-[80] flex justify-center bg-black/5 pt-[14%]" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className={cn(PANEL, "h-fit w-[min(560px,90%)] rounded-[22px] p-0 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95")}>
                <label className="flex items-center gap-3 px-4 py-3">
                    <SFSymbol name="magnifyingglass" className="size-5 opacity-50" />
                    <input
                        autoFocus
                        value={query}
                        placeholder={s(["Spotlight Search", "聚焦搜索", "Spotlight 搜尋"])}
                        aria-label={s(["Spotlight Search", "聚焦搜索", "Spotlight 搜尋"])}
                        className="min-w-0 flex-1 bg-transparent text-[20px] outline-none placeholder:opacity-40"
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setIndex(0);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") onClose();
                            else if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(found.length - 1, i + 1)); }
                            else if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(0, i - 1)); }
                            else if (e.key === "Enter" && found[index]) pick(found[index].value);
                        }}
                    />
                </label>
                {query && (
                    <div className="border-t border-black/8 p-1.5 dark:border-white/10">
                        {found.length === 0 && <p className="px-3 py-2 opacity-50">{s(["No Results", "无结果", "沒有結果"])}</p>}
                        {found.map((r, i) => (
                            <button
                                key={r.key}
                                type="button"
                                className={cn("flex w-full items-center gap-3 rounded-[10px] px-3 py-1.5 text-left", i === index && "bg-[#0a82ff] text-white")}
                                onPointerEnter={() => setIndex(i)}
                                onClick={() => pick(r.value)}
                            >
                                {r.icon}
                                <span className="flex-1">{r.label}</span>
                                <span className="text-[12px] opacity-60">{r.kind}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
