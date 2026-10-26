// The library in the Arthub demo: made-up movies, shows and albums, each with drawn artwork, the
// files they were recognized from, subtitles and lyrics.

export type Motif = "aurora" | "moon" | "sun" | "rings" | "glass" | "city" | "kites" | "waves" | "map" | "notes" | "bloom" | "tide" | "desk" | "leaf";
export type Art = { from: string; to: string; motif: Motif };

export type Subtitle = { en: string; zh: string };

export type Movie = {
    id: string;
    title: string;
    year: number;
    minutes: number;
    rating: number;
    genres: string[];
    overview: string;
    cast: string[];
    art: Art;
    file: string;
    tags: string[];
    added: number;
    /** Seconds watched, 0 for not started. */
    progress: number;
    subtitles: Subtitle[];
};

export const MOVIES: Movie[] = [
    {
        id: "northern", title: "Northern Lights Hotel", year: 2023, minutes: 118, rating: 7.8, genres: ["Drama"],
        overview: "On the last night of the season, the staff of a hotel at the edge of the Arctic Circle wait for the lights — and for a guest who booked the same room every winter for forty years.",
        cast: ["Ingrid Hale", "Tomas Reyes", "June Park", "Ola Berg"],
        art: { from: "#0b1d3a", to: "#1f6f6b", motif: "aurora" },
        file: "Northern Lights Hotel (2023) 2160p HDR.mkv", tags: ["4K", "HDR", "5.1"], added: 1, progress: 2412,
        subtitles: [
            { en: "Every winter she asked for room twelve.", zh: "每年冬天，她都要十二号房。" },
            { en: "The forecast says clear skies after midnight.", zh: "天气预报说午夜以后会放晴。" },
            { en: "Keep the lamps low. They come when it's dark.", zh: "把灯调暗一点，天黑透了它们才会来。" },
            { en: "Forty years, and she never once missed them.", zh: "四十年了，她一次都没错过。" },
            { en: "There — over the ridge. Do you see it?", zh: "那边——山脊上面。看见了吗？" },
            { en: "Then we wait a little longer.", zh: "那我们再等一会儿。" },
        ],
    },
    {
        id: "ferry", title: "The Last Ferry", year: 2021, minutes: 104, rating: 7.2, genres: ["Thriller"],
        overview: "A night crossing, a storm that closes the harbor behind them, and eleven passengers who each have a reason not to reach the other side.",
        cast: ["Marcus Dey", "Lena Fischer", "Ibrahim Sola"],
        art: { from: "#0d1424", to: "#3a4a6b", motif: "moon" },
        file: "The.Last.Ferry.2021.1080p.BluRay.x264.mkv", tags: ["1080p", "Stereo"], added: 4, progress: 0,
        subtitles: [
            { en: "That's the last boat tonight.", zh: "这是今晚最后一班船了。" },
            { en: "Nobody leaves the deck until we dock.", zh: "靠岸之前，谁都不许离开甲板。" },
            { en: "Count them again. There were eleven.", zh: "再数一遍。刚才明明是十一个人。" },
            { en: "The radio's been dead since the lighthouse.", zh: "过了灯塔，无线电就没信号了。" },
            { en: "Someone on this ferry knows why.", zh: "这条船上有人知道为什么。" },
            { en: "Hold on to something.", zh: "抓紧了。" },
        ],
    },
    {
        id: "orchestra", title: "Paper Moon Orchestra", year: 2024, minutes: 96, rating: 8.1, genres: ["Comedy", "Music"],
        overview: "A school band with nine members, six instruments and one week to learn a symphony decides the only way through is to play it on whatever they can find.",
        cast: ["Rosa Lin", "Dev Kapoor", "Sam O'Neill", "Ana Ruiz"],
        art: { from: "#f2b84b", to: "#d9534f", motif: "notes" },
        file: "Paper Moon Orchestra (2024).mp4", tags: ["1080p", "Stereo"], added: 0, progress: 0,
        subtitles: [
            { en: "We have a week. And a tuba.", zh: "我们有一个星期，还有一把大号。" },
            { en: "Is that a saucepan?", zh: "那是个锅吗？" },
            { en: "It's in B flat. Mostly.", zh: "降 B 调的。大部分时候是。" },
            { en: "From the top, and this time together.", zh: "从头来，这次一起。" },
            { en: "Nobody said it had to be quiet.", zh: "又没人说一定要小声。" },
            { en: "That was almost music!", zh: "刚才那个差点就是音乐了！" },
        ],
    },
    {
        id: "glasshouse", title: "Glasshouse", year: 2022, minutes: 111, rating: 6.9, genres: ["Mystery"],
        overview: "A botanist inherits a greenhouse that is always one degree warmer than it should be, and a key to a door nobody can find.",
        cast: ["Nora Quinn", "Felix Adeyemi"],
        art: { from: "#1d3b2a", to: "#7fb77e", motif: "glass" },
        file: "Glasshouse.2022.2160p.WEB-DL.DDP5.1.mkv", tags: ["4K", "5.1"], added: 6, progress: 0,
        subtitles: [
            { en: "It was warmer in here yesterday.", zh: "昨天这里还要暖和一些。" },
            { en: "None of these plants should grow this far north.", zh: "这些植物都不该长在这么北的地方。" },
            { en: "The key doesn't fit any door in the house.", zh: "这把钥匙开不了屋里任何一扇门。" },
            { en: "Then it isn't for the house.", zh: "那它就不是开这栋房子的。" },
            { en: "Listen. The glass is humming.", zh: "听，玻璃在嗡嗡响。" },
            { en: "My aunt never told anyone.", zh: "我姑姑从没告诉过任何人。" },
        ],
    },
    {
        id: "salt", title: "Salt & Ember", year: 2020, minutes: 127, rating: 7.5, genres: ["Adventure"],
        overview: "Two rival caravans cross a salt desert in a race to the coast, until a sandstorm leaves them with one map, one camel and each other.",
        cast: ["Yusuf Amari", "Clara Voss", "Kenji Mori"],
        art: { from: "#f0a35e", to: "#8c3b2a", motif: "sun" },
        file: "Salt and Ember (2020) [1080p].mkv", tags: ["1080p", "5.1"], added: 8, progress: 5320,
        subtitles: [
            { en: "The coast is nine days east.", zh: "海岸在东边，要走九天。" },
            { en: "Eight, if we don't stop to argue.", zh: "要是路上不吵架，八天。" },
            { en: "The storm took everything but this.", zh: "沙暴把东西全卷走了，就剩这个。" },
            { en: "Your map, my camel.", zh: "你的地图，我的骆驼。" },
            { en: "Walk at night. The salt holds the cold.", zh: "晚上走。盐地能留住凉气。" },
            { en: "We share the water. All of it.", zh: "水一起喝，一滴都不分。" },
        ],
    },
    {
        id: "hours", title: "Small Hours", year: 2023, minutes: 89, rating: 7.0, genres: ["Romance"],
        overview: "Two night-shift workers keep missing each other at the same all-night diner, so they start leaving notes in the jukebox.",
        cast: ["Mei Tanaka", "Elliot Brooks"],
        art: { from: "#2a1840", to: "#d94f8a", motif: "city" },
        file: "Small Hours 2023 720p.mp4", tags: ["720p", "Stereo"], added: 2, progress: 0,
        subtitles: [
            { en: "Same booth, three in the morning.", zh: "同一个卡座，凌晨三点。" },
            { en: "Someone left a note under song B7.", zh: "有人在 B7 那首歌底下留了张纸条。" },
            { en: "“You always pick the sad ones.”", zh: "“你总是点那些伤感的歌。”" },
            { en: "I work until four. You leave at half past three.", zh: "我上到四点，你三点半就走了。" },
            { en: "So I'll come in early.", zh: "那我早点来。" },
            { en: "Play the sad one. I'll be there.", zh: "点那首伤感的吧，我会到的。" },
        ],
    },
    {
        id: "orbit", title: "Orbit of Echoes", year: 2025, minutes: 142, rating: 8.4, genres: ["Sci-Fi"],
        overview: "The only crew member awake on a slow ship to a ringed world begins hearing messages from the mission control that hasn't been built yet.",
        cast: ["Ada Okafor", "Lucas Brandt", "Hana Seo"],
        art: { from: "#0a0a1f", to: "#5b3fa8", motif: "rings" },
        file: "Orbit.of.Echoes.2025.IMAX.2160p.DV.HDR10.mkv", tags: ["4K", "Dolby Vision", "Atmos"], added: 3, progress: 0,
        subtitles: [
            { en: "Day four hundred and twelve. Still on course.", zh: "第四百一十二天，航线正常。" },
            { en: "Control, please repeat. You're breaking up.", zh: "指挥中心，请重复。信号断断续续的。" },
            { en: "That transmission is dated next year.", zh: "这条信号的日期是明年。" },
            { en: "The rings are singing again.", zh: "那些光环又在唱了。" },
            { en: "If you can hear this, don't wake the others.", zh: "如果你听得到，别叫醒其他人。" },
            { en: "I'm not alone up here, am I?", zh: "这上面不只我一个人，对吗？" },
        ],
    },
    {
        id: "kite", title: "Kite Season", year: 2019, minutes: 93, rating: 7.3, genres: ["Family"],
        overview: "A girl and her grandfather build a kite for the village contest from the pages of his old flight logbook.",
        cast: ["Lily Chen", "Arthur Wells"],
        art: { from: "#7ec8e3", to: "#f7d794", motif: "kites" },
        file: "Kite Season (2019).m4v", tags: ["1080p", "Stereo"], added: 9, progress: 0,
        subtitles: [
            { en: "The wind comes from the sea in March.", zh: "三月的风是从海上来的。" },
            { en: "Every page is a flight I took.", zh: "每一页都是我飞过的一趟。" },
            { en: "Won't they tear?", zh: "不会撕破吗？" },
            { en: "Paper is stronger than it looks.", zh: "纸比看上去结实。" },
            { en: "Run! Now let go!", zh: "跑！现在松手！" },
            { en: "Look how high it is, Grandpa.", zh: "爷爷，你看它飞得多高。" },
        ],
    },
    {
        id: "tidewater", title: "Tidewater", year: 2024, minutes: 108, rating: 7.6, genres: ["Drama"],
        overview: "Three sisters return to the island where they grew up to decide what to do with a house the sea is slowly taking back.",
        cast: ["Ruth Ellis", "Maya Grant", "Isla Moreau"],
        art: { from: "#16324f", to: "#8fb9c9", motif: "waves" },
        file: "Tidewater.2024.1080p.WEBRip.mkv", tags: ["1080p", "5.1"], added: 5, progress: 0,
        subtitles: [
            { en: "The tide reaches the porch now.", zh: "现在潮水都涨到门廊了。" },
            { en: "Mum would have hated selling it.", zh: "妈要是在，肯定不愿意卖。" },
            { en: "Mum isn't here. We are.", zh: "妈不在了，在这儿的是我们。" },
            { en: "Remember when the garden went down to the rocks?", zh: "还记得花园一直通到礁石那儿吗？" },
            { en: "One more summer. That's all I'm asking.", zh: "再过一个夏天，我只求这个。" },
            { en: "The sea doesn't wait for anybody.", zh: "海可不等人。" },
        ],
    },
    {
        id: "cartographer", title: "Cartographer", year: 2018, minutes: 121, rating: 7.9, genres: ["Adventure"],
        overview: "A mapmaker hired to chart a river that changes course every spring finds that the river has been drawing her.",
        cast: ["Elena Duarte", "Ravi Menon"],
        art: { from: "#3b2f1e", to: "#c9a86a", motif: "map" },
        file: "Cartographer (2018) 1080p.mkv", tags: ["1080p", "Stereo"], added: 7, progress: 0,
        subtitles: [
            { en: "The river moved again last night.", zh: "昨晚河道又改了。" },
            { en: "Then your map is already wrong.", zh: "那你的地图已经不对了。" },
            { en: "No map is right for long.", zh: "没有哪张地图能一直是对的。" },
            { en: "These bends — I drew them years ago.", zh: "这几道弯——我好多年前就画过。" },
            { en: "Before you ever came here?", zh: "在你来这儿之前？" },
            { en: "Before I knew it existed.", zh: "在我知道它存在之前。" },
        ],
    },
];

