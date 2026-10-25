// Content of the ModelCraft demo: the Model Store's models, the conversations and scheduled tasks it
// starts with, and the replies the chat gives. The app's own text is English; replies follow the
// language of what the visitor types.

export type View = "chat" | "store" | "downloaded" | "connectors" | "tasks";

/** The Model Store's tabs, as the app names them. */
export type Category = "Text" | "Vision" | "Omni";
export type Model = { name: string; size: string; downloads: string; category: Category };

/** Model Store entries, most downloaded first, as the store listed them. */
export const MODELS: Model[] = ([
    ["Qwen3.8-27B-4bit", "16.07 GB", "881K", "Text"], ["olmOCR-2-7B-1025-mlx-8bit", "9.46 GB", "109K", "Vision"],
    ["Devstral-Small-2-24B-Instruct-2512-4bit", "44.38 GB", "69K", "Text"], ["Qwen3.6-27B-4bit", "16.07 GB", "66K", "Text"],
    ["Qwen3.8-27B-8bit", "58.1 GB", "48K", "Text"], ["Qwen3.6-35B-A3B-4bit", "20.42 GB", "46K", "Text"],
    ["gemma-3-4b-it-qat-4bit", "6.43 GB", "38K", "Vision"], ["gemma-3-12b-it-4bit", "16.1 GB", "38K", "Vision"],
    ["gemma-4-e4b-it-4bit", "10.4 GB", "32K", "Omni"], ["Qwen3.5-9B-MLX-4bit", "5.97 GB", "28K", "Text"],
    ["gemma-3-4b-it-8bit", "11.39 GB", "25K", "Vision"], ["gemma-4-e2b-it-4bit", "7.16 GB", "24K", "Omni"],
    ["Qwen2-VL-2B-Instruct-4bit", "1.26 GB", "21K", "Vision"], ["Qwen2.5-VL-7B-Instruct-4bit", "5.65 GB", "21K", "Vision"],
    ["gemma-3-27b-it-qat-4bit", "33.71 GB", "19K", "Vision"], ["Qwen3.5-9B-4bit", "5.97 GB", "19K", "Text"],
    ["gemma-4-31b-it-4bit", "36.86 GB", "19K", "Omni"], ["Qwen3-VL-4B-Instruct-4bit", "3.11 GB", "19K", "Vision"],
    ["gemma-3-12b-it-qat-4bit", "23.72 GB", "19K", "Vision"], ["gemma-4-E2B-it-qat-mobile", "2.43 GB", "18K", "Omni"],
    ["gemma-4-26b-a4b-it-4bit", "46.32 GB", "16K", "Omni"], ["llava-v1.6-mistral-7b-4bit", "4.26 GB", "14K", "Vision"],
    ["gemma-4-E4B-it-qat-mobile", "3.49 GB", "14K", "Omni"], ["llava-1.5-7b-4bit", "12.12 GB", "14K", "Vision"],
    ["Qwen3.5-2B-6bit", "2.21 GB", "11K", "Text"],
] as const).map(([name, size, downloads, category]) => ({ name, size, downloads, category }));

/** The model that comes downloaded. */
export const DEFAULT_MODEL = "Qwen3.5-2B-6bit";

/** The connectors, with the product each one opens, and whether it starts installed. */
export const CONNECTORS = [
    { id: "arthub", name: "Arthub", summary: "Browse and play the movies, TV shows, and music in your media library.", installed: true },
    { id: "cellar", name: "Cellar", summary: "Search the pages, databases, and notes in your knowledge base.", installed: true },
    { id: "keel", name: "Keel", summary: "Browse and edit the keys in your Redis databases.", installed: false },
    { id: "tunestudio", name: "TuneStudio", summary: "Put sung vocals on pitch and export the corrected audio.", installed: false },
];

export type Message = { role: "user" | "assistant"; text: string; tool?: string };
export type Chat = { id: string; title: string; messages: Message[] };

