import { useEffect, useRef, useState, type ReactNode } from "react";

import { MAC, TrafficLights } from "~/components/mac-ui";
import { MAC_FONT } from "~/components/mac-window";
import { SFSymbol, type SymbolName } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { SevenSegment } from "./readout";
import { SAMPLE_PIECES, Scale, UNITS, format, placeholder, unitInfo, type Unit } from "./scale";

// A Pinch window that works like the app, on a simulated trackpad: click the pan to rest a finger on
// it, put things from the desk on the finger, and use the keys. The desk beside it stands in for the
// real world and the app's Settings.

// The app's asset colors, light and dark.
const C = {
    body: "bg-linear-to-b from-[#f7f7f9] to-[#e7e8ec] dark:from-[#2e2e33] dark:to-[#222226]",
    readout: "bg-[#c7d1ce] text-[#1c2321] dark:bg-[#1a201e] dark:text-[#afc2bb]",
    keycap: "bg-[#fcfcfd] text-[#55565c] dark:bg-[#1c1c1f] dark:text-[#d6d7dc]",
    panEdge: "bg-[#cccdd3] dark:bg-[#4d4e55]",
    pan: "#e3e4e8",
    panDark: "#3a3b41",
};

type Thing = { id: string; name: string; detail: string; grams: number; icon: ReactNode };

const THINGS: Thing[] = [
    { id: "coin", name: "Coin", detail: "7.5 g", grams: 7.5, icon: <circle cx="12" cy="12" r="8" /> },
    { id: "clips", name: "10 paper clips", detail: "0.46 g each", grams: 4.6, icon: <path d="M9 7v9a3 3 0 0 0 6 0V5a2 2 0 0 0-4 0v10" /> },
    { id: "more", name: "28 more paper clips", detail: "0.46 g each", grams: 12.88, icon: <path d="M6 8v8a3 3 0 0 0 6 0V6a2 2 0 0 0-4 0v9M14 8v8a3 3 0 0 0 6 0V6a2 2 0 0 0-4 0v9" /> },
    { id: "ring", name: "Ring", detail: "3.2 g", grams: 3.2, icon: <><circle cx="12" cy="14" r="6" /><path d="m10 6 2-3 2 3" /></> },
    { id: "battery", name: "AA battery", detail: "23 g", grams: 23, icon: <><rect x="4" y="8" width="15" height="8" rx="1.5" /><path d="M21 11v2" /></> },
    { id: "apple", name: "Apple", detail: "182 g", grams: 182, icon: <path d="M12 7c-2-1.5-7-1-7 5s3 9 5 9c1 0 1.4-.5 2-.5s1 .5 2 .5c2 0 5-3 5-9s-5-6.5-7-5zM12 7c0-2 1-3.5 3-4" /> },
    { id: "brick", name: "Brick", detail: "2.3 kg", grams: 2300, icon: <><rect x="3" y="7" width="18" height="10" rx="1" /><path d="M3 12h18M9 7v5M15 12v5" /></> },
];