export type Episode = { id: string; number: number; title: string; minutes: number; progress: number; file: string };
export type Season = { number: number; episodes: Episode[] };
export type Show = { id: string; title: string; years: string; overview: string; art: Art; seasons: Season[]; subtitles: Subtitle[] };

function season(show: string, number: number, titles: string[], minutes: number, watched = 0): Season {
    return {
        number,
        episodes: titles.map((title, i) => {
            const code = `S${String(number).padStart(2, "0")}E${String(i + 1).padStart(2, "0")}`;
            return { id: `${show}-${code}`, number: i + 1, title, minutes, progress: i < watched ? minutes * 60 : 0, file: `${code}.mkv` };
        }),
    };
}

export const SHOWS: Show[] = [
    {
        id: "harbor", title: "Harbor Lights", years: "2022–2024", art: { from: "#102a43", to: "#f0b429", motif: "tide" },
        overview: "A small fishing town, its lighthouse keeper and the harbor master who has never once left, through two long winters.",
        seasons: [
            season("harbor", 1, ["The Keeper", "Fog Bell", "Low Water", "The Regatta", "Nets", "First Ice"], 48, 6),
            season("harbor", 2, ["Thaw", "The Inspector", "Salt Road", "Wreckers", "Lantern", "Spring Tide"], 51, 2),
        ],
        subtitles: [
            { en: "The light's been late three nights running.", zh: "灯已经连着三晚亮晚了。" },
            { en: "Nobody rings the fog bell anymore.", zh: "现在没人敲雾钟了。" },
            { en: "Boats are coming in early. Something's wrong.", zh: "船都提早回来了，不对劲。" },
            { en: "I've never left this harbor. Not once.", zh: "我从没离开过这个港口，一次都没有。" },
        ],
    },
    {
        id: "desk", title: "The Night Desk", years: "2025", art: { from: "#1b1b1b", to: "#c0392b", motif: "desk" },
        overview: "The overnight newsroom of a city paper, where every story breaks after the editors have gone home.",
        seasons: [season("desk", 1, ["Deadline", "Late Edition", "The Source", "Stop the Press", "Retraction", "Morning"], 44, 1)],
        subtitles: [
            { en: "We go to print in forty minutes.", zh: "四十分钟后付印。" },
            { en: "Who's the source? Two sources, or it doesn't run.", zh: "消息来源是谁？没有两个来源就不能发。" },
            { en: "Hold the front page.", zh: "头版先别动。" },
            { en: "It's three a.m. Everything's news at three a.m.", zh: "凌晨三点了，这个点什么都是新闻。" },
        ],
    },
    {
        id: "field", title: "Field Notes", years: "2019–2023", art: { from: "#2d4a22", to: "#c5d86d", motif: "leaf" },
        overview: "A naturalist spends a year in one meadow, one forest and one coast, and films everything that lives there.",
        seasons: [
            season("field", 1, ["The Meadow in Spring", "Pollinators", "High Summer", "Seed"], 52, 4),
            season("field", 2, ["Old Wood", "Canopy", "Fungi", "Deep Winter"], 52, 4),
            season("field", 3, ["Rock Pools", "The Gull Colony", "Kelp", "Storm Season"], 53, 0),
        ],
        subtitles: [
            { en: "At dawn, the meadow is louder than the city.", zh: "清晨的草地比城市还要吵。" },
            { en: "This bee will visit two thousand flowers today.", zh: "这只蜜蜂今天要拜访两千朵花。" },
            { en: "Nothing here is wasted.", zh: "这里没有什么是浪费的。" },
            { en: "By autumn, she will be gone.", zh: "到了秋天，她就不在了。" },
        ],
    },
];

