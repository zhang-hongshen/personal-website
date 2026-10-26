import { useEffect, useRef } from "react";

import { MAC, Unavailable } from "~/components/mac-ui";
import { GLASS } from "~/components/mac-window";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { Artwork } from "./artwork";
import { ALBUMS, TRACKS, duration, type Album, type Track } from "./library";
import { ACCENT } from "./video";

// Arthub's Music: songs, albums and artists, the floating now-playing bar and the lyrics, which follow
// the song line by line the way an .lrc file next to it would time them.

export type MusicMode = "songs" | "albums" | "artists";

export type NowPlaying = {
    track: Track | null;
    playing: boolean;
    position: number;
    shuffle: boolean;
    repeat: "off" | "all" | "one";
    volume: number;
};

export type MusicControls = {
    play: (track: Track, queue?: Track[]) => void;
    toggle: () => void;
    next: () => void;
    previous: () => void;
    seek: (seconds: number) => void;
    setShuffle: (on: boolean) => void;
    cycleRepeat: () => void;
    setVolume: (v: number) => void;
};

function matches(t: Track, q: string) {
    return [t.title, t.album.title, t.album.artist].some((s) => s.toLowerCase().includes(q));
}

export function MusicLibrary({ mode, search, now, controls, onAlbum }: {
    mode: MusicMode;
    search: string;
    now: NowPlaying;
    controls: MusicControls;
    onAlbum: (id: string) => void;
}) {
    const q = search.trim().toLowerCase();
    const tracks = TRACKS.filter((t) => !q || matches(t, q));
    const albums = ALBUMS.filter((a) => !q || a.songs.some((s) => matches({ ...s, album: a }, q)));
    if (!tracks.length) return <Unavailable icon="magnifyingglass" title={`No Results for “${search}”`}>Check the spelling or try a new search.</Unavailable>;

    if (mode === "songs") return <SongTable tracks={tracks} now={now} onPlay={(t) => controls.play(t, tracks)} showAlbum />;
    if (mode === "albums") return <AlbumGrid albums={albums} onAlbum={onAlbum} />;
    const artists = [...new Set(albums.map((a) => a.artist))];
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-24">
            {artists.map((artist) => {
                const own = albums.filter((a) => a.artist === artist);
                return (
                    <button key={artist} type="button" className={cn("flex items-center gap-3 rounded-lg p-2 text-left", MAC.hover)} onClick={() => onAlbum(own[0].id)}>
                        <Artwork art={own[0].art} className="size-12 shrink-0 rounded-full" />
                        <span className="flex flex-col leading-tight">
                            <span className="font-semibold">{artist}</span>
                            <span className={cn("text-[12px]", MAC.muted)}>{own.length} {own.length === 1 ? "album" : "albums"}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function AlbumGrid({ albums, onAlbum }: { albums: Album[]; onAlbum: (id: string) => void }) {
    return (
        <div className="grid min-h-0 grid-cols-[repeat(auto-fill,minmax(140px,1fr))] content-start gap-5 overflow-y-auto px-5 pt-1 pb-24">
            {albums.map((a) => (
                <button key={a.id} type="button" className="text-left" onClick={() => onAlbum(a.id)}>
                    <Artwork art={a.art} className="aspect-square rounded-lg shadow-[0_2px_8px_rgb(0_0_0/0.18)]" />
                    <p className="mt-1.5 truncate text-[13px] font-semibold">{a.title}</p>
                    <p className={cn("truncate text-[12px]", MAC.muted)}>{a.artist}</p>
                </button>
            ))}
        </div>
    );
}

function SongTable({ tracks, now, onPlay, showAlbum }: { tracks: Track[]; now: NowPlaying; onPlay: (t: Track) => void; showAlbum?: boolean }) {
    return (
        <div className="min-h-0 flex-1 overflow-y-auto pb-24">
            <table className="w-full table-fixed border-collapse text-left">
                <thead className={cn("sticky top-0 z-10 text-[11px]", MAC.window, MAC.muted)}>
                    <tr className={cn("border-b", MAC.line)}>
                        <th className="w-10 py-1.5 pl-4 font-normal">#</th>
                        <th className="py-1.5 font-normal">Title</th>
                        {showAlbum && <th className="hidden py-1.5 font-normal sm:table-cell">Artist</th>}
                        {showAlbum && <th className="hidden py-1.5 font-normal md:table-cell">Album</th>}
                        <th className="w-14 py-1.5 pr-4 text-right font-normal">Time</th>
                    </tr>
                </thead>
                <tbody>
                    {tracks.map((t, i) => {
                        const current = now.track?.id === t.id;
                        return (
                            <tr key={t.id} className={cn("group h-8 cursor-default", MAC.stripe, current && ACCENT.text)} onDoubleClick={() => onPlay(t)}>
                                <td className="pl-4">
                                    <button type="button" aria-label={`Play ${t.title}`} className="flex w-5 items-center justify-center" onClick={() => onPlay(t)}>
                                        {current && now.playing ? (
                                            <SFSymbol name="speaker.wave.2.fill" className="size-3.5" />
                                        ) : (
                                            <>
                                                <span className={cn("tabular-nums group-hover:hidden", !current && MAC.muted)}>{i + 1}</span>
                                                <SFSymbol name="play.fill" className="hidden size-3 group-hover:block" />
                                            </>
                                        )}
                                    </button>
                                </td>
                                <td className="truncate pr-3 font-medium">{t.title}</td>
                                {showAlbum && <td className={cn("hidden truncate pr-3 sm:table-cell", !current && MAC.muted)}>{t.album.artist}</td>}
                                {showAlbum && <td className={cn("hidden truncate pr-3 md:table-cell", !current && MAC.muted)}>{t.album.title}</td>}
                                <td className={cn("pr-4 text-right tabular-nums", !current && MAC.muted)}>{duration(t.seconds)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export function AlbumDetail({ album, now, controls }: { album: Album; now: NowPlaying; controls: MusicControls }) {
    const tracks = TRACKS.filter((t) => t.album.id === album.id);
    const total = tracks.reduce((s, t) => s + t.seconds, 0);
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-24">
            <div className="flex flex-col gap-4 px-5 pt-1 pb-4 sm:flex-row sm:items-end">
                <Artwork art={album.art} className="aspect-square w-40 shrink-0 rounded-lg shadow-[0_6px_20px_rgb(0_0_0/0.25)]" />
                <div className="flex flex-col gap-1">
                    <h3 className="text-[24px] leading-tight font-bold">{album.title}</h3>
                    <p className={cn("text-[17px]", ACCENT.text)}>{album.artist}</p>
                    <p className={cn("text-[12px]", MAC.muted)}>{album.year} · {tracks.length} songs, {Math.round(total / 60)} minutes · FLAC</p>
                    <div className="mt-2 flex gap-2">
                        <button type="button" className={cn("flex h-8 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold", ACCENT.bg)} onClick={() => controls.play(tracks[0], tracks)}>
                            <SFSymbol name="play.fill" className="size-3" />Play
                        </button>
                        <button
                            type="button"
                            className={cn("flex h-8 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold", MAC.field, ACCENT.text)}
                            onClick={() => { controls.setShuffle(true); controls.play(tracks[Math.floor(Math.random() * tracks.length)], tracks); }}
                        >
                            <SFSymbol name="shuffle" className="size-3.5" />Shuffle
                        </button>
                    </div>
                </div>
            </div>
            <SongTable tracks={tracks} now={now} onPlay={(t) => controls.play(t, tracks)} />
        </div>
    );
}

/** The floating now-playing bar, like Apple Music's. */
export function MiniPlayer({ now, controls, lyrics, onLyrics }: { now: NowPlaying; controls: MusicControls; lyrics: boolean; onLyrics: () => void }) {
    const t = now.track;
    const icon = "flex items-center justify-center disabled:opacity-35";
    return (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex justify-center">
            <div className={cn("pointer-events-auto flex w-full max-w-[720px] items-center gap-3 rounded-full py-1.5 pr-3 pl-4 sm:gap-4", GLASS)}>
                <div className="flex shrink-0 items-center gap-3">
                    <button type="button" aria-label="Shuffle" title="Shuffle" className={cn(icon, "max-sm:hidden", now.shuffle ? ACCENT.text : "opacity-60")} onClick={() => controls.setShuffle(!now.shuffle)}>
                        <SFSymbol name="shuffle" className="size-3.5" />
                    </button>
                    <button type="button" aria-label="Previous" disabled={!t} className={icon} onClick={controls.previous}><SFSymbol name="backward.fill" className="h-3 w-5" /></button>
                    <button type="button" aria-label={now.playing ? "Pause" : "Play"} className={cn(icon, "w-6")} onClick={controls.toggle}>
                        <SFSymbol name={now.playing ? "pause.fill" : "play.fill"} className="size-5" />
                    </button>
                    <button type="button" aria-label="Next" disabled={!t} className={icon} onClick={controls.next}><SFSymbol name="forward.fill" className="h-3 w-5" /></button>
                    <button type="button" aria-label="Repeat" title={`Repeat: ${now.repeat}`} className={cn(icon, "relative max-sm:hidden", now.repeat === "off" ? "opacity-60" : ACCENT.text)} onClick={controls.cycleRepeat}>
                        <SFSymbol name="repeat" className="size-3.5" />
                        {now.repeat === "one" && <span className="absolute -top-1 -right-1.5 text-[8px] font-bold">1</span>}
                    </button>
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {t ? <Artwork art={t.album.art} className="size-9 shrink-0 rounded-md" /> : <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-black/8 dark:bg-white/10"><SFSymbol name="music.note" className="size-4 opacity-50" /></span>}
                    <div className="flex min-w-0 flex-1 flex-col">
                        <p className="truncate text-[12px] leading-tight font-semibold">{t?.title ?? "Not Playing"}</p>
                        <p className={cn("truncate text-[11px] leading-tight", MAC.muted)}>{t ? `${t.album.artist} — ${t.album.title}` : "Choose a song to play"}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] tabular-nums">
                            <span className={cn("max-sm:hidden", MAC.muted)}>{duration(now.position)}</span>
                            <input
                                type="range"
                                aria-label="Playback Position"
                                disabled={!t}
                                min={0}
                                max={t?.seconds ?? 1}
                                value={now.position}
                                className="h-1 min-w-0 flex-1 cursor-pointer accent-[#c2462a] dark:accent-[#f26d45]"
                                onChange={(e) => controls.seek(Number(e.target.value))}
                            />
                            <span className={cn("max-sm:hidden", MAC.muted)}>-{duration((t?.seconds ?? 0) - now.position)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <button type="button" aria-label="Lyrics" title="Lyrics" aria-pressed={lyrics} className={cn(icon, lyrics ? ACCENT.text : "opacity-70")} onClick={onLyrics}>
                        <SFSymbol name="quote.bubble" className="size-4" />
                    </button>
                    <label className="flex items-center gap-1.5 max-md:hidden">
                        <SFSymbol name="speaker.wave.2.fill" className="size-3.5 opacity-60" />
                        <input type="range" aria-label="Volume" min={0} max={1} step={0.01} value={now.volume} className="h-1 w-16 accent-current" onChange={(e) => controls.setVolume(Number(e.target.value))} />
                    </label>
                </div>
            </div>
        </div>
    );
}

/** The lyrics of the song playing; the current line is lit and a click on a line jumps to it. */
export function LyricsPanel({ now, controls }: { now: NowPlaying; controls: MusicControls }) {
    const list = useRef<HTMLDivElement>(null);
    const lines = now.track?.lyrics ?? [];
    // The song repeats its lyrics after the last line, a verse at a time.
    const span = lines.length ? lines[lines.length - 1][0] + 8 : 1;
    const local = now.position % span;
    const loop = Math.floor(now.position / span);
    let current = -1;
    lines.forEach(([at], i) => { if (local >= at) current = i; });

    // Scroll only the list, never the page around the demo.
    useEffect(() => {
        const box = list.current;
        const el = box?.querySelector<HTMLElement>(`[data-line="${current}"]`);
        if (box && el) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: "smooth" });
    }, [current]);

    if (!now.track) return <Unavailable icon="quote.bubble" title="No Lyrics">Play a song to see its lyrics here.</Unavailable>;
    return (
        <div ref={list} className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pt-10 pb-40">
            {lines.map(([at, text], i) => (
                <button
                    key={i}
                    type="button"
                    data-line={i}
                    className={cn("text-left text-[20px] leading-snug font-bold transition-[opacity,transform] duration-300", i === current ? "opacity-100" : "opacity-30 hover:opacity-60")}
                    onClick={() => controls.seek(loop * span + at)}
                >
                    {text}
                </button>
            ))}
        </div>
    );
}