export function PinchDemo({ className }: { className?: string }) {
    const scale = useRef(new Scale()).current;
    const [, setFrame] = useState(0);
    const [unit, setUnit] = useState<Unit>("g");
    const [placed, setPlaced] = useState<string[]>([]);
    const [calibrating, setCalibrating] = useState(false);

    // Trackpad frames, while the page shows.
    useEffect(() => {
        let id = 0;
        const loop = (ms: number) => {
            scale.step(ms / 1000);
            setFrame((n) => n + 1);
            id = requestAnimationFrame(loop);
        };
        id = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(id);
    }, [scale]);

    useEffect(() => {
        scale.load = THINGS.filter((t) => placed.includes(t.id)).reduce((sum, t) => sum + t.grams, 0);
    }, [placed, scale]);

    const toggleFinger = () => {
        scale.hasContact = !scale.hasContact;
        // Objects rest on the finger, so lifting it takes them off too.
        if (!scale.hasContact) setPlaced([]);
    };
    const toggleThing = (id: string) => {
        if (!scale.hasContact) scale.hasContact = true;
        setPlaced((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    };

    return (
        <div className={cn("flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center", className)} style={{ fontFamily: MAC_FONT }}>
            <div className={cn("relative w-full max-w-[440px] overflow-hidden rounded-[18px] border border-black/12 text-left text-[13px] shadow-[0_24px_70px_-20px_rgb(0_0_0/0.35)] dark:border-white/12", C.body, MAC.text)}>
                <div className="absolute top-4 left-4"><TrafficLights /></div>
                <div className="flex flex-col gap-5 px-4 pt-11 pb-6 sm:px-6">
                    <Readout scale={scale} unit={unit} />
                    <div className="flex justify-center gap-2">
                        <Key label="Tare" shortcut="⌘T" onClick={() => scale.tare()}>
                            <span className="text-[15px] tracking-tight">→0←</span>
                        </Key>
                        <Key label="Hold" shortcut="⌘L" lit={scale.isHolding} disabled={!scale.isHolding && !scale.canHold} onClick={() => scale.toggleHold()}>
                            <Symbol name="lock" />
                        </Key>
                        <Key label="Counting Mode" shortcut="⌘U" lit={scale.mode === "count"} onClick={() => scale.toggleCounting()}>
                            <Symbol name="number" />
                        </Key>
                        <Key label="Calibrate" shortcut="⌘K" onClick={() => setCalibrating(true)}>
                            <Symbol name="scalemass" />
                        </Key>
                    </div>
                    <Pan press={scale.press} onClick={toggleFinger} />
                </div>
                {calibrating && <Calibration scale={scale} unit={unit} onClose={() => setCalibrating(false)} />}
            </div>

            <Desk
                finger={scale.hasContact}
                placed={placed}
                unit={unit}
                onFinger={toggleFinger}
                onThing={toggleThing}
                onUnit={setUnit}
            />
        </div>
    );
}

function Symbol({ name }: { name: SymbolName }) {
    return <SFSymbol name={name} className="h-[18px] w-[18px]" />;
}

function Readout({ scale, unit }: { scale: Scale; unit: Unit }) {
    const counting = scale.mode === "count";
    const showsWeight = scale.isHolding || scale.canHold;
    const text = scale.isOverloaded && !scale.isHolding
        ? "-OL-"
        : !showsWeight
            ? counting ? "---" : placeholder(unit)
            : counting ? String(scale.pieces(scale.shownGrams)) : format(scale.shownGrams, unit);
    const message = scale.isHolding
        ? null
        : !scale.hasContact
            ? "Place a finger on the trackpad"
            : scale.isOverloaded
                ? "Over capacity — lighten the load"
                : scale.needsSample ? `Tare, add ${SAMPLE_PIECES} pieces, then press Tare again` : null;

    return (
        <div
            role="img"
            aria-label={`Weight ${showsWeight ? `${text} ${counting ? "pieces" : unit}` : ""}`}
            className={cn("relative overflow-hidden rounded-[22px] px-5 py-4 shadow-[inset_0_2px_5px_rgb(0_0_0/0.35)] ring-1 ring-black/20 dark:ring-white/5", C.readout)}
        >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-white/18 to-transparent" />
            <div className="flex h-4 items-center gap-3.5 text-[11px] font-semibold">
                <span className={cn("flex items-center gap-1 transition-opacity duration-200", showsWeight && scale.isStable && !scale.isHolding ? "opacity-100" : "opacity-0")}>
                    <i className="size-[7px] rounded-full bg-[#28c840]" />Stable
                </span>
                {scale.isHolding && <span>Hold</span>}
                {scale.isTared && <span>Net</span>}
                <span className="flex-1" />
                {!scale.isCalibrated && <span className="opacity-60">Not calibrated</span>}
            </div>
            <div className="mt-1.5 flex items-end justify-end gap-2.5">
                <SevenSegment text={text} className="h-[clamp(48px,14vw,72px)]" />
                <span className="w-11 text-[24px] leading-none font-semibold">{counting ? "pcs" : unitInfo(unit).id}</span>
            </div>
            <p className="mt-1.5 h-5 text-center text-[13px] opacity-70">{message}</p>
        </div>
    );
}

/** A keycap sitting in its opening in the body; toggle keys have a light like Caps Lock. */
function Key({ label, shortcut, lit, disabled, onClick, children }: {
    label: string;
    shortcut: string;
    lit?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <span className={cn("rounded-lg p-0.5 shadow-[inset_0_1px_1.5px_rgb(0_0_0/0.3)]", C.panEdge)}>
            <button
                type="button"
                aria-label={label}
                aria-pressed={lit}
                title={`${label} (${shortcut})`}
                disabled={disabled}
                className={cn(
                    "relative flex h-12 w-14 items-center justify-center rounded-md shadow-[0_1.2px_1.2px_rgb(0_0_0/0.3),inset_0_0.5px_0_rgb(255_255_255/0.9)] transition-transform active:translate-y-px active:shadow-[0_0.3px_0.6px_rgb(0_0_0/0.15)] disabled:[&>*]:opacity-40 dark:shadow-[0_1.2px_1.2px_rgb(0_0_0/0.3),inset_0_0.5px_0_rgb(255_255_255/0.08)]",
                    C.keycap,
                )}
                onClick={onClick}
            >
                {lit !== undefined && (
                    <i className={cn("absolute top-1.5 left-1.5 size-1 rounded-full", lit ? "bg-[#34c759] shadow-[0_0_4px_#34c759]" : "bg-current opacity-20")} />
                )}
                {children}
            </button>
        </span>
    );
}

/** The weighing pan, shaped like a trackpad. It doesn't show where fingers are; it sinks and darkens with the load. */
function Pan({ press, onClick }: { press: number; onClick: () => void }) {
    const shade = (base: string, by: number) => `color-mix(in srgb, ${base}, black ${(by * 100).toFixed(1)}%)`;
    const surface = (base: string) => `linear-gradient(to bottom right, ${shade(base, 0.08 * press)}, ${shade(base, 0.06 + 0.08 * press)})`;
    return (
        <div className={cn("rounded-[21px] p-[3px] shadow-[inset_0_1px_1.5px_rgb(0_0_0/0.35),0_1px_0_rgb(255_255_255/0.5)] dark:shadow-[inset_0_1px_1.5px_rgb(0_0_0/0.35),0_1px_0_rgb(255_255_255/0.08)]", C.panEdge)}>
            <button
                type="button"
                aria-label={press ? "Lift your finger" : "Rest a finger on the trackpad"}
                aria-pressed={press > 0}
                className="block aspect-[1.6] w-full rounded-[18px] [background:var(--pan)] transition-[transform,box-shadow] duration-150 ease-out dark:[background:var(--pan-dark)]"
                style={{
                    ["--pan" as string]: surface(C.pan),
                    ["--pan-dark" as string]: surface(C.panDark),
                    transform: `scale(${1 - 0.012 * press})`,
                    boxShadow: `inset 0 ${2 * press}px ${10 * press}px rgb(0 0 0 / ${0.3 * press}), inset 0 1px 0 rgb(255 255 255 / ${0.6 - 0.3 * press})`,
                }}
                onClick={onClick}
            />
        </div>
    );
}

function Calibration({ scale, unit, onClose }: { scale: Scale; unit: Unit; onClose: () => void }) {
    const [baseline, setBaseline] = useState<number | null>(null);
    const [known, setKnown] = useState("");
    const [failed, setFailed] = useState(false);
    const knownGrams = Number(known) * unitInfo(unit).grams;
    const canCalibrate = baseline !== null && knownGrams > 0 && scale.hasContact && scale.isStable;

    const calibrate = () => {
        if (baseline === null) return;
        if (scale.calibrate(knownGrams, baseline)) onClose();
        else setFailed(true);
    };

    const status = failed
        ? { icon: "exclamationmark.triangle" as const, text: "The reading barely changed. Make sure the object rests on your finger.", className: "text-[#ff9500]" }
        : baseline !== null && scale.hasContact && !scale.isStable
            ? { icon: "hourglass" as const, text: "Waiting for a stable reading…", className: MAC.muted }
            : baseline !== null && !scale.hasContact
                ? { icon: "hand.point.up.left" as const, text: "Place a finger on the trackpad", className: MAC.muted }
                : null;

    return (
        <div className="absolute inset-0 z-10 flex items-start justify-center bg-black/10 px-3 pt-3 dark:bg-black/30">
            <div role="dialog" aria-label="Calibrate" className={cn("flex w-full max-w-[420px] flex-col gap-4 rounded-2xl p-5 shadow-[0_12px_40px_rgb(0_0_0/0.3)] motion-safe:animate-in motion-safe:slide-in-from-top-4", MAC.window)}>
                <h4 className="text-[20px] font-semibold">Calibrate</h4>
                <Step number={1} done={baseline !== null}>
                    <p>Rest a finger lightly on the trackpad, then press Set Zero.</p>
                    <PushButton disabled={!scale.hasContact} onClick={() => { setBaseline(scale.rawPressure); setFailed(false); }}>Set Zero</PushButton>
                </Step>
                <Step number={2} done={false} disabled={baseline === null}>
                    <p>Place an object of known weight on your finger and enter its weight. For example, a coin from the desk weighs 7.5 g.</p>
                    <label className="flex items-center gap-2">
                        <input
                            inputMode="decimal"
                            value={known}
                            placeholder="Known weight"
                            aria-label="Known weight"
                            disabled={baseline === null}
                            className={cn("h-6 w-[120px] border border-black/15 px-1.5 dark:border-white/15", MAC.field, "rounded-[5px] bg-white dark:bg-white/5")}
                            onChange={(e) => setKnown(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && canCalibrate && calibrate()}
                        />
                        {unit}
                    </label>
                </Step>
                {status && (
                    <p className={cn("flex items-start gap-1.5 text-[12px]", status.className)}>
                        <SFSymbol name={status.icon} className="mt-0.5 size-3.5 shrink-0" />{status.text}
                    </p>
                )}
                <div className="flex gap-2">
                    {scale.isCalibrated && <PushButton onClick={() => { scale.resetCalibration(); onClose(); }}>Reset Calibration</PushButton>}
                    <span className="flex-1" />
                    <PushButton onClick={onClose}>Cancel</PushButton>
                    <PushButton primary disabled={!canCalibrate} onClick={calibrate}>Calibrate</PushButton>
                </div>
            </div>
        </div>
    );
}

function Step({ number, done, disabled, children }: { number: 1 | 2; done: boolean; disabled?: boolean; children: ReactNode }) {
    return (
        <div className={cn("flex items-start gap-3", disabled && "opacity-45")}>
            <SFSymbol name={done ? "checkmark.circle.fill" : number === 1 ? "1.circle" : "2.circle"} className={cn("size-5 shrink-0", done ? "text-[#28c840]" : MAC.muted)} />
            <div className="flex flex-col items-start gap-2">{children}</div>
        </div>
    );
}

function PushButton({ primary, disabled, onClick, children }: { primary?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            disabled={disabled}
            className={cn(
                "h-6 rounded-full px-3 text-[13px] shadow-[0_0_0_0.5px_rgb(0_0_0/0.15),0_1px_2px_rgb(0_0_0/0.1)] disabled:opacity-40",
                primary ? MAC.accentBg : "bg-white dark:bg-white/15",
            )}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

/** The world around the Mac: a finger, things to weigh, and the unit from Pinch's Settings. */
function Desk({ finger, placed, unit, onFinger, onThing, onUnit }: {
    finger: boolean;
    placed: string[];
    unit: Unit;
    onFinger: () => void;
    onThing: (id: string) => void;
    onUnit: (unit: Unit) => void;
}) {
    const row = "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors";
    const on = "bg-[#ff6b4a]/14 text-foreground ring-1 ring-[#ff6b4a]/50";
    return (
        <aside className="w-full max-w-[440px] rounded-[18px] border border-border bg-card p-3 text-left text-[13px] lg:w-[260px]">
            <p className="px-3 pt-1 pb-2 text-[11px] font-semibold tracking-wide text-faint uppercase">On the trackpad</p>
            <button type="button" aria-pressed={finger} className={cn(row, finger ? on : "hover:bg-muted")} onClick={onFinger}>
                <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                    <path d="M9 11V5a2 2 0 0 1 4 0v6M13 10.5V9a2 2 0 0 1 4 0v4c0 4-2.5 8-6.5 8S5 18 5 15v-2a2 2 0 0 1 4 0" />
                </svg>
                <span className="flex-1">{finger ? "Finger resting" : "Rest a finger"}</span>
            </button>
            <div className="mt-1 grid grid-cols-2 gap-1 lg:grid-cols-1">
                {THINGS.map((t) => (
                    <button key={t.id} type="button" aria-pressed={placed.includes(t.id)} className={cn(row, "h-11", placed.includes(t.id) ? on : "hover:bg-muted")} onClick={() => onThing(t.id)}>
                        <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{t.icon}</svg>
                        <span className="flex min-w-0 flex-col leading-tight">
                            <span className="truncate">{t.name}</span>
                            <span className="truncate text-[11px] text-faint">{t.detail}</span>
                        </span>
                    </button>
                ))}
            </div>
            <label className="mt-3 flex items-center gap-2 border-t border-border px-3 pt-3">
                <span className="flex-1 text-faint">Unit</span>
                <select value={unit} className="rounded-md border border-border bg-background px-2 py-1" onChange={(e) => onUnit(e.target.value as Unit)}>
                    {UNITS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </label>
        </aside>
    );
}
