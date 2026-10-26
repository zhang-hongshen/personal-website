import { useId, type CSSProperties, type ReactNode } from "react";

import { cn } from "~/lib/utils";
import type { Art, Motif } from "./library";

// Drawn artwork for the demo's posters, backdrops and album covers: a gradient and a simple motif,
// cropped to whatever shape it fills.

const MOTIFS: Record<Motif, ReactNode> = {
    aurora: (
        <>
            <path d="M-10 40 C 20 10, 40 55, 60 25 S 100 30, 110 15 L110 45 C 90 60, 70 40, 50 60 S 10 50, -10 70Z" fill="#7cffcb" opacity=".35" />
            <path d="M-10 55 C 25 35, 45 70, 70 45 S 100 50, 110 40 L110 60 C 85 70, 65 55, 45 72 S 5 65, -10 80Z" fill="#a78bfa" opacity=".3" />
            <path d="M-5 100 L20 72 L35 84 L55 64 L75 82 L90 70 L105 100Z" fill="#061224" opacity=".85" />
            {[[12, 12], [30, 8], [80, 10], [92, 22], [64, 6]].map(([x, y]) => <circle key={x} cx={x} cy={y} r=".7" fill="#fff" opacity=".8" />)}
        </>
    ),
    moon: (
        <>
            <circle cx="68" cy="28" r="13" fill="#f5f0d6" opacity=".9" />
            <path d="M-5 70 Q 25 64, 50 70 T 105 70 V105 H-5Z" fill="#0a1020" opacity=".7" />
            <path d="M38 68 L62 68 L58 60 L44 60Z M48 60 V52 H54 V60" fill="#0a0f1a" />
            <path d="M0 78 Q 25 74, 50 78 T 100 78" stroke="#f5f0d6" strokeOpacity=".25" strokeWidth=".6" fill="none" />
        </>
    ),
    sun: (
        <>
            <circle cx="50" cy="52" r="22" fill="#ffe29a" opacity=".85" />
            <path d="M-5 72 Q 30 60, 55 70 T 105 66 V105 H-5Z" fill="#000" opacity=".25" />
            <path d="M-5 82 Q 40 72, 70 80 T 105 78 V105 H-5Z" fill="#000" opacity=".3" />
        </>
    ),
    rings: (
        <>
            <circle cx="50" cy="48" r="17" fill="#c4b5fd" opacity=".9" />
            <ellipse cx="50" cy="48" rx="36" ry="8" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" transform="rotate(-14 50 48)" />
            <ellipse cx="50" cy="48" rx="30" ry="6" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth=".8" transform="rotate(-14 50 48)" />
            {[[10, 15], [85, 12], [20, 85], [90, 80], [70, 90]].map(([x, y]) => <circle key={x} cx={x} cy={y} r=".6" fill="#fff" />)}
        </>
    ),
    glass: (
        <>
            <path d="M20 90 V45 L50 20 L80 45 V90Z" fill="#fff" opacity=".12" stroke="#fff" strokeOpacity=".5" strokeWidth=".8" />
            <path d="M35 90 V45 M50 90 V20 M65 90 V45 M20 60 H80 M20 75 H80" stroke="#fff" strokeOpacity=".4" strokeWidth=".6" />
            <circle cx="40" cy="80" r="7" fill="#2f7d4f" opacity=".8" />
            <circle cx="60" cy="78" r="9" fill="#3f9a5f" opacity=".7" />
        </>
    ),
    city: (
        <>
            <circle cx="75" cy="22" r="8" fill="#ffd1e8" opacity=".7" />
            <path d="M0 100 V60 H12 V45 H22 V62 H30 V35 H42 V58 H50 V50 H62 V30 H72 V55 H82 V42 H92 V65 H100 V100Z" fill="#12091f" opacity=".9" />
            {[[15, 52], [34, 42], [36, 50], [65, 38], [66, 46], [86, 50], [56, 56]].map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="2" height="2.5" fill="#ffcf5c" />)}
        </>
    ),
    kites: (
        <>
            <path d="M30 20 L40 32 L30 48 L20 32Z" fill="#e74c3c" />
            <path d="M65 12 L73 22 L65 34 L57 22Z" fill="#2e86de" />
            <path d="M30 48 Q 35 65, 28 80 T 32 100 M65 34 Q 70 50, 62 64 T 66 90" stroke="#333" strokeOpacity=".5" strokeWidth=".5" fill="none" />
            <path d="M-5 88 Q 50 78, 105 90 V105 H-5Z" fill="#6ab04c" />
        </>
    ),
    waves: (
        <>
            {[50, 62, 74, 86].map((y, i) => (
                <path key={y} d={`M-5 ${y} Q 12 ${y - 6}, 25 ${y} T 55 ${y} T 85 ${y} T 115 ${y} V105 H-5Z`} fill="#fff" opacity={0.1 + i * 0.07} />
            ))}
            <circle cx="72" cy="26" r="9" fill="#fff" opacity=".6" />
        </>
    ),
    map: (
        <>
            <path d="M10 20 C 30 30, 20 50, 40 55 S 60 80, 85 85" stroke="#2d6a9f" strokeWidth="3" fill="none" opacity=".8" />
            <path d="M5 10 H95 V95 H5Z" fill="none" stroke="#3b2f1e" strokeOpacity=".4" strokeWidth=".6" />
            <path d="M20 0 V100 M40 0 V100 M60 0 V100 M80 0 V100 M0 30 H100 M0 50 H100 M0 70 H100" stroke="#3b2f1e" strokeOpacity=".18" strokeWidth=".4" />
            <path d="M72 22 L76 30 L72 28 L68 30Z" fill="#8c3b2a" />
        </>
    ),
    notes: (
        <>
            <circle cx="50" cy="40" r="20" fill="#fff6d8" opacity=".85" />
            <path d="M28 70 h6 v-18 l14 -3 v16" stroke="#3a1c1c" strokeWidth="2" fill="none" />
            <ellipse cx="31" cy="70" rx="3.5" ry="2.6" fill="#3a1c1c" />
            <ellipse cx="45" cy="65" rx="3.5" ry="2.6" fill="#3a1c1c" />
            <path d="M62 78 v-14 l10 -2 v12" stroke="#3a1c1c" strokeWidth="1.6" fill="none" />
            <ellipse cx="59.5" cy="78" rx="3" ry="2.2" fill="#3a1c1c" />
            <ellipse cx="69.5" cy="74" rx="3" ry="2.2" fill="#3a1c1c" />
        </>
    ),
    bloom: (
        <>
            {[0, 60, 120, 180, 240, 300].map((r) => <ellipse key={r} cx="50" cy="34" rx="7" ry="16" fill="#fff" opacity=".22" transform={`rotate(${r} 50 50)`} />)}
            <circle cx="50" cy="50" r="7" fill="#ffe66d" opacity=".9" />
            <path d="M0 85 H100 M0 88 H100 M0 91 H100" stroke="#fff" strokeOpacity=".2" strokeWidth=".5" />
        </>
    ),
    tide: (
        <>
            <path d="M58 30 L62 30 L64 70 L56 70Z" fill="#f5f5f5" />
            <path d="M56 26 H64 L62 30 H58Z" fill="#c0392b" />
            <path d="M60 28 L105 15 L105 41Z" fill="#ffe08a" opacity=".35" />
            <path d="M-5 72 Q 25 66, 50 72 T 105 72 V105 H-5Z" fill="#0b1e33" opacity=".85" />
        </>
    ),
    desk: (
        <>
            <rect x="22" y="30" width="56" height="34" rx="2" fill="#fff" opacity=".9" />
            <path d="M27 38 H60 M27 44 H72 M27 50 H66 M27 56 H52" stroke="#1b1b1b" strokeWidth="1.6" opacity=".7" />
            <circle cx="82" cy="20" r="6" fill="#fff" opacity=".7" />
            <path d="M82 16 V20 L85 22" stroke="#1b1b1b" strokeWidth=".8" fill="none" />
        </>
    ),
    leaf: (
        <>
            <path d="M50 15 C 80 30, 80 70, 50 88 C 20 70, 20 30, 50 15Z" fill="#fff" opacity=".25" />
            <path d="M50 20 V86 M50 40 L62 32 M50 52 L66 44 M50 64 L62 58 M50 40 L38 32 M50 52 L34 44 M50 64 L38 58" stroke="#fff" strokeOpacity=".6" strokeWidth=".8" fill="none" />
        </>
    ),
};

/** The art filling its box; `children` go on top (a title on a poster, for example). */
export function Artwork({ art, className, style, children }: { art: Art; className?: string; style?: CSSProperties; children?: ReactNode }) {
    // Gradient ids end up in url(#…), so keep them to plain characters.
    const id = `art${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
    return (
        <div className={cn("relative overflow-hidden", className)} style={style}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
                <defs>
                    <linearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
                        <stop offset="0" stopColor={art.from} />
                        <stop offset="1" stopColor={art.to} />
                    </linearGradient>
                </defs>
                <rect x="-50" y="-50" width="200" height="200" fill={`url(#${id})`} />
                {MOTIFS[art.motif]}
            </svg>
            {children}
        </div>
    );
}

/** A poster with the title set on it, like key art. */
export function Poster({ art, title, className }: { art: Art; title: string; className?: string }) {
    return (
        <Artwork art={art} className={cn("aspect-[2/3]", className)}>
            <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 to-transparent px-2.5 pt-8 pb-2.5 text-center text-[11px] leading-tight font-bold tracking-[0.12em] text-white uppercase">
                {title}
            </span>
        </Artwork>
    );
}
