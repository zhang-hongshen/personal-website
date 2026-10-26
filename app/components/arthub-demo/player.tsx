import { useCallback, useEffect, useRef, useState } from "react";

import { useLang, useText, type L } from "~/components/demo-text";
import { Popover } from "~/components/mac-ui";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { Artwork } from "./artwork";
import { duration, type Art, type Subtitle } from "./library";

// Arthub's video player over the window. There's no film to show, so the artwork drifts slowly
// behind the subtitles, which are timed as they would be from an .srt next to the file.

type Language = "off" | "en" | "zh";
const LANGUAGES: { id: Language; label: L | string }[] = [
    { id: "off", label: ["Off", "关闭", "關閉"] },
    { id: "en", label: "English" },
    { id: "zh", label: "简体中文" },
];
const SPEEDS = [0.5, 1, 1.25, 1.5, 2];
/** A subtitle every 7 seconds, each shown for 5. */
const CUE = 7;

export function VideoPlayer({ title, subtitle, art, seconds, start, subtitles, onClose }: {
    title: string;
    subtitle?: string;
    art: Art;
    seconds: number;
    start: number;
    subtitles: Subtitle[];
    /** Called with the position the viewer stopped at. */
    onClose: (position: number) => void;
}) {
    const s = useText();
    const lang = useLang();
    const [position, setPosition] = useState(start);
    const [playing, setPlaying] = useState(true);
    const [speed, setSpeed] = useState(1);
    // Picked automatically from the page's language, as the app picks it from the system's.
    const [language, setLanguage] = useState<Language>(lang === "en" ? "en" : "zh");
    const [menu, setMenu] = useState<"subtitles" | "speed" | null>(null);
    const [controls, setControls] = useState(true);
    const idle = useRef<ReturnType<typeof setTimeout>>(undefined);
    const root = useRef<HTMLDivElement>(null);
    const closeMenu = useCallback(() => setMenu(null), []);

    useEffect(() => root.current?.focus({ preventScroll: true }), []);
    useEffect(() => {
        if (!playing) return;
        let last = performance.now();
        let id = 0;
        const tick = (now: number) => {
            setPosition((p) => Math.min(p + ((now - last) / 1000) * speed, seconds));
            last = now;
            id = requestAnimationFrame(tick);
        };
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, [playing, speed, seconds]);
    useEffect(() => {
        if (position >= seconds) setPlaying(false);
    }, [position, seconds]);

    const wake = () => {
        setControls(true);
        clearTimeout(idle.current);
        idle.current = setTimeout(() => setControls(false), 2500);
    };
    useEffect(() => {
        wake();
        return () => clearTimeout(idle.current);
    }, []);

    const skip = (by: number) => setPosition((p) => Math.min(Math.max(p + by, 0), seconds));
    const cue = Math.floor(position / CUE);
    const line = language !== "off" && position % CUE < 5 ? subtitles[cue % subtitles.length][language] : null;
    const shown = controls || !playing || menu !== null;

    return (
        <div
            ref={root}
            tabIndex={-1}
            role="dialog"
            aria-label={title}
            className={cn("absolute inset-0 z-40 overflow-hidden bg-black text-white outline-none motion-safe:animate-in motion-safe:fade-in", !shown && "cursor-none")}
            onPointerMove={wake}
            onKeyDown={(e) => {
                wake();
                if (e.key === " ") setPlaying((p) => !p);
                else if (e.key === "ArrowLeft") skip(-15);
                else if (e.key === "ArrowRight") skip(15);
                else if (e.key === "Escape") onClose(position);
                else return;
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            {/* The "picture": the artwork drifting slowly, a new framing for every scene. */}
            <div className="absolute inset-0" onClick={() => setPlaying((p) => !p)}>
                <Artwork
                    art={art}
                    className="absolute inset-[-12%] transition-transform duration-[7000ms] ease-linear"
                    // Each cue is a "shot": the art drifts towards a different corner.
                    style={{ transform: `scale(${1.05 + (cue % 3) * 0.04}) translate(${((cue * 37) % 9) - 4}%, ${((cue * 53) % 7) - 3}%)` }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(transparent_40%,rgb(0_0_0/0.55))]" />
            </div>

            {line && (
                <p className="pointer-events-none absolute inset-x-6 bottom-[18%] text-center text-[clamp(15px,2.4vw,22px)] font-semibold [text-shadow:0_1px_3px_rgb(0_0_0/0.9),0_0_1px_#000]">{line}</p>
            )}

            <div className={cn("pointer-events-none absolute inset-0 transition-opacity duration-300", shown ? "opacity-100" : "opacity-0")}>
                <div className="pointer-events-auto absolute inset-x-0 top-0 flex items-center gap-3 bg-linear-to-b from-black/60 to-transparent px-4 pt-4 pb-10">
                    <button type="button" aria-label={s(["Back", "返回", "返回"])} className="flex size-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25" onClick={() => onClose(position)}>
                        <SFSymbol name="chevron.left" className="size-3.5" />
                    </button>
                    <div className="min-w-0 leading-tight">
                        <p className="truncate text-[15px] font-semibold">{title}</p>
                        {subtitle && <p className="truncate text-[11px] text-white/70">{subtitle}</p>}
                    </div>
                </div>

                <div className="pointer-events-auto absolute inset-x-3 bottom-3 rounded-2xl bg-black/35 px-4 py-3 shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.2)] backdrop-blur-xl sm:inset-x-8">
                    <div className="flex items-center gap-3 text-[11px] text-white/80 tabular-nums">
                        <span>{duration(position)}</span>
                        <input
                            type="range"
                            aria-label={s(["Playback Position", "播放进度", "播放進度"])}
                            min={0}
                            max={seconds}
                            step={1}
                            value={position}
                            className="h-1 min-w-0 flex-1 cursor-pointer accent-white"
                            onChange={(e) => setPosition(Number(e.target.value))}
                        />
                        <span>-{duration(seconds - position)}</span>
                    </div>
                    <div className="mt-2 flex items-center">
                        <span className="flex-1" />
                        <div className="flex items-center gap-5">
                            <button type="button" aria-label={s(["Skip Back 15 Seconds", "后退 15 秒", "倒轉 15 秒"])} title={s(["Skip Back 15 Seconds", "后退 15 秒", "倒轉 15 秒"])} onClick={() => skip(-15)}>
                                <SFSymbol name="gobackward.15" className="size-5" />
                            </button>
                            <button type="button" aria-label={playing ? s(["Pause", "暂停", "暫停"]) : s(["Play", "播放", "播放"])} onClick={() => setPlaying((p) => !p)}>
                                <SFSymbol name={playing ? "pause.fill" : "play.fill"} className="size-6" />
                            </button>
                            <button type="button" aria-label={s(["Skip Forward 15 Seconds", "快进 15 秒", "快轉 15 秒"])} title={s(["Skip Forward 15 Seconds", "快进 15 秒", "快轉 15 秒"])} onClick={() => skip(15)}>
                                <SFSymbol name="goforward.15" className="size-5" />
                            </button>
                        </div>
                        <div className="flex flex-1 items-center justify-end gap-3">
                            <span className="relative">
                                <button type="button" aria-label={s(["Playback Speed", "播放速度", "播放速度"])} title={s(["Playback Speed", "播放速度", "播放速度"])} className="rounded-md px-1.5 text-[12px] font-semibold tabular-nums hover:bg-white/15" onClick={() => setMenu(menu === "speed" ? null : "speed")}>
                                    {speed}×
                                </button>
                                <Popover open={menu === "speed"} onClose={closeMenu} className="top-auto bottom-8 w-28 border-white/15 bg-[#2a2a2a]/95 text-white">
                                    {SPEEDS.map((x) => (
                                        <MenuItem key={x} checked={x === speed} onClick={() => { setSpeed(x); setMenu(null); }}>{x === 1 ? s(["Normal", "正常", "正常"]) : `${x}×`}</MenuItem>
                                    ))}
                                </Popover>
                            </span>
                            <span className="relative">
                                <button type="button" aria-label={s(["Subtitles", "字幕", "字幕"])} title={s(["Subtitles", "字幕", "字幕"])} className={cn("rounded-md p-0.5 hover:bg-white/15", language === "off" && "opacity-60")} onClick={() => setMenu(menu === "subtitles" ? null : "subtitles")}>
                                    <SFSymbol name="captions.bubble" className="size-5" />
                                </button>
                                <Popover open={menu === "subtitles"} onClose={closeMenu} className="top-auto bottom-8 w-36 border-white/15 bg-[#2a2a2a]/95 text-white">
                                    <p className="px-2 pt-1 pb-1 text-[11px] font-semibold text-white/60">{s(["Subtitles", "字幕", "字幕"])}</p>
                                    {LANGUAGES.map((l) => (
                                        <MenuItem key={l.id} checked={l.id === language} onClick={() => { setLanguage(l.id); setMenu(null); }}>{s(l.label)}</MenuItem>
                                    ))}
                                </Popover>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MenuItem({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: string }) {
    return (
        <button type="button" className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left hover:bg-white/12" onClick={onClick}>
            <span className="w-3">{checked && <SFSymbol name="checkmark" className="size-3" />}</span>
            {children}
        </button>
    );
}
