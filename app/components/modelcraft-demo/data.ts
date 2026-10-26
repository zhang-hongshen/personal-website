// Content of the ModelCraft demo: the Model Store's models, the connectors and the scheduled tasks it
// starts with. The conversations are in conversations.ts.

import type { L } from "~/components/demo-text";

export type View = "chat" | "store" | "downloaded" | "connectors" | "tasks";

/** The Model Store's tabs, as the app names them. */
export type Category = "Text" | "Vision" | "Omni";
export const CATEGORY_NAME: Record<Category, L> = { Text: ["Text", "文本", "文字"], Vision: ["Vision", "视觉", "視覺"], Omni: ["Omni", "全模态", "全模態"] };
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
export const CONNECTORS: { id: string; name: string; summary: L; installed: boolean }[] = [
    { id: "arthub", name: "Arthub", summary: ["Browse and play the movies, TV shows, and music in your media library.", "浏览并播放媒体库里的电影、电视剧和音乐。", "瀏覽並播放媒體庫裡的電影、電視節目和音樂。"], installed: true },
    { id: "cellar", name: "Cellar", summary: ["Search the pages, databases, and notes in your knowledge base.", "搜索知识库里的页面、数据库和笔记。", "搜尋知識庫裡的頁面、資料庫和筆記。"], installed: true },
    { id: "container", name: "Container", summary: ["Start, stop, and inspect the Linux containers on your Mac.", "启动、停止和查看 Mac 上的 Linux 容器。", "啟動、停止和檢查 Mac 上的 Linux 容器。"], installed: true },
    { id: "keel", name: "Keel", summary: ["Browse and edit the keys in your Redis databases.", "浏览和编辑 Redis 数据库里的 Key。", "瀏覽和編輯 Redis 資料庫裡的 Key。"], installed: true },
    { id: "quaero", name: "Quaero", summary: ["Query your SQL and vector databases and read the results.", "查询 SQL 和向量数据库，并读取结果。", "查詢 SQL 和向量資料庫，並讀取結果。"], installed: true },
    { id: "pinch", name: "Pinch", summary: ["Weigh light objects on your trackpad.", "在触控板上称轻小物件。", "在軌跡板上秤輕小物件。"], installed: false },
    { id: "tunestudio", name: "TuneStudio", summary: ["Put sung vocals on pitch and export the corrected audio.", "把人声修到准确音高，并导出修正后的音频。", "把人聲修到準確音高，並輸出修正後的音訊。"], installed: false },
];

export type Task = { id: string; title: L; schedule: L; prompt: L; next: L; enabled: boolean };

export const TASKS: Task[] = [
    {
        id: "weekly-review", title: ["Weekly Knowledge Review", "每周知识回顾", "每週知識回顧"],
        schedule: ["Every week on Sunday at 18:00", "每周日 18:00", "每週日 18:00"],
        prompt: [
            "Review the pages I added to Cellar this week, group them by topic, and suggest three worth revisiting next week.",
            "回顾我这周在 Cellar 里添加的页面，按主题分组，再推荐三个下周值得重读的。",
            "回顧我這週在 Cellar 裡加入的頁面，按主題分組，再推薦三個下週值得重讀的。",
        ],
        next: ["Next run Sunday, 25 Oct at 18:00", "下次运行：10月25日 周日 18:00", "下次執行：10月25日 週日 18:00"], enabled: true,
    },
    {
        id: "movie-pick", title: ["Friday Movie Pick", "周五选片", "週五選片"],
        schedule: ["Every week on Friday at 18:00", "每周五 18:00", "每週五 18:00"],
        prompt: [
            "Pick one movie from my Arthub library that I haven't watched recently and explain in two sentences why it suits a Friday night.",
            "从我的 Arthub 资料库里挑一部最近没看过的电影，用两句话说说为什么适合周五晚上。",
            "從我的 Arthub 媒體庫裡挑一部最近沒看過的電影，用兩句話說說為什麼適合週五晚上。",
        ],
        next: ["Next run Friday, 30 Oct at 18:00", "下次运行：10月30日 周五 18:00", "下次執行：10月30日 週五 18:00"], enabled: true,
    },
    {
        id: "daily-notes", title: ["Daily Notes Digest", "每日笔记摘要", "每日筆記摘要"],
        schedule: ["Every day at 18:00", "每天 18:00", "每天 18:00"],
        prompt: [
            "Search Cellar for the notes I created or edited today and summarize them in a few bullet points. List any open to-dos at the end.",
            "在 Cellar 里搜索我今天新建或编辑过的笔记，用几条要点总结一下，最后列出还没完成的待办。",
            "在 Cellar 裡搜尋我今天新增或編輯過的筆記，用幾條重點總結一下，最後列出還沒完成的待辦事項。",
        ],
        next: ["Next run Sunday, 25 Oct at 18:00", "下次运行：10月25日 周日 18:00", "下次執行：10月25日 週日 18:00"], enabled: true,
    },
];