export type Song = {
    id: string;
    title: string;
    seconds: number;
    /** Beats per minute and the progression (semitones above the album's root) the synth plays. */
    bpm: number;
    chords: number[];
    lyrics: [number, string][];
};
export type Album = { id: string; title: string; artist: string; year: number; root: number; art: Art; songs: Song[] };

export const ALBUMS: Album[] = [
    {
        id: "weathervane", title: "Weathervane", artist: "Lumen Hall", year: 2022, root: 57, art: { from: "#ff9a62", to: "#5b2a86", motif: "sun" },
        songs: [
            { id: "w1", title: "North Wind", seconds: 214, bpm: 92, chords: [0, 5, 9, 7], lyrics: [[4, "Turn your face to the north wind"], [12, "Let it carry what you couldn't say"], [20, "Every roof in town is singing"], [28, "Every vane has turned away"], [37, "Oh, the weather's coming in"], [45, "And I'm not afraid of it"], [53, "Turn your face to the north wind"], [61, "Let it carry you home"]] },
            { id: "w2", title: "Glass Harbour", seconds: 197, bpm: 78, chords: [0, 8, 3, 10], lyrics: [[3, "The boats are made of glass tonight"], [11, "And the water holds its breath"], [19, "I can see right through the harbour"], [27, "To the place we left"], [36, "Hold still, hold still"], [44, "Let the light come through"]] },
            { id: "w3", title: "Paper Planes", seconds: 182, bpm: 118, chords: [0, 7, 9, 5], lyrics: [[2, "Fold it once and make a wish"], [9, "Fold it twice and let it go"], [16, "All our letters turned to wings"], [23, "Over rooftops, over snow"], [31, "Paper planes, paper planes"], [38, "Take the long way round"]] },
            { id: "w4", title: "Weathervane", seconds: 243, bpm: 84, chords: [0, 3, 8, 7], lyrics: [[5, "Up on the steeple, turning slow"], [14, "Pointing everywhere I go"], [23, "Tell me which way the wind will blow"], [32, "Tell me something I don't know"], [41, "I'll keep turning, I'll keep turning"], [50, "Till the morning finds me home"]] },
            { id: "w5", title: "Last Light", seconds: 205, bpm: 70, chords: [0, 5, 3, 7], lyrics: [[4, "Stay a while in the last light"], [14, "Let the evening come undone"], [24, "Every shadow getting longer"], [34, "Every window catching sun"], [44, "Stay a while"]] },
        ],
    },
    {
        id: "static", title: "Static Bloom", artist: "The Paper Cranes", year: 2024, root: 52, art: { from: "#1fd1a5", to: "#14365c", motif: "bloom" },
        songs: [
            { id: "s1", title: "Radio Garden", seconds: 188, bpm: 124, chords: [0, 5, 7, 5], lyrics: [[2, "Tune it in between the stations"], [9, "There's a garden in the noise"], [16, "Flowers made of static"], [23, "Growing louder than our voice"], [31, "Radio, radio garden"], [38, "Play it back to me"]] },
            { id: "s2", title: "Neon Moth", seconds: 201, bpm: 104, chords: [0, 10, 8, 7], lyrics: [[3, "Circling the sign outside the station"], [11, "Burning on a borrowed glow"], [19, "Every night the same old question"], [27, "Where else would a moth go?"], [35, "Neon, neon"], [43, "I'm coming back to you"]] },
            { id: "s3", title: "Overgrown", seconds: 226, bpm: 96, chords: [0, 3, 5, 3], lyrics: [[4, "Ivy on the satellites"], [12, "Moss on every wire"], [20, "The city's going green again"], [28, "And we're not getting tired"], [37, "Let it grow, let it grow"], [45, "Overgrown"]] },
            { id: "s4", title: "Afterglow", seconds: 239, bpm: 88, chords: [0, 7, 5, 0], lyrics: [[5, "When the music stops"], [13, "There's a hum that stays"], [21, "Like the colour of a summer"], [29, "On the shortest days"], [38, "Afterglow, afterglow"], [46, "Keep it close"]] },
        ],
    },
    {
        id: "lowtide", title: "Low Tide", artist: "Mira Sol", year: 2021, root: 55, art: { from: "#a1c4fd", to: "#2b5876", motif: "waves" },
        songs: [
            { id: "l1", title: "Shoreline", seconds: 231, bpm: 72, chords: [0, 9, 5, 7], lyrics: [[4, "Walking where the water was"], [13, "Shells beneath my feet"], [22, "The sea went out to find you"], [31, "And it left the sand for me"], [40, "Shoreline, shoreline"], [49, "Wait for me"]] },
            { id: "l2", title: "Lanterns", seconds: 194, bpm: 98, chords: [0, 5, 0, 7], lyrics: [[3, "Light a lantern for the boats"], [11, "Light another for the shore"], [19, "Hang them all along the pier"], [27, "So they find their way once more"], [35, "Lanterns, lanterns"], [43, "Burning low"]] },
            { id: "l3", title: "Undertow", seconds: 247, bpm: 82, chords: [0, 3, 10, 8], lyrics: [[5, "There's a pull beneath the quiet"], [14, "There's a voice beneath the waves"], [23, "Every time I try to leave here"], [32, "I'm the one the water saves"], [41, "Undertow, undertow"], [50, "Don't let go"]] },
            { id: "l4", title: "Sea Glass", seconds: 176, bpm: 110, chords: [0, 7, 9, 5], lyrics: [[2, "Green and blue and frosted white"], [9, "Smoothed by every tide"], [16, "Broken things the ocean kept"], [23, "And polished to the light"], [31, "Sea glass, sea glass"], [38, "In my hand"]] },
        ],
    },
];

