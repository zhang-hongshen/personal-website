import { useCallback, useEffect, useRef, useState } from "react";

import { useText, type L } from "~/components/demo-text";
import { Inspector, MAC, MacSidebar, MacWindow, SearchField, Segmented, ShowSidebarButton, SidebarHeader, SidebarRow, Spinner, TitleBar, ToolButton, Unavailable, useSidebar } from "~/components/mac-ui";
import { CAPSULE } from "~/components/mac-window";
import { SFSymbol, type SymbolName } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { ALBUMS, GENRES, MOVIES, SHOWS, TRACKS, libraryFiles, type Episode, type Genre, type Track } from "./library";
import { AlbumDetail, LyricsPanel, MiniPlayer, MusicLibrary, type MusicControls, type MusicMode, type NowPlaying } from "./music";
import { VideoPlayer } from "./player";
import { SongPlayer } from "./synth";
import { ACCENT, GenreList, MovieDetail, MoviesHome, ShowDetail, ShowsGrid, type Progress } from "./video";

// An Arthub window that works like the app: Movies, TV Shows and Music made from a library folder,
// a detail page for every title, a player with subtitles and speeds, and music (synthesized in the
// page) with the now-playing bar and timed lyrics. What you watch is remembered until a reload.

type Tab = "movies" | "shows" | "music" | "media" | "backup";
type Route = { kind: "movie"; id: string } | { kind: "genre"; genre: Genre } | { kind: "show"; id: string } | { kind: "album"; id: string };
type Playing = { title: string; subtitle?: string; key: string; art: (typeof MOVIES)[number]["art"]; seconds: number; subtitles: (typeof MOVIES)[number]["subtitles"] };

const TABS: { id: Tab; label: L; icon: SymbolName }[] = [
    { id: "movies", label: ["Movies", "电影", "電影"], icon: "film" },
    { id: "shows", label: ["TV Shows", "电视剧", "電視節目"], icon: "tv" },
    { id: "music", label: ["Music", "音乐", "音樂"], icon: "music.note" },
];
const MEDIA: L = ["Media", "媒体", "媒體"];
const BACKUP: L = ["Backup Drive", "备份硬盘", "備份磁碟"];
const LYRICS: L = ["Lyrics", "歌词", "歌詞"];

const SELECTED = "!bg-[#c2462a] dark:!bg-[#f26d45]";

