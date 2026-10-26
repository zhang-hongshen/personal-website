import { useState, type ReactNode } from "react";

import { useText, type L, type Text } from "~/components/demo-text";
import { MAC, Segmented, Unavailable } from "~/components/mac-ui";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { Artwork, Poster } from "./artwork";
import { GENRES, MOVIES, SHOWS, duration, runtime, type Episode, type Genre, type Movie, type Show } from "./library";

// Arthub's Movies and TV Shows: rows of posters, a detail page for each title, and the seasons and
// episodes of a show.

export const ACCENT = {
    text: "text-[#c2462a] dark:text-[#f26d45]",
    bg: "bg-[#c2462a] text-white dark:bg-[#f26d45]",
    bar: "bg-[#c2462a] dark:bg-[#f26d45]",
};

export type Progress = Record<string, number>;

/** What the app shows when a search finds nothing. */
export function NoResults({ search }: { search: string }) {
    const s = useText();
    return (
        <Unavailable icon="magnifyingglass" title={s([`No Results for “${search}”`, `没有找到“${search}”的结果`, `找不到「${search}」的結果`])}>
            {s(["Check the spelling or try a new search.", "请检查拼写或换个关键词。", "請檢查拼字或換個關鍵字。"])}
        </Unavailable>
    );
}

/** "2 Seasons", "1 Season". */
export function seasons(n: number, s: Text) {
    return s([`${n} ${n === 1 ? "Season" : "Seasons"}`, `${n} 季`, `${n} 季`]);
}

const matches = (title: L, q: string) => title.some((t) => t.toLowerCase().includes(q));

