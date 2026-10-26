// Content of the ModelCraft demo: the Model Store's models, the connectors and the scheduled tasks it
// starts with. The conversations are in conversations.ts.

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
    { id: "container", name: "Container", summary: "Start, stop, and inspect the Linux containers on your Mac.", installed: true },
    { id: "keel", name: "Keel", summary: "Browse and edit the keys in your Redis databases.", installed: true },
    { id: "quaero", name: "Quaero", summary: "Query your SQL and vector databases and read the results.", installed: true },
    { id: "pinch", name: "Pinch", summary: "Weigh light objects on your trackpad.", installed: false },
    { id: "tunestudio", name: "TuneStudio", summary: "Put sung vocals on pitch and export the corrected audio.", installed: false },
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
        id: "sales-report", title: "Weekly Top Customers", schedule: "Every week on Monday at 09:00",
        prompt: "Use Quaero to find our top customers by revenue, save the table as a page in Cellar, and draft a thank-you email to them.",
        next: "Next run Monday, 26 Oct at 09:00", enabled: true,
    },
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
