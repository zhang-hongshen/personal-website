import { useEffect, useId, useRef, useState } from "react";

import { useText } from "~/components/demo-text";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import type { Art } from "./conversations";
import { MUTED, SMALL } from "./ui";

// What the image and video tools make: a picture drawn in SVG, and the same picture moving as a short
// loop. Save downloads the picture as an SVG file; nothing leaves the page.

/** A small seeded random number generator, so the scene comes out the same every time. */
function random(seed: number) {
    return () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}

const r = random(7);
// Buildings on each side of the street, from the edge inwards, with their lit windows.
const SIDES = [-1, 1].map((side) =>
    Array.from({ length: 6 }, (_, i) => {
        const x = side < 0 ? i * 30 : 400 - i * 30 - 34;
        const top = 40 + i * 26 + r() * 30;
        const windows = Array.from({ length: 22 }, () => ({ x: x + 4 + Math.floor(r() * 5) * 6, y: top + 8 + Math.floor(r() * 18) * 9, lit: r() > 0.45, teal: r() > 0.5 }))
            .filter((w) => w.y < 262);
        return { x, top, windows };
    }),
);
const RAIN = Array.from({ length: 90 }, () => ({ x: r() * 440 - 20, y: r() * 400, length: 8 + r() * 14, opacity: 0.15 + r() * 0.35 }));