function SectionTitle({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
    return (
        <div className="mb-2.5 flex items-baseline justify-between px-5">
            <h5 className="text-[20px] font-bold">{children}</h5>
            {trailing}
        </div>
    );
}

/** A poster with its title and year; it shows a play button under the pointer and progress below. */
function MovieCard({ movie, progress, onOpen, onPlay }: { movie: Movie; progress: number; onOpen: () => void; onPlay: () => void }) {
    const s = useText();
    const title = s(movie.title);
    return (
        <div className="group w-[124px] shrink-0">
            <div className="relative">
                <button type="button" className="block w-full overflow-hidden rounded-lg shadow-[0_2px_8px_rgb(0_0_0/0.18)]" onClick={onOpen} aria-label={`${title} (${movie.year})`}>
                    <Poster art={movie.art} title={title} />
                    {progress > 0 && (
                        <span className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
                            <span className={cn("block h-full", ACCENT.bar)} style={{ width: `${Math.min(progress / (movie.minutes * 60), 1) * 100}%` }} />
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    aria-label={s([`Play ${title}`, `播放《${title}》`, `播放《${title}》`])}
                    className="absolute bottom-2.5 left-2 flex size-8 items-center justify-center rounded-full bg-white/85 text-black opacity-0 shadow backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={onPlay}
                >
                    <SFSymbol name="play.fill" className="ml-0.5 size-3" />
                </button>
            </div>
            <button type="button" className="mt-1.5 block w-full text-left" onClick={onOpen}>
                <p className="line-clamp-2 text-[13px] leading-tight font-semibold">{title}</p>
                <p className={cn("text-[12px]", MAC.muted)}>{movie.year}</p>
            </button>
        </div>
    );
}

function Row({ children }: { children: ReactNode }) {
    return <div className="flex gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:thin]">{children}</div>;
}

export function MoviesHome({ search, progress, onOpen, onPlay, onGenre }: {
    search: string;
    progress: Progress;
    onOpen: (id: string) => void;
    onPlay: (id: string) => void;
    onGenre: (genre: Genre) => void;
}) {
    const s = useText();
    const q = search.trim().toLowerCase();
    const movies = MOVIES.filter((m) => !q || matches(m.title, q) || m.cast.some((c) => c.toLowerCase().includes(q)));
    if (!movies.length) return <NoResults search={search} />;
    const card = (m: Movie) => <MovieCard key={m.id} movie={m} progress={progress[m.id] ?? 0} onOpen={() => onOpen(m.id)} onPlay={() => onPlay(m.id)} />;
    const watching = movies.filter((m) => (progress[m.id] ?? 0) > 0);
    const genres = [...new Set(movies.flatMap((m) => m.genres))].sort((a, b) => s(GENRES[a]).localeCompare(s(GENRES[b])));
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pt-1 pb-6">
            {watching.length > 0 && <section><SectionTitle>{s(["Watching", "正在观看", "正在觀看"])}</SectionTitle><Row>{watching.map(card)}</Row></section>}
            <section><SectionTitle>{s(["Recently Added", "最近添加", "最近加入"])}</SectionTitle><Row>{[...movies].sort((a, b) => a.added - b.added).map(card)}</Row></section>
            <section><SectionTitle>{s(["Top Rated", "评分最高", "評分最高"])}</SectionTitle><Row>{[...movies].sort((a, b) => b.rating - a.rating).map(card)}</Row></section>
            <section>
                <SectionTitle>{s(["Genres", "类型", "類型"])}</SectionTitle>
                <div className="grid grid-cols-2 gap-3 px-5 md:grid-cols-3">
                    {genres.map((g) => {
                        const art = movies.find((m) => m.genres.includes(g))!.art;
                        return (
                            <button key={g} type="button" className="overflow-hidden rounded-lg" onClick={() => onGenre(g)}>
                                <Artwork art={art} className="flex h-20 items-center justify-center">
                                    <span className="relative text-[20px] font-bold text-white [text-shadow:0_1px_6px_rgb(0_0_0/0.5)]">{s(GENRES[g])}</span>
                                </Artwork>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

export function GenreList({ genre, progress, onOpen, onPlay }: { genre: Genre; progress: Progress; onOpen: (id: string) => void; onPlay: (id: string) => void }) {
    return (
        <div className="flex flex-wrap gap-4 overflow-y-auto px-5 pt-1 pb-6">
            {MOVIES.filter((m) => m.genres.includes(genre)).map((m) => (
                <MovieCard key={m.id} movie={m} progress={progress[m.id] ?? 0} onOpen={() => onOpen(m.id)} onPlay={() => onPlay(m.id)} />
            ))}
        </div>
    );
}

function Hero({ art, children }: { art: Movie["art"]; children: ReactNode }) {
    return (
        <Artwork art={art} className="flex min-h-[220px] shrink-0 items-end">
            <div className="relative w-full bg-linear-to-t from-black/75 via-black/35 to-transparent px-5 pt-16 pb-4 text-white">{children}</div>
        </Artwork>
    );
}

function PlayButton({ resume, onClick }: { resume: boolean; onClick: () => void }) {
    const s = useText();
    return (
        <button type="button" className={cn("flex h-8 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold", ACCENT.bg)} onClick={onClick}>
            <SFSymbol name="play.fill" className="size-3" />{resume ? s(["Resume", "继续播放", "繼續播放"]) : s(["Play", "播放", "播放"])}
        </button>
    );
}

export function MovieDetail({ movie, progress, onPlay }: { movie: Movie; progress: number; onPlay: () => void }) {
    const s = useText();
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <Hero art={movie.art}>
                <h3 className="text-[28px] leading-tight font-bold">{s(movie.title)}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[13px] text-white/80">
                    <span>{movie.year}</span>·<span>{runtime(movie.minutes, s)}</span>·<span>{movie.genres.map((g) => s(GENRES[g])).join(s([", ", "、", "、"]))}</span>·
                    <span className="flex items-center gap-0.5"><SFSymbol name="star.fill" className="size-3 text-[#ffcc00]" />{movie.rating.toFixed(1)}</span>
                </p>
                <div className="mt-3 flex items-center gap-3">
                    <PlayButton resume={progress > 0} onClick={onPlay} />
                    {progress > 0 && <span className="text-[12px] text-white/75">{s([`${duration(movie.minutes * 60 - progress)} left`, `剩余 ${duration(movie.minutes * 60 - progress)}`, `剩餘 ${duration(movie.minutes * 60 - progress)}`])}</span>}
                </div>
            </Hero>
            <div className="flex flex-col gap-5 px-5 py-4">
                <p className="max-w-[560px] leading-relaxed">{s(movie.overview)}</p>
                <section>
                    <h5 className="mb-2 text-[15px] font-semibold">{s(["Cast", "演员", "演員"])}</h5>
                    <div className="flex flex-wrap gap-4">
                        {movie.cast.map((name, i) => (
                            <div key={name} className="flex w-16 flex-col items-center gap-1 text-center">
                                <span className="flex size-14 items-center justify-center rounded-full text-[17px] font-semibold text-white" style={{ background: `hsl(${(i * 67 + movie.year) % 360} 35% 45%)` }}>
                                    {name.split(" ").map((p) => p[0]).join("")}
                                </span>
                                <span className="text-[11px] leading-tight">{name}</span>
                            </div>
                        ))}
                    </div>
                </section>
                <section>
                    <h5 className="mb-2 text-[15px] font-semibold">{s(["File", "文件", "檔案"])}</h5>
                    <div className={cn("flex flex-col gap-1.5 rounded-lg border p-3 text-[12px]", MAC.line)}>
                        <p className="flex items-center gap-1.5 font-mono text-[11.5px]"><SFSymbol name="doc" className={cn("size-3.5 shrink-0", MAC.muted)} /><span className="truncate">Movies/{movie.file}</span></p>
                        <p className="flex flex-wrap gap-1">
                            {movie.tags.map((t) => <span key={t} className={cn("rounded border px-1.5 text-[10.5px] font-semibold", MAC.line, MAC.muted)}>{t}</span>)}
                            <span className={cn("rounded border px-1.5 text-[10.5px] font-semibold", MAC.line, MAC.muted)}>{s(["Subtitles: English, 简体中文", "字幕：English、简体中文", "字幕：English、简体中文"])}</span>
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}

export function ShowsGrid({ search, onOpen }: { search: string; onOpen: (id: string) => void }) {
    const s = useText();
    const q = search.trim().toLowerCase();
    const shows = SHOWS.filter((show) => !q || matches(show.title, q) || show.seasons.some((se) => se.episodes.some((e) => matches(e.title, q))));
    if (!shows.length) return <NoResults search={search} />;
    return (
        <div className="grid min-h-0 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] content-start gap-5 overflow-y-auto px-5 pt-1 pb-6">
            {shows.map((show) => {
                const episodes = show.seasons.flatMap((se) => se.episodes).length;
                return (
                    <button key={show.id} type="button" className="text-left" onClick={() => onOpen(show.id)}>
                        <Artwork art={show.art} className="flex aspect-video items-end rounded-lg shadow-[0_2px_8px_rgb(0_0_0/0.18)]">
                            <span className="relative w-full bg-linear-to-t from-black/60 to-transparent px-3 pt-6 pb-2 text-[15px] font-bold text-white">{s(show.title)}</span>
                        </Artwork>
                        <p className={cn("mt-1.5 text-[12px]", MAC.muted)}>{show.years} · {seasons(show.seasons.length, s)} · {s([`${episodes} Episodes`, `${episodes} 集`, `${episodes} 集`])}</p>
                    </button>
                );
            })}
        </div>
    );
}

export function ShowDetail({ show, progress, onPlay }: { show: Show; progress: Progress; onPlay: (episode: Episode) => void }) {
    const s = useText();
    const [seasonNumber, setSeasonNumber] = useState(() => {
        // Open on the season with the next episode to watch.
        const next = show.seasons.find((se) => se.episodes.some((e) => (progress[e.id] ?? e.progress) < e.minutes * 60));
        return next?.number ?? 1;
    });
    const season = show.seasons.find((se) => se.number === seasonNumber)!;
    const all = show.seasons.flatMap((se) => se.episodes);
    const upNext = all.find((e) => (progress[e.id] ?? e.progress) < e.minutes * 60) ?? all[0];
    const upNextProgress = progress[upNext.id] ?? upNext.progress;
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <Hero art={show.art}>
                <h3 className="text-[28px] leading-tight font-bold">{s(show.title)}</h3>
                <p className="mt-1 text-[13px] text-white/80">{show.years} · {seasons(show.seasons.length, s)}</p>
                <p className="mt-1.5 max-w-[520px] text-[13px] text-white/85">{s(show.overview)}</p>
                <div className="mt-3 flex items-center gap-3">
                    <PlayButton resume={upNextProgress > 0 && upNextProgress < upNext.minutes * 60} onClick={() => onPlay(upNext)} />
                    <span className="text-[12px] text-white/75">{upNext.file.replace(".mkv", "")} · {s(upNext.title)}</span>
                </div>
            </Hero>
            <div className="flex flex-col gap-3 px-5 py-4">
                {show.seasons.length > 1 && (
                    <Segmented
                        options={show.seasons.map((se) => ({ value: String(se.number), label: s([`Season ${se.number}`, `第 ${se.number} 季`, `第 ${se.number} 季`]) }))}
                        value={String(seasonNumber)}
                        onChange={(v) => setSeasonNumber(Number(v))}
                        className="self-start"
                    />
                )}
                <div className="flex flex-col">
                    {season.episodes.map((e) => {
                        const p = progress[e.id] ?? e.progress;
                        const watched = p >= e.minutes * 60;
                        return (
                            <button key={e.id} type="button" className={cn("group flex items-center gap-3 rounded-lg p-2 text-left", MAC.hover)} onClick={() => onPlay(e)}>
                                <Artwork art={show.art} className="aspect-video w-28 shrink-0 rounded-md">
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                                        <SFSymbol name="play.fill" className="size-5 text-white" />
                                    </span>
                                    {p > 0 && !watched && (
                                        <span className="absolute inset-x-0 bottom-0 h-1 bg-black/30"><span className={cn("block h-full", ACCENT.bar)} style={{ width: `${(p / (e.minutes * 60)) * 100}%` }} /></span>
                                    )}
                                </Artwork>
                                <span className="flex min-w-0 flex-1 flex-col leading-snug">
                                    <span className={cn("text-[11px] font-semibold", MAC.muted)}>{s([`EPISODE ${e.number}`, `第 ${e.number} 集`, `第 ${e.number} 集`])}</span>
                                    <span className="truncate font-semibold">{s(e.title)}</span>
                                    <span className={cn("text-[12px]", MAC.muted)}>{s([`${e.minutes} min`, `${e.minutes} 分钟`, `${e.minutes} 分鐘`])}</span>
                                </span>
                                {watched && <SFSymbol name="checkmark.circle.fill" className={cn("size-4 shrink-0", ACCENT.text)} />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