export function ArthubDemo({ className }: { className?: string }) {
    const s = useText();
    const sidebar = useSidebar();
    const [tab, setTab] = useState<Tab>("movies");
    const [stacks, setStacks] = useState<Record<Tab, Route[]>>({ movies: [], shows: [], music: [], media: [], backup: [] });
    const [search, setSearch] = useState("");
    const [progress, setProgress] = useState<Progress>(() => Object.fromEntries(MOVIES.filter((m) => m.progress).map((m) => [m.id, m.progress])));
    const [video, setVideo] = useState<(Playing & { start: number }) | null>(null);
    const [mode, setMode] = useState<MusicMode>("albums");
    const [lyrics, setLyrics] = useState(false);
    const [scanning, setScanning] = useState(false);

    const stack = stacks[tab];
    const route = stack[stack.length - 1];
    const push = (r: Route) => setStacks((s) => ({ ...s, [tab]: [...s[tab], r] }));
    const back = () => setStacks((s) => ({ ...s, [tab]: s[tab].slice(0, -1) }));
    const open = (t: Tab) => {
        setTab(t);
        setSearch("");
        sidebar.done();
    };

    // ---- Music
    const engine = useRef<SongPlayer | null>(null);
    const [now, setNow] = useState<NowPlaying>({ track: null, playing: false, position: 0, shuffle: false, repeat: "off", volume: 0.7 });
    const queue = useRef<Track[]>(TRACKS);
    const nowRef = useRef(now);
    nowRef.current = now;
    const getEngine = () => (engine.current ??= new SongPlayer());

    const playTrack = useCallback((track: Track, from = 0) => {
        getEngine().play(track, from);
        setNow((n) => ({ ...n, track, playing: true, position: from }));
    }, []);
    const step = useCallback((by: 1 | -1, ended = false) => {
        const { track, shuffle, repeat } = nowRef.current;
        if (!track) return;
        const list = queue.current;
        if (ended && repeat === "one") return playTrack(track);
        if (shuffle && list.length > 1) {
            const others = list.filter((t) => t.id !== track.id);
            return playTrack(others[Math.floor(Math.random() * others.length)]);
        }
        let i = list.findIndex((t) => t.id === track.id) + by;
        if (i >= list.length) {
            if (ended && repeat === "off") {
                getEngine().stop();
                return setNow((n) => ({ ...n, playing: false, position: 0 }));
            }
            i = 0;
        }
        playTrack(list[(i + list.length) % list.length]);
    }, [playTrack]);

    const controls: MusicControls = {
        play: (track, list) => {
            if (list) queue.current = list;
            playTrack(track);
        },
        toggle: () => {
            const { track, playing, position } = nowRef.current;
            if (!track) return playTrack(queue.current[0]);
            if (playing) {
                getEngine().pause();
                setNow((n) => ({ ...n, playing: false }));
            } else playTrack(track, position);
        },
        next: () => step(1),
        // Like a CD player: back to the start first, then the previous song.
        previous: () => (nowRef.current.position > 3 && nowRef.current.track ? playTrack(nowRef.current.track) : step(-1)),
        seek: (s) => {
            const { track, playing } = nowRef.current;
            if (!track) return;
            if (playing) playTrack(track, s);
            else setNow((n) => ({ ...n, position: s }));
        },
        setShuffle: (shuffle) => setNow((n) => ({ ...n, shuffle })),
        cycleRepeat: () => setNow((n) => ({ ...n, repeat: n.repeat === "off" ? "all" : n.repeat === "all" ? "one" : "off" })),
        setVolume: (volume) => {
            getEngine().setVolume(volume);
            setNow((n) => ({ ...n, volume }));
        },
    };

    useEffect(() => {
        const e = getEngine();
        e.onEnded = () => step(1, true);
    }, [step]);
    useEffect(() => {
        if (!now.playing) return;
        const timer = setInterval(() => setNow((n) => ({ ...n, position: engine.current?.position ?? n.position })), 200);
        return () => clearInterval(timer);
    }, [now.playing]);
    useEffect(() => () => engine.current?.close(), []);

    // ---- Video
    const playMovie = (id: string) => {
        const m = MOVIES.find((x) => x.id === id)!;
        const seconds = m.minutes * 60;
        const at = progress[id] ?? 0;
        startVideo({ key: id, title: s(m.title), subtitle: `${m.year} · ${m.tags.join(" · ")}`, art: m.art, seconds, subtitles: m.subtitles }, at >= seconds - 5 ? 0 : at);
    };
    const playEpisode = (showId: string, e: Episode) => {
        const show = SHOWS.find((x) => x.id === showId)!;
        const at = progress[e.id] ?? e.progress;
        startVideo({ key: e.id, title: s(e.title), subtitle: `${s(show.title)} · ${e.file.replace(".mkv", "")}`, art: show.art, seconds: e.minutes * 60, subtitles: show.subtitles }, at >= e.minutes * 60 - 5 ? 0 : at);
    };
    const startVideo = (p: Playing, start: number) => {
        if (nowRef.current.playing) controls.toggle();
        setVideo({ ...p, start });
    };

    const scan = () => {
        setScanning(true);
        setTimeout(() => setScanning(false), 1200);
    };

    // ---- Title bar
    const show = route?.kind === "show" ? SHOWS.find((x) => x.id === route.id)! : null;
    const title = route
        ? route.kind === "movie" ? s(MOVIES.find((m) => m.id === route.id)!.title)
            : route.kind === "genre" ? s(GENRES[route.genre])
                : route.kind === "show" ? s(show!.title)
                    : ALBUMS.find((a) => a.id === route.id)!.title
        : s(tab === "media" ? MEDIA : tab === "backup" ? BACKUP : TABS.find((t) => t.id === tab)!.label);
    const files = libraryFiles(s).length;
    const subtitle = !route && tab === "media" ? s([`${files} files · ~/Media`, `${files} 个文件 · ~/Media`, `${files} 個檔案 · ~/Media`]) : undefined;
    const searchable = !route && (tab === "movies" || tab === "shows" || tab === "music");
    const musicModes = [{ value: "songs" as const, label: s(["Songs", "歌曲", "歌曲"]) }, { value: "albums" as const, label: s(["Albums", "专辑", "專輯"]) }, { value: "artists" as const, label: s(["Artists", "艺人", "藝人"]) }];
    const backButton = route && (
        <button type="button" aria-label={s(["Back", "返回", "返回"])} title={s(["Back", "返回", "返回"])} className={cn(CAPSULE, "w-8 justify-center")} onClick={back}>
            <SFSymbol name="chevron.left" className="size-3.5" />
        </button>
    );

    return (
        <MacWindow className={className}>
            <MacSidebar sidebar={sidebar}>
                <p className="px-5 pt-1 pb-1 text-[26px] font-semibold">Arthub</p>
                <nav className="flex flex-col gap-0.5 overflow-y-auto pb-3">
                    <SidebarHeader>{s(["Home", "主页", "首頁"])}</SidebarHeader>
                    {TABS.map((t) => (
                        <SidebarRow key={t.id} icon={t.icon} iconClass={ACCENT.text} label={s(t.label)} selected={tab === t.id} className={tab === t.id ? SELECTED : undefined} onClick={() => open(t.id)} />
                    ))}
                    <SidebarHeader>{s(["Library", "资料库", "資料庫"])}</SidebarHeader>
                    <SidebarRow icon="folder" iconClass={ACCENT.text} label={s(MEDIA)} selected={tab === "media"} className={tab === "media" ? SELECTED : undefined} onClick={() => open("media")} />
                    <SidebarRow icon="externaldrive.badge.exclamationmark" iconClass={MAC.muted} label={s(BACKUP)} detail={s(["Offline", "离线", "離線"])} selected={tab === "backup"} className={tab === "backup" ? SELECTED : undefined} onClick={() => open("backup")} />
                </nav>
            </MacSidebar>

            <section className="relative flex min-w-0 flex-1 flex-col">
                <TitleBar leading={<><ShowSidebarButton sidebar={sidebar} />{backButton}</>} title={title} subtitle={subtitle}>
                    {!route && tab === "music" && (
                        <Segmented
                            options={musicModes}
                            value={mode}
                            onChange={setMode}
                            className="max-lg:hidden"
                        />
                    )}
                    {searchable && <SearchField value={search} placeholder={s(["Search", "搜索", "搜尋"])} onChange={setSearch} className="w-36 max-sm:hidden lg:w-44" />}
                    {(tab === "movies" || tab === "shows" || tab === "media") && (
                        scanning ? <span className={cn(CAPSULE, "w-8 justify-center")}><Spinner className="size-4" label={s(["Refreshing", "正在刷新", "正在重新整理"])} /></span> : <ToolButton icon="arrow.clockwise" label={s(["Refresh", "刷新", "重新整理"])} onClick={scan} />
                    )}
                    {tab === "music" && <ToolButton icon="sidebar.right" label={s(LYRICS)} active={lyrics} onClick={() => setLyrics((l) => !l)} />}
                </TitleBar>

                {!route && tab === "music" && (
                    <div className="px-5 pb-2 lg:hidden">
                        <Segmented options={musicModes} value={mode} onChange={setMode} className="w-full" />
                    </div>
                )}

                {tab === "movies" && !route && <MoviesHome search={search} progress={progress} onOpen={(id) => push({ kind: "movie", id })} onPlay={playMovie} onGenre={(genre) => push({ kind: "genre", genre })} />}
                {tab === "movies" && route?.kind === "genre" && <GenreList genre={route.genre} progress={progress} onOpen={(id) => push({ kind: "movie", id })} onPlay={playMovie} />}
                {tab === "movies" && route?.kind === "movie" && <MovieDetail movie={MOVIES.find((m) => m.id === route.id)!} progress={progress[route.id] ?? 0} onPlay={() => playMovie(route.id)} />}
                {tab === "shows" && !route && <ShowsGrid search={search} onOpen={(id) => push({ kind: "show", id })} />}
                {tab === "shows" && show && <ShowDetail key={show.id} show={show} progress={progress} onPlay={(e) => playEpisode(show.id, e)} />}
                {tab === "music" && !route && <MusicLibrary mode={mode} search={search} now={now} controls={controls} onAlbum={(id) => push({ kind: "album", id })} />}
                {tab === "music" && route?.kind === "album" && <AlbumDetail album={ALBUMS.find((a) => a.id === route.id)!} now={now} controls={controls} />}
                {tab === "media" && <FileList />}
                {tab === "backup" && (
                    <Unavailable icon="externaldrive.badge.exclamationmark" title={s(["Backup Drive Is Offline", "备份硬盘已离线", "備份磁碟已離線"])}>
                        {s([
                            "Its movies and songs stay in your library and play again as soon as the drive is connected.",
                            "上面的电影和歌曲仍保留在资料库中，硬盘一接上就能继续播放。",
                            "上面的電影和歌曲仍保留在資料庫中，磁碟一接上就能繼續播放。",
                        ])}
                    </Unavailable>
                )}
                {tab === "music" && <MiniPlayer now={now} controls={controls} lyrics={lyrics} onLyrics={() => setLyrics((l) => !l)} />}
            </section>

            {tab === "music" && (
                <Inspector open={lyrics} width={300}>
                    <TitleBar title={s(LYRICS)} subtitle={now.track ? `${now.track.title} — ${now.track.album.artist}` : undefined}>
                        <ToolButton icon="xmark" label={s(["Close", "关闭", "關閉"])} onClick={() => setLyrics(false)} />
                    </TitleBar>
                    <LyricsPanel now={now} controls={controls} />
                </Inspector>
            )}

            {video && (
                <VideoPlayer
                    title={video.title}
                    subtitle={video.subtitle}
                    art={video.art}
                    seconds={video.seconds}
                    start={video.start}
                    subtitles={video.subtitles}
                    onClose={(position) => {
                        setProgress((p) => ({ ...p, [video.key]: position >= video.seconds - 5 ? video.seconds : Math.floor(position) }));
                        setVideo(null);
                    }}
                />
            )}
        </MacWindow>
    );
}