/** A rainy street at night with purple and teal neon; `moving` makes the rain fall, the signs flicker and a car pass. */
function NightCity({ moving, paused, className, svgRef }: { moving: boolean; paused?: boolean; className?: string; svgRef?: React.Ref<SVGSVGElement> }) {
    const id = useId().replace(/:/g, "");
    const glow = `${id}-glow`;
    return (
        <svg ref={svgRef} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Night City">
            <defs>
                <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#0d0820" />
                    <stop offset="0.55" stopColor="#2a1450" />
                    <stop offset="0.68" stopColor="#4b1d6b" />
                </linearGradient>
                <linearGradient id={`${id}-street`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#1b1030" />
                    <stop offset="1" stopColor="#07050e" />
                </linearGradient>
                <radialGradient id={`${id}-haze`} cx="0.5" cy="0.62" r="0.5">
                    <stop offset="0" stopColor="#c34dff" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#c34dff" stopOpacity="0" />
                </radialGradient>
                <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id={`${id}-blur`}><feGaussianBlur stdDeviation="2.5" /></filter>
                <style>{`
                    .${id}-rain { animation: ${id}-fall 0.6s linear infinite; }
                    .${id}-flicker { animation: ${id}-flicker 3s steps(1) infinite; }
                    .${id}-car { animation: ${id}-drive 6s ease-in-out infinite; }
                    .${id}-paused * { animation-play-state: paused !important; }
                    @keyframes ${id}-fall { from { transform: translate(0, -40px); } to { transform: translate(-12px, 0); } }
                    @keyframes ${id}-flicker { 0%, 31%, 35%, 100% { opacity: 1; } 32%, 34% { opacity: 0.35; } }
                    @keyframes ${id}-drive { from { transform: translate(0, 0) scale(0.25); opacity: 0; } 15% { opacity: 1; } to { transform: translate(0, 120px) scale(1.6); opacity: 1; } }
                `}</style>
            </defs>
            <g className={paused ? `${id}-paused` : undefined}>
                <rect width="400" height="270" fill={`url(#${id}-sky)`} />
                <rect y="140" width="400" height="200" fill={`url(#${id}-haze)`} />
                {SIDES.map((side, s) => side.map((b, i) => (
                    <g key={`${s}-${i}`}>
                        <rect x={b.x} y={b.top} width="34" height={270 - b.top} fill={i % 2 ? "#120a22" : "#180d2c"} />
                        {b.windows.map((w, j) => w.lit && <rect key={j} x={w.x} y={w.y} width="3" height="4" fill={w.teal ? "#4ff3e0" : "#d78bff"} opacity="0.75" />)}
                    </g>
                )))}
                {/* Neon signs */}
                <g filter={`url(#${glow})`}>
                    <g className={moving ? `${id}-flicker` : undefined}>
                        <rect x="58" y="96" width="22" height="72" rx="4" fill="none" stroke="#e04dff" strokeWidth="3" />
                        <text x="69" y="122" textAnchor="middle" fontSize="16" fontWeight="700" fill="#f5b3ff" fontFamily="sans-serif">夜</text>
                        <text x="69" y="148" textAnchor="middle" fontSize="16" fontWeight="700" fill="#f5b3ff" fontFamily="sans-serif">市</text>
                    </g>
                    <text x="318" y="140" textAnchor="middle" fontSize="20" fontWeight="800" fill="none" stroke="#40f0dc" strokeWidth="2" fontFamily="sans-serif" letterSpacing="2">BAR</text>
                    <rect x="286" y="186" width="58" height="10" rx="5" fill="#8a5cff" opacity="0.9" />
                </g>
                {/* The street, with the signs reflected in it */}
                <path d="M0 270 L400 270 L400 400 L0 400 Z" fill={`url(#${id}-street)`} />
                <g filter={`url(#${id}-blur)`} opacity="0.55">
                    <rect x="60" y="282" width="18" height="60" fill="#e04dff" />
                    <rect x="292" y="280" width="52" height="40" fill="#40f0dc" opacity="0.7" />
                    <rect x="170" y="275" width="60" height="110" fill="#c34dff" opacity="0.35" />
                </g>
                <path d="M196 272 L204 272 L214 400 L186 400 Z" fill="#f3e9ff" opacity="0.18" />
                {[0, 1, 2, 3].map((i) => <path key={i} d={`M199 ${282 + i * 28} L201 ${282 + i * 28} L${202 + i * 2} ${296 + i * 32} L${198 - i * 2} ${296 + i * 32} Z`} fill="#f3e9ff" opacity="0.5" />)}
                {/* A car coming down the street */}
                {moving && (
                    <g className={`${id}-car`} style={{ transformOrigin: "200px 280px" }}>
                        <g filter={`url(#${glow})`}>
                            <circle cx="190" cy="284" r="3" fill="#fff6d8" />
                            <circle cx="210" cy="284" r="3" fill="#fff6d8" />
                        </g>
                        <rect x="185" y="286" width="30" height="8" rx="3" fill="#0b0716" />
                    </g>
                )}
                {/* Rain */}
                <g className={moving ? `${id}-rain` : undefined} stroke="#cfd8ff" strokeLinecap="round">
                    {RAIN.map((d, i) => <line key={i} x1={d.x} y1={d.y} x2={d.x - d.length * 0.3} y2={d.y + d.length} strokeWidth="1" opacity={d.opacity} />)}
                    {moving && RAIN.map((d, i) => <line key={`b${i}`} x1={d.x + 12} y1={d.y - 400 + 40} x2={d.x + 12 - d.length * 0.3} y2={d.y - 400 + 40 + d.length} strokeWidth="1" opacity={d.opacity} />)}
                </g>
            </g>
        </svg>
    );
}

function Artwork({ art, moving, paused, className, svgRef }: { art: Art; moving: boolean; paused?: boolean; className?: string; svgRef?: React.Ref<SVGSVGElement> }) {
    switch (art) {
        case "night-city": return <NightCity moving={moving} paused={paused} className={className} svgRef={svgRef} />;
    }
}

/** Downloads the drawing in `svg` as a file named after `saved`, with an .svg extension. */
function save(svg: SVGSVGElement | null, saved: string) {
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = saved.split("/").pop()!.replace(/\.\w+$/, ".svg");
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const BUTTON = "flex h-7 items-center gap-1.5 rounded-full bg-black/45 px-2.5 text-[12px] font-medium text-white backdrop-blur-md hover:bg-black/60";

export function GeneratedImage({ art, size, saved }: { art: Art; size: string; saved: string }) {
    const s = useText();
    const svg = useRef<SVGSVGElement>(null);
    return (
        <figure className="mb-3 w-full max-w-[320px]">
            <div className="group relative overflow-hidden rounded-xl shadow-sm">
                <Artwork art={art} moving={false} className="block aspect-square w-full" svgRef={svg} />
                <button type="button" className={cn(BUTTON, "absolute right-2 bottom-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100")} onClick={() => save(svg.current, saved)}>
                    <SFSymbol name="square.and.arrow.down" className="size-3" />
                    {s(["Save", "存储", "儲存"])}
                </button>
            </div>
            <figcaption className={cn("mt-1.5", SMALL, MUTED)}>{saved.split("/").pop()} · {size}</figcaption>
        </figure>
    );
}

/** The loop as a player: play and pause, a scrubber that shows where it is, and the time. */
export function GeneratedVideo({ art, size, seconds, saved }: { art: Art; size: string; seconds: number; saved: string }) {
    const s = useText();
    const [playing, setPlaying] = useState(true);
    const [time, setTime] = useState(0);
    const svg = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!playing) return;
        let last = performance.now();
        let frame = requestAnimationFrame(function tick(now) {
            setTime((t) => (t + (now - last) / 1000) % seconds);
            last = now;
            frame = requestAnimationFrame(tick);
        });
        return () => cancelAnimationFrame(frame);
    }, [playing, seconds]);

    const clock = (t: number) => `0:${String(Math.floor(t)).padStart(2, "0")}`;
    return (
        <figure className="mb-3 w-full max-w-[320px]">
            <div className="group relative overflow-hidden rounded-xl bg-black shadow-sm">
                <button type="button" aria-label={playing ? s(["Pause", "暂停", "暫停"]) : s(["Play", "播放", "播放"])} className="block w-full" onClick={() => setPlaying((p) => !p)}>
                    <Artwork art={art} moving paused={!playing} className="block aspect-square w-full" svgRef={svg} />
                </button>
                <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white tabular-nums backdrop-blur-md">
                    <button type="button" aria-label={playing ? s(["Pause", "暂停", "暫停"]) : s(["Play", "播放", "播放"])} onClick={() => setPlaying((p) => !p)}>
                        <SFSymbol name={playing ? "pause.fill" : "play.fill"} className="size-3" />
                    </button>
                    <span>{clock(time)}</span>
                    <span className="relative h-1 flex-1 rounded-full bg-white/30">
                        <i className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${(time / seconds) * 100}%` }} />
                    </span>
                    <span>{clock(seconds)}</span>
                    <button type="button" aria-label={s(["Save", "存储", "儲存"])} title={s(["Save", "存储", "儲存"])} onClick={() => save(svg.current, saved)}>
                        <SFSymbol name="square.and.arrow.down" className="size-3" />
                    </button>
                </div>
            </div>
            <figcaption className={cn("mt-1.5", SMALL, MUTED)}>{saved.split("/").pop()} · {size} · {seconds} s</figcaption>
        </figure>
    );
}