/** What the "+" in Scheduled Tasks adds, one at a time, in place of the app's New Task sheet. */
export const PRESET_TASKS: Task[] = [
    {
        id: "sales-report", title: ["Weekly Top Customers", "每周大客户", "每週大客戶"],
        schedule: ["Every week on Monday at 09:00", "每周一 09:00", "每週一 09:00"],
        prompt: [
            "Use Quaero to find our top customers by revenue, save the table as a page in Cellar, and draft a thank-you email to them.",
            "用 Quaero 找出营收最高的客户，把表格存成 Cellar 里的一个页面，再给他们起草一封感谢信。",
            "用 Quaero 找出營收最高的客戶，把表格存成 Cellar 裡的一個頁面，再給他們草擬一封感謝信。",
        ],
        next: ["Next run Monday, 26 Oct at 09:00", "下次运行：10月26日 周一 09:00", "下次執行：10月26日 週一 09:00"], enabled: true,
    },
    {
        id: "morning-brief", title: ["Morning Brief", "晨间简报", "晨間簡報"],
        schedule: ["Every weekday at 08:30", "每个工作日 08:30", "每個工作日 08:30"],
        prompt: [
            "List the to-dos due today in Cellar and the meetings on my agenda page, most urgent first.",
            "列出 Cellar 里今天到期的待办和议程页面上的会议，最紧急的排在前面。",
            "列出 Cellar 裡今天到期的待辦事項和議程頁面上的會議，最緊急的排在前面。",
        ],
        next: ["Next run Monday, 26 Oct at 08:30", "下次运行：10月26日 周一 08:30", "下次執行：10月26日 週一 08:30"], enabled: true,
    },
    {
        id: "redis-check", title: ["Redis Health Check", "Redis 健康检查", "Redis 健康檢查"],
        schedule: ["Every day at 09:00", "每天 09:00", "每天 09:00"],
        prompt: [
            "Use Keel to look at my local Redis server and tell me about any keys that grew a lot since yesterday.",
            "用 Keel 看看我本地的 Redis 服务器，告诉我从昨天到现在有哪些 Key 涨得很多。",
            "用 Keel 看看我本機的 Redis 伺服器，告訴我從昨天到現在有哪些 Key 成長很多。",
        ],
        next: ["Next run Monday, 26 Oct at 09:00", "下次运行：10月26日 周一 09:00", "下次執行：10月26日 週一 09:00"], enabled: true,
    },
    {
        id: "music-mix", title: ["Sunday Music Mix", "周日音乐精选", "週日音樂精選"],
        schedule: ["Every week on Sunday at 10:00", "每周日 10:00", "每週日 10:00"],
        prompt: [
            "Pick ten songs from my Arthub library for a slow Sunday morning and put them in order.",
            "从我的 Arthub 资料库里挑十首适合慢悠悠周日早晨的歌，排好顺序。",
            "從我的 Arthub 媒體庫裡挑十首適合慢悠悠週日早晨的歌，排好順序。",
        ],
        next: ["Next run Sunday, 1 Nov at 10:00", "下次运行：11月1日 周日 10:00", "下次執行：11月1日 週日 10:00"], enabled: true,
    },
];
