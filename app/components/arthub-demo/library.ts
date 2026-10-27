// The library in the Arthub demo: made-up movies, shows and albums, each with drawn artwork, the
// files they were recognized from, subtitles and lyrics. Titles and overviews come in the visitor's
// language, as the app's metadata would; file names, songs and lyrics stay as they are.

import type { L } from "~/components/demo-text";

export type Motif = "aurora" | "moon" | "sun" | "rings" | "glass" | "city" | "kites" | "waves" | "map" | "notes" | "bloom" | "tide" | "desk" | "leaf";
export type Art = { from: string; to: string; motif: Motif };

export type Subtitle = { en: string; zh: string };

export type Genre = "drama" | "thriller" | "comedy" | "music" | "mystery" | "adventure" | "romance" | "scifi" | "family";
export const GENRES: Record<Genre, L> = {
    drama: ["Drama", "剧情", "劇情"],
    thriller: ["Thriller", "惊悚", "驚悚"],
    comedy: ["Comedy", "喜剧", "喜劇"],
    music: ["Music", "音乐", "音樂"],
    mystery: ["Mystery", "悬疑", "懸疑"],
    adventure: ["Adventure", "冒险", "冒險"],
    romance: ["Romance", "爱情", "愛情"],
    scifi: ["Sci-Fi", "科幻", "科幻"],
    family: ["Family", "家庭", "家庭"],
};

