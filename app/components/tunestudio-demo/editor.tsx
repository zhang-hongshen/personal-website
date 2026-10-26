import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { useText } from "~/components/demo-text";
import { MAC } from "~/components/mac-ui";
import { cn } from "~/lib/utils";
import { clock, frequency, isBlackKey, noteName, HOP, type Take, type noteTargets } from "./take";

// The editor card: the keyboard on the left, the time ruler on top and the canvas with the notes
// and the pitch curve, drawn like TuneStudio's PitchCanvasView.

const KEYS = 56;
const RULER = 26;

type Targets = ReturnType<typeof noteTargets>;

export function Editor({ take, frames, targets, selected, pps, time, playing, onSelect, onMove, onSeek, onReset, onTranspose }: {
    take: Take;
    frames: number[];
    targets: Targets;
    selected: number | null;
    /** Pixels per second. */
    pps: number;
    time: number;
    playing: boolean;
    onSelect: (id: number | null) => void;
    /** A note dragged to a new center pitch; `commit` once the drag ends. */
    onMove: (id: number, midi: number, commit: boolean) => void;
    onSeek: (time: number) => void;
    onReset: (id: number) => void;
    onTranspose: (id: number, semitones: number) => void;
}) {
    const s = useText();
    const scroller = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(360);
    const [hover, setHover] = useState<{ x: number; y: number; frame: number } | null>(null);
    const drag = useRef<{ id: number; y: number; from: number; moved: boolean } | null>(null);

    useLayoutEffect(() => {
        const el = scroller.current;
        if (!el) return;
        const observer = new ResizeObserver(() => setHeight(Math.max(el.clientHeight - RULER, 160)));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // The visible pitch range: the melody with three semitones of room around it.
    const pitches = take.notes.map((n) => n.median);
    const low = Math.floor(Math.min(...pitches)) - 3;
    const high = Math.ceil(Math.max(...pitches)) + 3;
    const rows = high - low + 1;
    const row = height / rows;
    const y = (midi: number) => (high + 0.5 - midi) * row;
    const width = Math.ceil(take.duration * pps);

    // Keep the playhead in view while playing, a page at a time.
    useEffect(() => {
        const el = scroller.current;
        if (!el || !playing) return;
        const x = time * pps + KEYS;
        if (x > el.scrollLeft + el.clientWidth - 40 || x < el.scrollLeft + KEYS) el.scrollTo({ left: Math.max(x - KEYS - 40, 0), behavior: "smooth" });
    }, [time, pps, playing]);

    const pointerTime = (e: { clientX: number }, el: Element) => (e.clientX - el.getBoundingClientRect().left) / pps;

    const curve = () => {
        let d = "";
        let pen = false;
        frames.forEach((p, f) => {
            const prev = frames[f - 1];
            if (Number.isNaN(p)) { pen = false; return; }
            // Break at silence and at big jumps rather than drawing a steep line.
            const breaks = !pen || Number.isNaN(prev) || Math.abs(p - prev) > 2.5;
            d += `${breaks ? "M" : "L"}${(f * HOP * pps).toFixed(1)} ${y(p).toFixed(1)}`;
            pen = true;
        });
        return d;
    };

    const startDrag = (e: ReactPointerEvent, id: number) => {
        e.stopPropagation();
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        onSelect(id);
        drag.current = { id, y: e.clientY, from: targets[id].center, moved: false };
    };
    const moveDrag = (e: ReactPointerEvent) => {
        const d = drag.current;
        if (!d) return;
        const steps = Math.round((d.y - e.clientY) / row);
        if (steps === 0 && !d.moved) return;
        d.moved = true;
        onMove(d.id, Math.round(d.from) + steps, false);
    };
    const endDrag = (e: ReactPointerEvent) => {
        const d = drag.current;
        drag.current = null;
        if (!d?.moved) return;
        onMove(d.id, Math.round(d.from) + Math.round((d.y - e.clientY) / row), true);
    };

    const hovered = hover && !Number.isNaN(frames[hover.frame]) ? hover : null;
    const hoverPitch = hovered ? frames[hovered.frame] : NaN;
    const cents = Math.round((hoverPitch - Math.round(hoverPitch)) * 100);

    return (
        <div
            ref={scroller}
            tabIndex={0}
            aria-label={s(["Pitch editor", "音高编辑器", "音高編輯器"])}
            className={cn("relative min-h-0 flex-1 overflow-x-auto overflow-y-hidden rounded-[10px] border shadow-[0_2px_6px_rgb(0_0_0/0.06)] outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]/50", MAC.line, MAC.window)}
            onKeyDown={(e) => {
                if (selected === null) return;
                if (e.key === "Escape") onSelect(null);
                else if (e.key === "Backspace" || e.key === "Delete") onReset(selected);
                else if (e.key === "ArrowUp" || e.key === "ArrowDown") onTranspose(selected, e.key === "ArrowUp" ? 1 : -1);
                else return;
                e.preventDefault();
            }}
        >
            <div className="flex" style={{ width: width + KEYS }}>
                {/* The keyboard, pinned while the canvas scrolls. */}
                <div className={cn("sticky left-0 z-10 shrink-0 border-r", MAC.line, MAC.window)} style={{ width: KEYS }}>
                    <div className={cn("border-b", MAC.line)} style={{ height: RULER }} />
                    <svg width={KEYS} height={height} className="block" aria-hidden>
                        <rect width={KEYS} height={height} className="fill-white dark:fill-[#3d3d3d]" />
                        {Array.from({ length: rows }, (_, i) => {
                            const midi = high - i;
                            const top = y(midi + 0.5);
                            if (isBlackKey(midi)) return <rect key={midi} x={0} y={top + 1} width={KEYS * 0.55} height={row - 2} rx={2} className="fill-[#333] dark:fill-[#0f0f0f]" />;
                            const isC = midi % 12 === 0;
                            return (
                                <g key={midi}>
                                    <line x1={0} x2={KEYS} y1={top + row} y2={top + row} stroke="currentColor" strokeOpacity={isC ? 0.25 : 0.1} strokeWidth={0.5} />
                                    {(isC || row >= 13) && (
                                        <text x={KEYS - 5} y={top + row / 2} dominantBaseline="central" textAnchor="end" fontSize={10} fontWeight={isC ? 600 : 400} className={isC ? "fill-current" : "fill-current opacity-55"}>
                                            {noteName(midi)}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>

                <div className="relative shrink-0" style={{ width }}>
                    {/* The time ruler: click or drag to move the playhead. */}
                    <svg
                        width={width}
                        height={RULER}
                        className={cn("block cursor-pointer border-b", MAC.line)}
                        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onSeek(pointerTime(e, e.currentTarget)); }}
                        onPointerMove={(e) => e.buttons && onSeek(pointerTime(e, e.currentTarget))}
                    >
                        <title>{s(["Click to move the playhead", "点按以移动播放头", "按一下以移動播放頭"])}</title>
                        {Array.from({ length: Math.floor(take.duration * 2) + 1 }, (_, i) => {
                            const x = (i / 2) * pps;
                            const whole = i % 2 === 0;
                            return (
                                <g key={i}>
                                    <line x1={x} x2={x} y1={whole ? 12 : 18} y2={RULER} stroke="currentColor" strokeOpacity={0.3} strokeWidth={0.5} />
                                    {whole && <text x={x + 3} y={10} fontSize={10} className={cn("fill-current", MAC.muted)}>{clock(i / 2, 0)}</text>}
                                </g>
                            );
                        })}
                        <path d={`M${time * pps - 5} ${RULER - 8}h10l-5 7z`} className="fill-[#ff3b30]" />
                    </svg>

                    <svg
                        width={width}
                        height={height}
                        className="block touch-none"
                        onPointerDown={(e) => { onSelect(null); onSeek(pointerTime(e, e.currentTarget)); }}
                        onPointerMove={(e) => {
                            if (drag.current) return moveDrag(e);
                            const r = e.currentTarget.getBoundingClientRect();
                            setHover({ x: e.clientX - r.left, y: e.clientY - r.top, frame: Math.round((e.clientX - r.left) / pps / HOP) });
                        }}
                        onPointerLeave={() => setHover(null)}
                    >
                        {/* Piano-roll rows: black keys shaded, a line under every natural note, stronger at each C. */}
                        {Array.from({ length: rows }, (_, i) => {
                            const midi = high - i;
                            const top = y(midi + 0.5);
                            return (
                                <g key={midi}>
                                    {isBlackKey(midi) && <rect y={top} width={width} height={row} fill="currentColor" fillOpacity={0.045} />}
                                    {!isBlackKey(midi) && <line x1={0} x2={width} y1={top + row} y2={top + row} stroke="currentColor" strokeOpacity={midi % 12 === 0 ? 0.22 : 0.07} strokeWidth={midi % 12 === 0 ? 1 : 0.5} />}
                                </g>
                            );
                        })}
                        {Array.from({ length: Math.floor(take.duration) + 1 }, (_, s) => (
                            <line key={s} x1={s * pps} x2={s * pps} y1={0} y2={height} stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} />
                        ))}

                        {take.notes.map((n) => {
                            const t = targets[n.id];
                            const x = n.start * pps;
                            const w = Math.max((n.end - n.start) * pps, 3);
                            const h = row * 0.7;
                            const top = y(t.center) - h / 2;
                            const color = t.edited ? "#af52de" : "#ff9500";
                            const isSelected = selected === n.id;
                            const radius = Math.min(6, h * 0.35, w * 0.25);
                            return (
                                <g key={n.id} className="cursor-ns-resize" onPointerDown={(e) => startDrag(e, n.id)} onPointerMove={moveDrag} onPointerUp={endDrag}>
                                    <title>{`${noteName(t.center)} — ${s(["drag up or down, Delete to reset", "上下拖动，按 Delete 还原", "上下拖移，按 Delete 還原"])}`}</title>
                                    <rect x={x} y={top - 4} width={w} height={h + 8} fill="transparent" />
                                    <rect x={x} y={top} width={w} height={h} rx={radius} fill={color} fillOpacity={isSelected ? 0.45 : 0.24} stroke={color} strokeOpacity={isSelected ? 1 : 0.55} />
                                    {isSelected && <rect x={x - 2.5} y={top - 2.5} width={w + 5} height={h + 5} rx={radius + 2.5} fill="none" strokeWidth={1.5} className="stroke-[#007aff] dark:stroke-[#0a84ff]" strokeOpacity={0.9} />}
                                </g>
                            );
                        })}

                        <path d={curve()} fill="none" stroke="currentColor" strokeOpacity={0.86} strokeWidth={1.75} strokeLinejoin="round" className="pointer-events-none" />

                        {hovered && (
                            <g className="pointer-events-none">
                                <line x1={hovered.frame * HOP * pps} x2={hovered.frame * HOP * pps} y1={0} y2={height} stroke="currentColor" strokeOpacity={0.18} />
                                <circle cx={hovered.frame * HOP * pps} cy={y(hoverPitch)} r={3} strokeWidth={1.5} stroke="currentColor" className="fill-white dark:fill-[#1e1e1e]" />
                            </g>
                        )}
                        <line x1={time * pps} x2={time * pps} y1={0} y2={height} stroke="#ff3b30" strokeWidth={1.5} className="pointer-events-none" />
                    </svg>

                    {hovered && !drag.current && (
                        <div
                            className={cn("pointer-events-none absolute z-10 flex flex-col gap-0.5 rounded-[9px] border border-black/12 px-2.5 py-2 shadow-[0_2px_6px_rgb(0_0_0/0.16)] backdrop-blur-xl dark:border-white/12", "bg-white/85 dark:bg-[#2a2a2a]/85")}
                            style={{
                                top: RULER + Math.min(Math.max(y(hoverPitch) - 70, 8), height - 90),
                                left: hovered.frame * HOP * pps + (hovered.frame * HOP * pps > width - 140 ? -112 : 12),
                            }}
                        >
                            <span className={cn("text-[11px] tabular-nums", MAC.muted)}>{clock(hovered.frame * HOP, 2)}</span>
                            <span className="text-[15px] font-semibold">{noteName(hoverPitch)}</span>
                            {cents !== 0 && <span className={cn("text-[11px] tabular-nums", MAC.muted)}>{cents > 0 ? `+${cents}` : `−${-cents}`} {s(["cents", "音分", "音分"])}</span>}
                            <span className={cn("text-[11px]", MAC.muted)}>{frequency(hoverPitch).toFixed(1)} Hz</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