export const CHATS: Chat[] = [
    {
        id: "daily-notes",
        title: "Daily Notes Digest",
        messages: [
            { role: "user", text: "Search Cellar for the notes I created or edited today and summarize them in a few bullet points. List any open to-dos at the end." },
            {
                role: "assistant",
                tool: "Cellar",
                text: [
                    "I searched Cellar for the pages you created or edited today. Here's what changed:",
                    "- **Lumen 2.0 launch plan** — the goal is now 1,000 paid presets by the end of Q1, and Pencil masking moves to 2.1 if it slips.",
                    "- **Sync engine design** — added a diagram of the merge flow and notes on conflict handling.",
                    "- **Kyoto trip** — a day-by-day table and a shortlist of three ryokans.",
                    "**Open to-dos**",
                    "1. Decide on preset pricing before Thursday",
                    "2. Book the ryokan for the Kyoto trip",
                    "3. Finish Klara and the Sun",
                ].join("\n"),
            },
        ],
    },
    {
        id: "weekly-sync",
        title: "Weekly Sync Schedule Change",
        messages: [
            { role: "user", text: "The weekly sync moves from Tuesday to Thursday at 10:00. What's on the agenda in Cellar?" },
            {
                role: "assistant",
                tool: "Cellar",
                text: [
                    "Noted — Thursdays at 10:00 from now on. The latest page in **Meeting notes** lists three items:",
                    "1. Preset pricing — decide between $2.99 and $4.99",
                    "2. iPad layout review with Priya",
                    "3. Beta 3 feedback from TestFlight",
                ].join("\n"),
            },
        ],
    },
];

export type Task = { id: string; title: string; schedule: string; prompt: string; next: string; enabled: boolean };

export const TASKS: Task[] = [
    {
        id: "weekly-review", title: "Weekly Knowledge Review", schedule: "Every week on Sunday at 18:00",
        prompt: "Review the pages I added to Cellar this week, group them by topic, and suggest three worth revisiting next week.",
        next: "Next run Sunday, 25 Oct at 18:00", enabled: true,
    },
    {
        id: "movie-pick", title: "Friday Movie Pick", schedule: "Every week on Friday at 18:00",
        prompt: "Pick one movie from my Arthub library that I haven't watched recently and explain in two sentences why it suits a Friday night.",
        next: "Next run Friday, 30 Oct at 18:00", enabled: true,
    },
    {
        id: "daily-notes", title: "Daily Notes Digest", schedule: "Every day at 18:00",
        prompt: "Search Cellar for the notes I created or edited today and summarize them in a few bullet points. List any open to-dos at the end.",
        next: "Next run Sunday, 25 Oct at 18:00", enabled: true,
    },
];

/** What the "+" in Scheduled Tasks adds, one at a time, in place of the app's New Task sheet. */
export const PRESET_TASKS: Task[] = [
    {
        id: "morning-brief", title: "Morning Brief", schedule: "Every weekday at 08:30",
        prompt: "List the to-dos due today in Cellar and the meetings on my agenda page, most urgent first.",
        next: "Next run Monday, 26 Oct at 08:30", enabled: true,
    },
    {
        id: "redis-check", title: "Redis Health Check", schedule: "Every day at 09:00",
        prompt: "Use Keel to look at my local Redis server and tell me about any keys that grew a lot since yesterday.",
        next: "Next run Monday, 26 Oct at 09:00", enabled: true,
    },
    {
        id: "music-mix", title: "Sunday Music Mix", schedule: "Every week on Sunday at 10:00",
        prompt: "Pick ten songs from my Arthub library for a slow Sunday morning and put them in order.",
        next: "Next run Sunday, 1 Nov at 10:00", enabled: true,
    },
];

const CJK = /[㐀-鿿]/;