/** The library folder's files and what Arthub recognized each one as. */
function FileList() {
    const s = useText();
    const files = libraryFiles(s);
    const icon: Record<string, SymbolName> = { Movie: "film", Episode: "tv", Song: "music.note" };
    return (
        <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[560px] table-fixed border-collapse text-left text-[12px]">
                <thead className={cn("sticky top-0 z-10 text-[11px]", MAC.window, MAC.muted)}>
                    <tr className={cn("border-b", MAC.line)}>
                        <th className="w-[46%] py-1.5 pl-4 font-normal">{s(["File", "文件", "檔案"])}</th>
                        <th className="py-1.5 font-normal">{s(["Recognized As", "识别为", "辨識為"])}</th>
                        <th className="w-28 py-1.5 pr-4 font-normal">{s(["Tags", "标签", "標籤"])}</th>
                    </tr>
                </thead>
                <tbody>
                    {files.map((f) => (
                        <tr key={f.path} className={cn("h-8", MAC.stripe)}>
                            <td className="truncate pr-3 pl-4 font-mono text-[11px]" title={f.path}>{f.path}</td>
                            <td className="truncate pr-3">
                                <span className="flex items-center gap-1.5">
                                    <SFSymbol name={icon[f.kind]} className={cn("size-3.5 shrink-0", ACCENT.text)} />
                                    <span className="truncate">{f.match}</span>
                                </span>
                            </td>
                            <td className={cn("truncate pr-4", MAC.muted)}>{f.tags.join(" · ")}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