export type Movie = {
    id: string;
    title: L;
    year: number;
    minutes: number;
    rating: number;
    genres: Genre[];
    overview: L;
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
        id: "northern", title: ["Northern Lights Hotel", "北极光旅馆", "北極光旅館"], year: 2023, minutes: 118, rating: 7.8, genres: ["drama"],
        overview: [
            "On the last night of the season, the staff of a hotel at the edge of the Arctic Circle wait for the lights — and for a guest who booked the same room every winter for forty years.",
            "季末的最后一夜，北极圈边上一家旅馆的员工在等极光，也在等一位四十年来每个冬天都订同一间房的客人。",
            "季末的最後一夜，北極圈邊上一家旅館的員工在等極光，也在等一位四十年來每個冬天都訂同一間房的客人。",
        ],
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
        id: "ferry", title: ["The Last Ferry", "末班渡轮", "末班渡輪"], year: 2021, minutes: 104, rating: 7.2, genres: ["thriller"],
        overview: [
            "A night crossing, a storm that closes the harbor behind them, and eleven passengers who each have a reason not to reach the other side.",
            "一次夜航，一场在身后封住港口的风暴，还有十一位乘客，每个人都有不想抵达对岸的理由。",
            "一次夜航，一場在身後封住港口的風暴，還有十一位乘客，每個人都有不想抵達對岸的理由。",
        ],
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
        id: "orchestra", title: ["Paper Moon Orchestra", "纸月亮乐团", "紙月亮樂團"], year: 2024, minutes: 96, rating: 8.1, genres: ["comedy", "music"],
        overview: [
            "A school band with nine members, six instruments and one week to learn a symphony decides the only way through is to play it on whatever they can find.",
            "一支九个人、六件乐器的校乐队，要在一周内学会一首交响曲，于是决定手边找到什么就用什么来演奏。",
            "一支九個人、六件樂器的校樂隊，要在一週內學會一首交響曲，於是決定手邊找到什麼就用什麼來演奏。",
        ],
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
        id: "glasshouse", title: ["Glasshouse", "玻璃温室", "玻璃溫室"], year: 2022, minutes: 111, rating: 6.9, genres: ["mystery"],
        overview: [
            "A botanist inherits a greenhouse that is always one degree warmer than it should be, and a key to a door nobody can find.",
            "一位植物学家继承了一座总比应有的温度高一度的温室，还有一把谁也找不到对应那扇门的钥匙。",
            "一位植物學家繼承了一座總比應有的溫度高一度的溫室，還有一把誰也找不到對應那扇門的鑰匙。",
        ],
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
        id: "salt", title: ["Salt & Ember", "盐与余烬", "鹽與餘燼"], year: 2020, minutes: 127, rating: 7.5, genres: ["adventure"],
        overview: [
            "Two rival caravans cross a salt desert in a race to the coast, until a sandstorm leaves them with one map, one camel and each other.",
            "两支互不相让的商队穿越盐漠，比谁先到海岸，直到一场沙暴让他们只剩一张地图、一头骆驼和彼此。",
            "兩支互不相讓的商隊穿越鹽漠，比誰先到海岸，直到一場沙暴讓他們只剩一張地圖、一頭駱駝和彼此。",
        ],
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
        id: "hours", title: ["Small Hours", "凌晨时分", "凌晨時分"], year: 2023, minutes: 89, rating: 7.0, genres: ["romance"],
        overview: [
            "Two night-shift workers keep missing each other at the same all-night diner, so they start leaving notes in the jukebox.",
            "两个上夜班的人总在同一家通宵餐馆错过彼此，于是开始在点唱机里给对方留纸条。",
            "兩個上夜班的人總在同一家通宵餐館錯過彼此，於是開始在點唱機裡給對方留紙條。",
        ],
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
        id: "orbit", title: ["Orbit of Echoes", "回声轨道", "回聲軌道"], year: 2025, minutes: 142, rating: 8.4, genres: ["scifi"],
        overview: [
            "The only crew member awake on a slow ship to a ringed world begins hearing messages from the mission control that hasn't been built yet.",
            "一艘飞船缓缓驶向一颗有光环的行星，船上唯一醒着的船员开始收到一座尚未建成的任务控制中心发来的讯息。",
            "一艘太空船緩緩駛向一顆有光環的行星，船上唯一醒著的船員開始收到一座尚未建成的任務控制中心發來的訊息。",
        ],
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
        id: "kite", title: ["Kite Season", "风筝季", "風箏季"], year: 2019, minutes: 93, rating: 7.3, genres: ["family"],
        overview: [
            "A girl and her grandfather build a kite for the village contest from the pages of his old flight logbook.",
            "女孩和爷爷用他旧飞行日志的纸页，为村里的比赛扎了一只风筝。",
            "女孩和爺爺用他舊飛行日誌的紙頁，為村裡的比賽紮了一隻風箏。",
        ],
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
        id: "tidewater", title: ["Tidewater", "潮水", "潮水"], year: 2024, minutes: 108, rating: 7.6, genres: ["drama"],
        overview: [
            "Three sisters return to the island where they grew up to decide what to do with a house the sea is slowly taking back.",
            "三姐妹回到长大的小岛，要决定那栋正被大海一点点收回的房子该怎么办。",
            "三姊妹回到長大的小島，要決定那棟正被大海一點點收回的房子該怎麼辦。",
        ],
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
        id: "cartographer", title: ["Cartographer", "制图师", "製圖師"], year: 2018, minutes: 121, rating: 7.9, genres: ["adventure"],
        overview: [
            "A mapmaker hired to chart a river that changes course every spring finds that the river has been drawing her.",
            "一位制图师受雇绘制一条每年春天都会改道的河，却发现这条河一直在描绘她。",
            "一位製圖師受雇繪製一條每年春天都會改道的河，卻發現這條河一直在描繪她。",
        ],
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

export type Episode = { id: string; number: number; title: L; minutes: number; progress: number; file: string };
export type Season = { number: number; episodes: Episode[] };
export type Show = { id: string; title: L; years: string; overview: L; art: Art; seasons: Season[]; subtitles: Subtitle[] };

function season(show: string, number: number, titles: L[], minutes: number, watched = 0): Season {
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
        id: "harbor", title: ["Harbor Lights", "港湾灯火", "港灣燈火"], years: "2022–2024", art: { from: "#102a43", to: "#f0b429", motif: "tide" },
        overview: [
            "A small fishing town, its lighthouse keeper and the harbor master who has never once left, through two long winters.",
            "一座小渔镇、镇上的灯塔看守人，和一次也没离开过的港务长，一起度过两个漫长的冬天。",
            "一座小漁鎮、鎮上的燈塔看守人，和一次也沒離開過的港務長，一起度過兩個漫長的冬天。",
        ],
        seasons: [
            season("harbor", 1, [
                ["The Keeper", "看守人", "看守人"], ["Fog Bell", "雾钟", "霧鐘"], ["Low Water", "低潮", "低潮"],
                ["The Regatta", "帆船赛", "帆船賽"], ["Nets", "渔网", "漁網"], ["First Ice", "初冰", "初冰"],
            ], 48, 6),
            season("harbor", 2, [
                ["Thaw", "解冻", "解凍"], ["The Inspector", "督察", "督察"], ["Salt Road", "盐路", "鹽路"],
                ["Wreckers", "拾荒者", "拾荒者"], ["Lantern", "提灯", "提燈"], ["Spring Tide", "大潮", "大潮"],
            ], 51, 2),
        ],
        subtitles: [
            { en: "The light's been late three nights running.", zh: "灯已经连着三晚亮晚了。" },
            { en: "Nobody rings the fog bell anymore.", zh: "现在没人敲雾钟了。" },
            { en: "Boats are coming in early. Something's wrong.", zh: "船都提早回来了，不对劲。" },
            { en: "I've never left this harbor. Not once.", zh: "我从没离开过这个港口，一次都没有。" },
        ],
    },
    {
        id: "desk", title: ["The Night Desk", "夜班编辑部", "夜班編輯部"], years: "2025", art: { from: "#1b1b1b", to: "#c0392b", motif: "desk" },
        overview: [
            "The overnight newsroom of a city paper, where every story breaks after the editors have gone home.",
            "一家城市报社的通宵编辑部，每条大新闻都在编辑们下班后才爆出来。",
            "一家城市報社的通宵編輯部，每條大新聞都在編輯們下班後才爆出來。",
        ],
        seasons: [season("desk", 1, [
            ["Deadline", "截稿", "截稿"], ["Late Edition", "晚间版", "晚間版"], ["The Source", "消息来源", "消息來源"],
            ["Stop the Press", "停机改版", "停機改版"], ["Retraction", "更正", "更正"], ["Morning", "清晨", "清晨"],
        ], 44, 1)],
        subtitles: [
            { en: "We go to print in forty minutes.", zh: "四十分钟后付印。" },
            { en: "Who's the source? Two sources, or it doesn't run.", zh: "消息来源是谁？没有两个来源就不能发。" },
            { en: "Hold the front page.", zh: "头版先别动。" },
            { en: "It's three a.m. Everything's news at three a.m.", zh: "凌晨三点了，这个点什么都是新闻。" },
        ],
    },
    {
        id: "field", title: ["Field Notes", "野外笔记", "野外筆記"], years: "2019–2023", art: { from: "#2d4a22", to: "#c5d86d", motif: "leaf" },
        overview: [
            "A naturalist spends a year in one meadow, one forest and one coast, and films everything that lives there.",
            "一位博物学家在一片草地、一片森林和一段海岸各待上一年，拍下那里生活的一切。",
            "一位博物學家在一片草地、一片森林和一段海岸各待上一年，拍下那裡生活的一切。",
        ],
        seasons: [
            season("field", 1, [["The Meadow in Spring", "春天的草地", "春天的草地"], ["Pollinators", "传粉者", "傳粉者"], ["High Summer", "盛夏", "盛夏"], ["Seed", "种子", "種子"]], 52, 4),
            season("field", 2, [["Old Wood", "古林", "古林"], ["Canopy", "林冠", "林冠"], ["Fungi", "真菌", "真菌"], ["Deep Winter", "隆冬", "隆冬"]], 52, 4),
            season("field", 3, [["Rock Pools", "潮池", "潮池"], ["The Gull Colony", "海鸥群", "海鷗群"], ["Kelp", "海藻林", "海藻林"], ["Storm Season", "风暴季", "風暴季"]], 53, 0),
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
        id: "weathervane", title: "Weathervane", artist: "Pale Harbor", year: 2022, root: 57, art: { from: "#ff9a62", to: "#5b2a86", motif: "sun" },
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

export function runtime(minutes: number, s: (l: L) => string) {
    const [h, m] = [Math.floor(minutes / 60), minutes % 60];
    return h ? s([`${h}h ${m}m`, `${h} 小时 ${m} 分钟`, `${h} 小時 ${m} 分鐘`]) : s([`${m}m`, `${m} 分钟`, `${m} 分鐘`]);
}

/** The files in the library folder, as Arthub recognized them. */
export function libraryFiles(s: (l: L) => string) {
    return [
        ...MOVIES.map((m) => ({ path: `Movies/${m.file}`, kind: "Movie" as const, match: `${s(m.title)} (${m.year})`, tags: m.tags })),
        ...SHOWS.flatMap((show) => show.seasons.flatMap((season) => season.episodes.slice(0, 2).map((e) => ({
            path: `TV Shows/${show.title[0]}/Season ${String(season.number).padStart(2, "0")}/${show.title[0]} ${e.file}`,
            kind: "Episode" as const,
            match: `${s(show.title)} · ${e.file.replace(".mkv", "")} · ${s(e.title)}`,
            tags: ["1080p"],
        })))),
        ...ALBUMS.flatMap((a) => a.songs.slice(0, 2).map((song, i) => ({
            path: `Music/${a.artist}/${a.title} (${a.year})/${String(i + 1).padStart(2, "0")} ${song.title}.flac`,
            kind: "Song" as const,
            match: `${song.title} — ${a.artist}`,
            tags: ["FLAC", s(["Lyrics", "歌词", "歌詞"])],
        }))),
    ];
}