/** The scripted answer to a prompt: which connector it would use (or why it can't) and the text. */
export function replyTo(prompt: string, installed: Record<string, boolean>): Message {
    const zh = CJK.test(prompt);
    const say = (en: string, cn: string) => (zh ? cn : en);
    const p = prompt.toLowerCase();
    const needs = (name: string): Message | null =>
        installed[name] ? null : {
            role: "assistant",
            text: say(
                `${name} isn't connected yet. Install it in **Connectors**, then ask me again.`,
                `${name} 还没有连接。先在 **Connectors** 里安装它，再问我一次。`,
            ),
        };

    if (/cellar|note|to-?do|page|笔记|待办|页面/.test(p)) {
        return needs("Cellar") ?? {
            role: "assistant", tool: "Cellar",
            text: say(
                "From Cellar, edited today:\n- **Lumen 2.0 launch plan** — new goal of 1,000 paid presets by Q1\n- **Sync engine design** — merge flow diagram added\n- **Kyoto trip** — three ryokans shortlisted\n**Open to-dos**\n1. Decide on preset pricing before Thursday\n2. Book the ryokan for the Kyoto trip",
                "Cellar 里今天改过的页面：\n- **Lumen 2.0 发布计划** —— 新目标：Q1 前上架 1,000 个付费预设\n- **同步引擎设计** —— 加了合并流程图\n- **京都旅行** —— 选好了三家旅馆\n**未完成的待办**\n1. 周四前定下预设的价格\n2. 预订京都旅行的旅馆",
            ),
        };
    }
    if (/arthub|movie|film|watch|music|song|电影|影片|看|音乐|歌/.test(p)) {
        return needs("Arthub") ?? {
            role: "assistant", tool: "Arthub",
            text: say(
                "From your Arthub library: **Paddington 2 (2017)**. You haven't watched it in over a year, and it's warm and funny without asking much of you — just right after a long week.",
                "从你的 Arthub 片库里选了 **《帕丁顿熊 2》(2017)**。你一年多没看了，它温暖又好笑，不费脑子，正适合忙完一周的周五晚上。",
            ),
        };
    }
    if (/keel|redis/.test(p)) {
        return needs("Keel") ?? {
            role: "assistant", tool: "Keel",
            text: say(
                "Your local Redis server has 1,284 keys. **session:*** grew the most since yesterday (+212 keys); everything else is about the same.",
                "本地 Redis 一共有 1,284 个键。比昨天增长最多的是 **session:***（多了 212 个），其他基本没变。",
            ),
        };
    }
    if (/tunestudio|pitch|vocal|sing|音准|人声|唱/.test(p)) {
        return needs("TuneStudio") ?? {
            role: "assistant", tool: "TuneStudio",
            text: say(
                "I opened your latest take in TuneStudio. Three notes in the chorus were flat by about 30 cents; they're corrected, and the result is exported next to the original.",
                "在 TuneStudio 里打开了你最新的一条录音。副歌有三个音偏低了大约 30 音分，已经修正，导出的文件放在原文件旁边。",
            ),
        };
    }
    if (/^(hi|hello|hey)\b|你好|嗨/.test(p)) {
        return {
            role: "assistant",
            text: say(
                "Hi! I run entirely on this Mac. Ask me about your notes in Cellar or something to watch in Arthub.",
                "你好！我完全运行在这台 Mac 上。可以问我 Cellar 里的笔记，或者让我从 Arthub 里挑部电影。",
            ),
        };
    }
    return {
        role: "assistant",
        text: say(
            "This window is a preview on the website, so my answers here are prepared in advance. Try asking about your **notes in Cellar** or **a movie in Arthub** — or download ModelCraft to talk with a model running on your own Mac.",
            "这个窗口是网页上的演示，这里的回答是预先准备好的。可以试试问我 **Cellar 里的笔记**，或者让我从 **Arthub 里挑部电影**。下载 ModelCraft，就能和在你自己 Mac 上运行的模型真正对话。",
        ),
    };
}

/** Prompts offered under an empty New Chat. */
export const SUGGESTIONS = [
    "Summarize the notes I edited today in Cellar",
    "Pick a movie for tonight from Arthub",
    "Check my Redis server with Keel",
];
