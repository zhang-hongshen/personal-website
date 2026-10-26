import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useText, type L } from "~/components/demo-text";
import { MAC, MacWindow, Popover, Spinner, ToolButton, TrafficLights } from "~/components/mac-ui";
import { CAPSULE, TOOL, TOOL_ITEM } from "~/components/mac-window";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { Editor } from "./editor";
import {
    RECORDINGS, SAMPLE_RATE, STYLES, clock, correctedFrames, hasCorrection, makeTake, noteTargets, renderVoice, wav,
    type Edits, type Style,
} from "./take";

// A TuneStudio window that works like the app: a sung take with its notes and pitch curve, one-click
// Auto Tune in three styles, notes dragged by hand, undo and redo, and playback of the tuned voice,
// which is synthesized in the page from the curve on screen.

const NONE: Edits = { style: null, manual: {} };

export function TuneStudioDemo({ className }: { className?: string }) {
    const s = useText();
    const [recordingId, setRecordingId] = useState(RECORDINGS[0].id);
    const take = useMemo(() => makeTake(RECORDINGS.find((r) => r.id === recordingId)!), [recordingId]);
    const [history, setHistory] = useState<{ past: Edits[]; present: Edits; future: Edits[] }>({ past: [], present: NONE, future: [] });
    const edits = history.present;
    // A note being dragged, shown before it lands in the history.
    const [preview, setPreview] = useState<Edits | null>(null);
    const [lastStyle, setLastStyle] = useState<Style>("balanced");
    const [selected, setSelected] = useState<number | null>(null);
    const [pps, setPps] = useState(110);
    const [time, setTime] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [busy, setBusy] = useState<L | null>(null);
    const [menu, setMenu] = useState<"open" | "style" | "export" | null>(null);
    const closeMenu = useCallback(() => setMenu(null), []);

    const shown = preview ?? edits;
    const targets = useMemo(() => noteTargets(take, shown), [take, shown]);
    const frames = useMemo(() => correctedFrames(take, targets), [take, targets]);

    const apply = (next: Edits) => {
        setHistory((h) => ({ past: [...h.past, h.present], present: next, future: [] }));
        setPreview(null);
    };
    const undo = () => setHistory((h) => (h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h));
    const redo = () => setHistory((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h));

    const autoTune = (style: Style) => {
        setLastStyle(style);
        apply({ ...edits, style });
        setMenu(null);
    };
    const toggleAutoTune = () => (edits.style ? apply({ ...edits, style: null }) : autoTune(lastStyle));
    const moveNote = (id: number, midi: number, commit: boolean) => {
        const next = { ...edits, manual: { ...edits.manual, [id]: midi } };
        if (commit) apply(next);
        else setPreview(next);
    };
    const resetNote = (id: number) => {
        if (edits.manual[id] === undefined) return;
        const manual = { ...edits.manual };
        delete manual[id];
        apply({ ...edits, manual });
    };

    // ---- Audio: the tuned voice is rendered again after each change, then played from the playhead.
    const audio = useRef<{ ctx: AudioContext; source: AudioBufferSourceNode | null; startedAt: number } | null>(null);
    const samples = useRef<Float32Array | null>(null);
    const timeRef = useRef(0);
    timeRef.current = time;

    const stop = useCallback(() => {
        const a = audio.current;
        if (a?.source) {
            a.source.onended = null;
            a.source.stop();
            a.source = null;
        }
        setPlaying(false);
    }, []);

    const start = useCallback((from: number) => {
        const data = samples.current;
        if (!data) return;
        if (!audio.current) audio.current = { ctx: new AudioContext(), source: null, startedAt: 0 };
        const a = audio.current;
        void a.ctx.resume();
        if (a.source) {
            a.source.onended = null;
            a.source.stop();
        }
        const buffer = a.ctx.createBuffer(1, data.length, SAMPLE_RATE);
        buffer.copyToChannel(data as Float32Array<ArrayBuffer>, 0);
        const source = a.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(a.ctx.destination);
        const offset = from >= take.duration - 0.05 ? 0 : from;
        source.start(0, offset);
        source.onended = () => { a.source = null; setPlaying(false); setTime(0); };
        a.source = source;
        a.startedAt = a.ctx.currentTime - offset;
        setTime(offset);
        setPlaying(true);
    }, [take.duration]);

    useEffect(() => {
        // The take as opened needs no wait; changes show the app updating its tuned audio.
        if (!samples.current) {
            samples.current = renderVoice(take, correctedFrames(take, noteTargets(take, edits)));
            return;
        }
        setBusy(["Updating tuned audio…", "正在更新修音后的音频…", "正在更新修音後的音訊…"]);
        const timer = setTimeout(() => {
            samples.current = renderVoice(take, correctedFrames(take, noteTargets(take, edits)));
            setBusy(null);
            if (audio.current?.source) start(timeRef.current);
        }, 250);
        return () => clearTimeout(timer);
    }, [take, edits, start]);

    useEffect(() => {
        if (!playing) return;
        let id = 0;
        const tick = () => {
            const a = audio.current;
            if (a) setTime(Math.min(a.ctx.currentTime - a.startedAt, take.duration));
            id = requestAnimationFrame(tick);
        };
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, [playing, take.duration]);

    useEffect(() => () => { audio.current?.source?.stop(); void audio.current?.ctx.close(); }, []);

    const togglePlay = () => (playing ? stop() : start(time));
    const seek = (t: number) => {
        const clamped = Math.min(Math.max(t, 0), take.duration);
        setTime(clamped);
        if (playing) start(clamped);
    };

    const open = (id: string) => {
        setMenu(null);
        if (id === recordingId) return;
        stop();
        setBusy(["Finding the melody…", "正在识别旋律…", "正在辨識旋律…"]);
        setTimeout(() => {
            setRecordingId(id);
            setHistory({ past: [], present: NONE, future: [] });
            setSelected(null);
            setTime(0);
        }, 500);
    };

    const exportAudio = (tuned: boolean) => {
        setMenu(null);
        const data = tuned ? samples.current : renderVoice(take, take.frames);
        if (!data) return;
        const url = URL.createObjectURL(wav(data));
        const a = document.createElement("a");
        a.href = url;
        a.download = `${s(take.recording.name).replace(/\.\w+$/, "")}${tuned ? s([" (Tuned)", "（已修音）", "（已修音）"]) : ""}.wav`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const tuned = hasCorrection(edits);
    const style = STYLES.find((st) => st.id === edits.style);
    const styleTitle = style && s(style.title);

    return (
        <MacWindow className={cn("flex-col", className)}>
            <div
                className="flex min-h-0 flex-1 flex-col"
                onKeyDown={(e) => {
                    if ((e.target as HTMLElement).closest("button, input, select, textarea")) return;
                    if (e.key === " ") { e.preventDefault(); togglePlay(); }
                    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
                }}
            >
                <header className="flex h-[52px] shrink-0 items-center gap-2 px-3">
                    <span className="px-1"><TrafficLights /></span>
                    <span className="relative">
                        <ToolButton icon="folder" label={s(["Open (⌘O)", "打开 (⌘O)", "開啟 (⌘O)"])} onClick={() => setMenu(menu === "open" ? null : "open")} />
                        <Popover open={menu === "open"} onClose={closeMenu} className="right-auto left-0 w-60">
                            <p className={cn("px-2 pt-1 pb-1.5 text-[11px] font-semibold", MAC.muted)}>{s(["Recordings", "录音", "錄音"])}</p>
                            {RECORDINGS.map((r) => (
                                <button key={r.id} type="button" className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left", MAC.hover)} onClick={() => open(r.id)}>
                                    <SFSymbol name="waveform" className={cn("size-4 shrink-0", MAC.accent)} />
                                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                                        <span className="truncate">{s(r.name)}</span>
                                        <span className={cn("text-[11px]", MAC.muted)}>{s(r.format)}</span>
                                    </span>
                                    {r.id === recordingId && <SFSymbol name="checkmark" className="size-3 shrink-0" />}
                                </button>
                            ))}
                        </Popover>
                    </span>
                    <h4 className="mr-auto hidden min-w-0 truncate pl-1 text-[15px] font-semibold md:block">{s(take.recording.name)}</h4>

                    <div className={cn(CAPSULE, "max-md:mr-auto")}>
                        <button
                            type="button"
                            aria-label={playing ? s(["Pause", "暂停", "暫停"]) : s(["Play", "播放", "播放"])}
                            title={playing ? s(["Pause (Space)", "暂停 (空格)", "暫停 (空白鍵)"]) : s(["Play (Space)", "播放 (空格)", "播放 (空白鍵)"])}
                            className={TOOL_ITEM}
                            onClick={togglePlay}
                        >
                            <SFSymbol name={playing ? "pause.fill" : "play.fill"} className="size-3.5" />
                        </button>
                        <span className="relative flex items-center">
                            <button
                                type="button"
                                aria-pressed={!!edits.style}
                                title={edits.style ? s(["Turn Auto Tune off", "关闭 Auto Tune", "關閉 Auto Tune"]) : s(["Tune the whole song in one click", "一键修整首歌", "一鍵修整首歌"])}
                                className={cn("flex h-7 items-center gap-1.5 rounded-full pr-1.5 pl-2.5 whitespace-nowrap hover:bg-black/6 dark:hover:bg-white/10", edits.style && MAC.accent)}
                                onClick={toggleAutoTune}
                            >
                                <SFSymbol name={edits.style ? "wand.and.stars.inverse" : "wand.and.stars"} className="size-4" />
                                <span className="text-[12px] font-medium">{edits.style ? s(["Auto Tune On", "Auto Tune 已开", "Auto Tune 已開"]) : "Auto Tune"}</span>
                            </button>
                            <button type="button" aria-label={s(["Auto Tune Style", "Auto Tune 风格", "Auto Tune 風格"])} className="flex h-7 w-5 items-center justify-center rounded-full hover:bg-black/6 dark:hover:bg-white/10" onClick={() => setMenu(menu === "style" ? null : "style")}>
                                <SFSymbol name="chevron.down" className="size-2.5" />
                            </button>
                            <Popover open={menu === "style"} onClose={closeMenu} className="w-64">
                                {STYLES.map((st) => (
                                    <button key={st.id} type="button" className={cn("flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left", MAC.hover)} onClick={() => autoTune(st.id)}>
                                        <span className="mt-0.5 w-3 shrink-0">{edits.style === st.id && <SFSymbol name="checkmark" className="size-3" />}</span>
                                        <span className="flex flex-col leading-tight">
                                            <span className="font-medium">{s(st.title)}</span>
                                            <span className={cn("text-[11px]", MAC.muted)}>{s(st.summary)}</span>
                                        </span>
                                    </button>
                                ))}
                            </Popover>
                        </span>
                    </div>

                    <span className="flex-1 max-md:hidden" />
                    <div className={cn(CAPSULE, "px-0.5 max-sm:hidden")}>
                        <ToolButton grouped icon="arrow.uturn.backward" label={s(["Undo (⌘Z)", "撤销 (⌘Z)", "還原 (⌘Z)"])} disabled={!history.past.length} onClick={undo} />
                        <ToolButton grouped icon="arrow.uturn.forward" label={s(["Redo (⇧⌘Z)", "重做 (⇧⌘Z)", "重做 (⇧⌘Z)"])} disabled={!history.future.length} onClick={redo} />
                    </div>
                    <div className={cn(CAPSULE, "px-0.5 max-sm:hidden")}>
                        <ToolButton grouped icon="minus.magnifyingglass" label={s(["Zoom Out", "缩小", "縮小"])} disabled={pps <= 50} onClick={() => setPps((p) => Math.max(p / 1.35, 50))} />
                        <ToolButton grouped icon="plus.magnifyingglass" label={s(["Zoom In", "放大", "放大"])} disabled={pps >= 400} onClick={() => setPps((p) => Math.min(p * 1.35, 400))} />
                    </div>
                    <span className="relative">
                        <button type="button" aria-label={s(["Export", "导出", "輸出"])} title={s(["Export the tuned audio (⇧⌘E)", "导出修音后的音频 (⇧⌘E)", "輸出修音後的音訊 (⇧⌘E)"])} className={TOOL} onClick={() => setMenu(menu === "export" ? null : "export")}>
                            <SFSymbol name="square.and.arrow.up" className="size-4" />
                        </button>
                        <Popover open={menu === "export"} onClose={closeMenu} className="w-56">
                            <button type="button" disabled={!tuned || !!busy} className={cn("flex w-full flex-col rounded-md px-2 py-1.5 text-left disabled:opacity-40", MAC.hover)} onClick={() => exportAudio(true)}>
                                <span>{s(["Export Tuned Audio…", "导出修音后的音频…", "輸出修音後的音訊…"])}</span>
                                <span className={cn("text-[11px]", MAC.muted)}>WAV · {clock(take.duration)}</span>
                            </button>
                            <button type="button" className={cn("flex w-full flex-col rounded-md px-2 py-1.5 text-left", MAC.hover)} onClick={() => exportAudio(false)}>
                                <span>{s(["Export Original…", "导出原始录音…", "輸出原始錄音…"])}</span>
                                <span className={cn("text-[11px]", MAC.muted)}>{s(["WAV, as sung", "WAV，原唱", "WAV，原唱"])}</span>
                            </button>
                        </Popover>
                    </span>
                </header>

                <div className="flex min-h-0 flex-1 flex-col bg-[#f5f5f7] p-3 dark:bg-[#161616]">
                    <Editor
                        take={take}
                        frames={frames}
                        targets={targets}
                        selected={selected}
                        pps={pps}
                        time={time}
                        playing={playing}
                        onSelect={setSelected}
                        onMove={moveNote}
                        onSeek={seek}
                        onReset={resetNote}
                        onTranspose={(id, by) => moveNote(id, Math.round(targets[id].center) + by, true)}
                    />
                </div>

                <footer className={cn("flex h-[34px] shrink-0 items-center gap-4 border-t px-4 text-[12px]", MAC.line, MAC.sidebar)}>
                    <span className="flex min-w-0 items-center gap-1.5">
                        <SFSymbol name="waveform" className={cn("size-3.5 shrink-0", MAC.muted)} />
                        <span className="truncate font-medium">{s(take.recording.name)}</span>
                        <span className={cn("truncate max-sm:hidden", MAC.muted)}>{s(take.recording.format)}</span>
                    </span>
                    <span className="flex-1" />
                    <span className="shrink-0 tabular-nums">
                        {clock(time)} <span className="opacity-40">/</span> <span className={MAC.muted}>{clock(take.duration)}</span>
                    </span>
                    <span className="flex-1" />
                    <span className="flex shrink-0 items-center gap-1.5" title={busy ? s(busy) : undefined}>
                        {busy ? (
                            <><Spinner className="size-3.5" /><span className={MAC.muted}>{s(busy)}</span></>
                        ) : tuned ? (
                            <><SFSymbol name="checkmark.circle.fill" className="size-3.5 text-[#28c840]" /><span className={MAC.muted}>{s(["Tuned audio ready", "修音完成", "修音完成"])}{styleTitle && !Object.keys(edits.manual).length ? ` · ${styleTitle}` : ""}</span></>
                        ) : (
                            <><SFSymbol name="circle" className={cn("size-3.5", MAC.muted)} /><span className={MAC.muted}>{s(["No changes yet", "尚未修改", "尚未修改"])}</span></>
                        )}
                    </span>
                </footer>
            </div>
        </MacWindow>
    );
}