export type Track = Song & { album: Album };
export const TRACKS: Track[] = ALBUMS.flatMap((album) => album.songs.map((s) => ({ ...s, album })));

/** "1:58" for seconds, or "1h 58m" for a runtime in minutes. */
export function duration(seconds: number) {
    const s = Math.max(Math.floor(seconds), 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}` : `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function runtime(minutes: number) {
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

/** The files in the library folder, as Arthub recognized them. */
export function libraryFiles() {
    return [
        ...MOVIES.map((m) => ({ path: `Movies/${m.file}`, kind: "Movie" as const, match: `${m.title} (${m.year})`, tags: m.tags })),
        ...SHOWS.flatMap((s) => s.seasons.flatMap((season) => season.episodes.slice(0, 2).map((e) => ({
            path: `TV Shows/${s.title}/Season ${String(season.number).padStart(2, "0")}/${s.title} ${e.file}`,
            kind: "Episode" as const,
            match: `${s.title} · ${e.file.replace(".mkv", "")} · ${e.title}`,
            tags: ["1080p"],
        })))),
        ...ALBUMS.flatMap((a) => a.songs.slice(0, 2).map((s, i) => ({
            path: `Music/${a.artist}/${a.title} (${a.year})/${String(i + 1).padStart(2, "0")} ${s.title}.flac`,
            kind: "Song" as const,
            match: `${s.title} — ${a.artist}`,
            tags: ["FLAC", "Lyrics"],
        }))),
    ];
}
