import type { SymbolName } from "~/components/sf-symbol";

// The demo's conversations: what each prompt makes the model do (tool calls, the way the app records
// them) and what it answers. Typed prompts are matched to a scenario by keywords; replies follow the
// language of the prompt, while tool calls keep the app's English, as the screenshots do.

export type ConnectorId = "arthub" | "cellar" | "keel" | "tunestudio";
export const CONNECTOR_NAME: Record<ConnectorId, string> = { arthub: "Arthub", cellar: "Cellar", keel: "Keel", tunestudio: "TuneStudio" };

/** One tool call. Connectors and the Mac's own apps count as "using an app" in the group's title. */
export type Tool =
    | { kind: "connector"; app: ConnectorId; name: string; args: string; result: string }
    | { kind: "native"; app: string; icon: SymbolName; running: string; done: string; card: [string, string][] }
    | { kind: "command"; command: string; output: string }
    | { kind: "fetch"; url: string; title: string; excerpt: string }
    | { kind: "file"; name: string; card: [string, string][] };

export type Message = { role: "user" | "assistant"; text: string; tools?: Tool[] };
export type Chat = { id: string; title: string; messages: Message[] };

type Scenario = {
    id: string;
    title: string;
    prompt: string;
    match: RegExp;
    tools: Tool[];
    reply: [en: string, zh: string];
};

const json = (value: unknown) => JSON.stringify(value, null, 2);

const SCENARIOS: Scenario[] = [
    {
        id: "release-notes", title: "Release Notes from GitHub",
        prompt: "Read the latest ModelCraft release on GitHub and save the release notes as a page in Cellar.",
        match: /github|release|changelog|发布|更新日志|版本/,
        tools: [
            {
                kind: "fetch", url: "https://github.com/zhang-hongshen/ModelCraft/releases/latest", title: "Release 0.9.0 · zhang-hongshen/ModelCraft",
                excerpt: "• Scheduled tasks run prompts every day or week\n• Connectors for Keel and TuneStudio\n• Long conversations stay fast with context compaction\n• Fixed: model downloads resuming from zero",
            },
            {
                kind: "connector", app: "cellar", name: "create_page",
                args: json({ title: "ModelCraft 0.9.0 release notes", parent: "Projects", blocks: 9 }),
                result: json({ id: "p_81f2", url: "cellar://page/p_81f2", created: true }),
            },
        ],
        reply: [
            "Saved **ModelCraft 0.9.0 release notes** under Projects in Cellar. The release has three headline changes:\n- **Scheduled tasks** that run a prompt every day or week\n- **Connectors** for Keel and TuneStudio\n- **Faster long conversations** thanks to context compaction\nIt also fixes downloads that restarted from zero after a pause.",
            "已经在 Cellar 的 Projects 下面保存了 **ModelCraft 0.9.0 发布说明**。这个版本主要有三点：\n- **定时任务**：每天或每周自动运行一个提示\n- 新增 Keel 和 TuneStudio 的 **连接器**\n- 上下文压缩让 **长对话更快**\n另外修复了暂停后下载从头开始的问题。",
        ],
    },
    {
        id: "tune-chorus", title: "Tune the Chorus Take",
        prompt: "Tune the chorus in ~/Music/Takes/chorus-take-3.wav with TuneStudio and keep the original.",
        match: /tunestudio|pitch|vocal|sing|chorus|音准|人声|唱|副歌/,
        tools: [
            { kind: "file", name: "chorus-take-3.wav", card: [["Duration", "3:42"], ["Format", "WAV · 48 kHz · mono"], ["Size", "21.3 MB"]] },
            {
                kind: "connector", app: "tunestudio", name: "correct_pitch",
                args: json({ file: "~/Music/Takes/chorus-take-3.wav", key: "A minor", strength: 0.7, keep_original: true }),
                result: json({ notes_corrected: 3, largest_shift_cents: -31, output: "~/Music/Takes/chorus-take-3 (tuned).wav" }),
            },
        ],
        reply: [
            "Done. Three notes in the chorus were flat by up to 31 cents; TuneStudio pulled them onto A minor at 70% strength so the voice still sounds natural. The tuned take is **chorus-take-3 (tuned).wav**, next to the original.",
            "好了。副歌里有三个音最多偏低 31 音分，TuneStudio 以 70% 的强度把它们拉回 A 小调，听起来仍然自然。修正后的文件是 **chorus-take-3 (tuned).wav**，就放在原文件旁边。",
        ],
    },
    {
        id: "playlist", title: "Sunday Morning Playlist",
        prompt: "Pick ten songs from my Arthub library for a slow Sunday morning and put them in order.",
        match: /song|music|playlist|album|音乐|歌|歌单|专辑/,
        tools: [
            {
                kind: "connector", app: "arthub", name: "search_library",
                args: json({ kind: "music", mood: ["calm", "acoustic"], limit: 40 }),
                result: json({ matches: 37, top: ["Nick Drake — Pink Moon", "Norah Jones — Don't Know Why", "Bill Evans — Peace Piece"] }),
            },
        ],
        reply: [
            "Here's a slow start, getting a little warmer as it goes:\n1. Bill Evans — Peace Piece\n2. Nick Drake — Pink Moon\n3. Norah Jones — Don't Know Why\n4. José González — Heartbeats\n5. Bon Iver — Holocene\n6. Feist — Mushaboom\n7. Jack Johnson — Banana Pancakes\n8. Corinne Bailey Rae — Put Your Records On\n9. The Staves — Facing West\n10. Iron & Wine — Naked As We Came",
            "从很安静开始，慢慢变得温暖一些：\n1. Bill Evans — Peace Piece\n2. Nick Drake — Pink Moon\n3. Norah Jones — Don't Know Why\n4. José González — Heartbeats\n5. Bon Iver — Holocene\n6. Feist — Mushaboom\n7. Jack Johnson — Banana Pancakes\n8. Corinne Bailey Rae — Put Your Records On\n9. The Staves — Facing West\n10. Iron & Wine — Naked As We Came",
        ],
    },
    {
        id: "movie-night", title: "Friday Movie Night",
        prompt: "Find a comedy in Arthub I haven't watched in a while, put it on my calendar for Friday at 8 pm, and draft an invite to Leo and Priya.",
        match: /arthub|movie|film|watch|cinema|电影|影片|看片/,
        tools: [
            {
                kind: "connector", app: "arthub", name: "search_library",
                args: json({ kind: "movie", genre: "comedy", not_watched_in_days: 180 }),
                result: json({ matches: [{ title: "Paddington 2", year: 2017, runtime: "1h 43m", last_watched: "2025-03-14" }, { title: "The Grand Budapest Hotel", year: 2014, runtime: "1h 39m", last_watched: "2024-12-02" }] }),
            },
            { kind: "native", app: "Calendar", icon: "calendar", running: "Updating Calendar", done: "Updated Calendar", card: [["Event", "Movie Night: Paddington 2"], ["When", "Fri, 30 Oct · 20:00 – 21:45"], ["Calendar", "Home"]] },
            { kind: "native", app: "Mail", icon: "envelope", running: "Creating Mail draft", done: "Created Mail draft", card: [["To", "leo@lumen.app, priya@lumen.app"], ["Subject", "Movie night on Friday?"], ["Body", "Paddington 2 at mine, 8 pm. Snacks on me!"]] },
        ],
        reply: [
            "Friday's set: **Paddington 2 (2017)** — you last watched it in March 2025, and it's an easy, warm pick for the end of the week.\n- Added **Movie Night** to your Home calendar, Friday 20:00 – 21:45\n- Drafted an invite to Leo and Priya in Mail; it's waiting in Drafts for you to send",
            "周五安排好了：**《帕丁顿熊 2》(2017)**，你上次看是 2025 年 3 月，轻松又温暖，适合一周的结尾。\n- 已在「家庭」日历添加 **电影之夜**，周五 20:00 – 21:45\n- 在邮件里给 Leo 和思雨写好了邀请草稿，放在草稿箱等你发送",
        ],
    },
    {
        id: "slow-api", title: "Why Is the API Slow?",
        prompt: "The API feels slow this morning. Check Redis with Keel and tell me what's going on.",
        match: /keel|redis|slow|latency|api|慢|延迟|卡/,
        tools: [
            {
                kind: "connector", app: "keel", name: "slowlog_get",
                args: json({ count: 3 }),
                result: json([{ id: 31, duration_ms: 18.4, command: "KEYS session:*" }, { id: 30, duration_ms: 12.1, command: "HGETALL config:feature_flags" }, { id: 29, duration_ms: 10.7, command: "LRANGE queue:thumbnails 0 -1" }]),
            },
            {
                kind: "connector", app: "keel", name: "info",
                args: json({ section: "memory" }),
                result: json({ used_memory_human: "18.42M", mem_fragmentation_ratio: 1.08, evicted_keys: 0 }),
            },
            { kind: "command", command: 'grep -rn "keys(" ~/Code/lumen-api/src', output: "src/sessions.ts:42:  const ids = await redis.keys(\"session:*\")\nsrc/admin/stats.ts:17:  const total = (await redis.keys(\"user:*\")).length" },
        ],
        reply: [
            "Redis itself is healthy — 18 MB used, no evictions — but the slow log points at one command: `KEYS session:*` took 18 ms and blocks the server while it runs. It comes from two places in lumen-api:\n- `src/sessions.ts:42` lists sessions with `KEYS session:*`\n- `src/admin/stats.ts:17` counts users with `KEYS user:*`\nSwitching both to `SCAN` with a `MATCH` pattern (or keeping a counter) should make the morning slowdown go away.",
            "Redis 本身没问题，内存只用了 18 MB，也没有淘汰。但慢日志指向一条命令：`KEYS session:*` 耗时 18 毫秒，执行时会阻塞整个服务器。它出现在 lumen-api 的两个地方：\n- `src/sessions.ts:42` 用 `KEYS session:*` 列出会话\n- `src/admin/stats.ts:17` 用 `KEYS user:*` 统计用户数\n把这两处改成带 `MATCH` 的 `SCAN`（或者单独维护一个计数），早上的卡顿应该就会消失。",
        ],
    },
    {
        id: "weekly-sync", title: "Weekly Sync Schedule Change",
        prompt: "The weekly sync moves from Tuesday to Thursday at 10:00. Update my calendar and tell me what's on the agenda in Cellar.",
        match: /meeting|sync|agenda|calendar|schedule|会议|日程|例会/,
        tools: [
            { kind: "native", app: "Calendar", icon: "calendar", running: "Reading Calendar", done: "Read Calendar", card: [["Found", "Weekly Sync · every Tuesday 10:00 – 10:30"]] },
            { kind: "native", app: "Calendar", icon: "calendar", running: "Updating Calendar", done: "Updated Calendar", card: [["Event", "Weekly Sync"], ["When", "Every Thursday · 10:00 – 10:30"]] },
            {
                kind: "connector", app: "cellar", name: "search_pages",
                args: json({ database: "Meeting notes", sort: "newest", limit: 1 }),
                result: json({ title: "Weekly sync — 29 Oct", agenda: ["Preset pricing", "iPad layout review", "Beta 3 feedback"] }),
            },
        ],
        reply: [
            "Moved **Weekly Sync** to Thursdays, 10:00 – 10:30, starting this week. The latest page in Meeting notes has three items:\n1. Preset pricing — decide between $2.99 and $4.99\n2. iPad layout review with Priya\n3. Beta 3 feedback from TestFlight",
            "已经把 **每周例会** 改到每周四 10:00 – 10:30，本周开始生效。会议记录里最新一页有三项议程：\n1. 预设定价：在 2.99 和 4.99 美元之间做决定\n2. 和思雨过一遍 iPad 布局\n3. TestFlight 上 Beta 3 的反馈",
        ],
    },
    {
        id: "daily-notes", title: "Daily Notes Digest",
        prompt: "Search Cellar for the notes I created or edited today and summarize them in a few bullet points. List any open to-dos at the end.",
        match: /cellar|note|to-?do|page|笔记|待办|页面|总结/,
        tools: [
            {
                kind: "connector", app: "cellar", name: "search_pages",
                args: json({ edited: "today" }),
                result: json([{ title: "Lumen 2.0 launch plan", edited: "09:42" }, { title: "Sync engine design", edited: "11:15" }, { title: "Kyoto trip", edited: "16:03" }]),
            },
            {
                kind: "connector", app: "cellar", name: "read_page",
                args: json({ title: "Lumen 2.0 launch plan" }),
                result: json({ blocks: 38, open_todos: ["Decide on preset pricing before Thursday"] }),
            },
            { kind: "native", app: "Reminders", icon: "checklist", running: "Reading Reminders", done: "Read Reminders", card: [["List", "Personal"], ["Due today", "Book the ryokan for the Kyoto trip"]] },
        ],
        reply: [
            "Here's what changed in Cellar today:\n- **Lumen 2.0 launch plan** — the goal is now 1,000 paid presets by the end of Q1, and Pencil masking moves to 2.1 if it slips.\n- **Sync engine design** — added a diagram of the merge flow and notes on conflict handling.\n- **Kyoto trip** — a day-by-day table and a shortlist of three ryokans.\n**Open to-dos**\n1. Decide on preset pricing before Thursday\n2. Book the ryokan for the Kyoto trip (also due today in Reminders)\n3. Finish Klara and the Sun",
            "这是 Cellar 里今天改过的内容：\n- **Lumen 2.0 发布计划** —— 目标改为 Q1 结束前上架 1,000 个付费预设，Pencil 蒙版来不及就放到 2.1。\n- **同步引擎设计** —— 加了合并流程图和冲突处理的说明。\n- **京都旅行** —— 按天排好的行程表，还选好了三家旅馆。\n**未完成的待办**\n1. 周四前定下预设的价格\n2. 预订京都旅行的旅馆（提醒事项里也是今天到期）\n3. 读完《克拉拉与太阳》",
        ],
    },
];

const chatOf = (s: Scenario): Chat => ({ id: s.id, title: s.title, messages: [{ role: "user", text: s.prompt }, { role: "assistant", text: s.reply[0], tools: s.tools }] });

/** The Recents the window opens with, newest first. */
export const CHATS: Chat[] = ["daily-notes", "movie-night", "slow-api", "release-notes", "weekly-sync"].map((id) => chatOf(SCENARIOS.find((s) => s.id === id)!));

/** Prompts offered under an empty New Chat. */
export const SUGGESTIONS = [
    "Summarize the notes I edited today in Cellar",
    "Pick a movie for tonight from Arthub",
    "Check my Redis server with Keel",
];

/** General answers, in English and Chinese, for prompts no scenario covers. */
const GENERAL: [string, string][] = [
    [
        "Good question. Here's how I'd think it through:\n1. Start with what you already know and what you actually need to decide.\n2. Break it into two or three smaller questions and answer those first.\n3. Write down the trade-offs, then pick the option you'd regret least.\nWant me to go deeper on any of these?",
        "好问题。我会这样想：\n1. 先理清你已经知道什么，真正要决定的是什么。\n2. 把它拆成两三个小问题，先逐个回答。\n3. 把各个选择的利弊写下来，选一个最不容易后悔的。\n要我展开讲其中哪一点吗？",
    ],
    [
        "Here's the short answer, then the details:\n- **In short:** it depends on how much time you have and what matters most to you.\n- **If you're short on time:** go with the simplest option that works today.\n- **If you can wait:** try two options side by side and compare.\nTell me a bit more and I'll make it specific.",
        "先说结论，再说细节：\n- **简单说：** 取决于你有多少时间，以及你最看重什么。\n- **时间紧：** 先选今天就能用的最简单的方案。\n- **不着急：** 拿两个方案并排试一试再比较。\n多告诉我一点情况，我可以说得更具体。",
    ],
    [
        "Sure. A few things that might help:\n- Everything I do here stays on this Mac; nothing is sent anywhere.\n- I can look things up in your connected apps, like **Cellar** and **Arthub**, when that helps.\n- Longer jobs can run on their own as **Scheduled Tasks**.\nWhere would you like to start?",
        "好的。有几点可能用得上：\n- 我在这里做的一切都只在这台 Mac 上，不会发到任何地方。\n- 需要的时候，我可以去你连接的应用里查，比如 **Cellar** 和 **Arthub**。\n- 耗时的事情可以设成 **定时任务** 自己运行。\n你想从哪里开始？",
    ],
];

const CJK = /[㐀-鿿]/;

/** The scripted answer to a prompt: its scenario's tool calls and reply, or why a connector is missing. */
export function replyTo(prompt: string, installed: Record<string, boolean>): Message {
    const zh = CJK.test(prompt);
    const p = prompt.toLowerCase();
    if (/^(hi|hello|hey)\b|你好|嗨/.test(p)) {
        return { role: "assistant", text: zh ? "你好！我完全运行在这台 Mac 上。可以问我 Cellar 里的笔记，或者让我从 Arthub 里挑部电影。" : "Hi! I run entirely on this Mac. Ask me about your notes in Cellar or something to watch in Arthub." };
    }
    const scenario = SCENARIOS.find((s) => s.match.test(p));
    if (!scenario) {
        const general = GENERAL[[...prompt].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % GENERAL.length];
        return { role: "assistant", text: zh ? general[1] : general[0] };
    }
    const missing = scenario.tools.find((t) => t.kind === "connector" && !installed[CONNECTOR_NAME[t.app]]);
    if (missing && missing.kind === "connector") {
        const name = CONNECTOR_NAME[missing.app];
        return { role: "assistant", text: zh ? `${name} 还没有连接。先在 **Connectors** 里安装它，再问我一次。` : `${name} isn't connected yet. Install it in **Connectors**, then ask me again.` };
    }
    return { role: "assistant", text: zh ? scenario.reply[1] : scenario.reply[0], tools: scenario.tools };
}

/** How a tool call reads in its row, while it runs and once it's done (ToolCall.localizedDescription). */
export function toolLabel(tool: Tool, running: boolean): string {
    switch (tool.kind) {
        case "connector": return `${running ? "Using" : "Used"} ${CONNECTOR_NAME[tool.app]}`;
        case "native": return running ? tool.running : tool.done;
        case "command": return running ? "Running a command" : "Ran a command";
        case "fetch": return `${running ? "Fetching" : "Fetched"} ${new URL(tool.url).hostname}`;
        case "file": return `${running ? "Reading" : "Read"} ${tool.name}`;
    }
}

/** A finished group's title: one phrase per kind of work, in the order it first happened (ToolCallGroupSummary). */
export function groupTitle(tools: Tool[]): string {
    const order: string[] = [];
    const seen = new Map<string, Set<string>>();
    for (const t of tools) {
        const [activity, occurrence] =
            t.kind === "connector" ? ["app", t.app] : t.kind === "native" ? ["app", t.app] : t.kind === "command" ? ["command", t.command] : t.kind === "fetch" ? ["fetch", t.url] : ["file", t.name];
        if (!seen.has(activity)) { order.push(activity); seen.set(activity, new Set()); }
        seen.get(activity)!.add(occurrence);
    }
    const phrase: Record<string, [string, string]> = {
        app: ["Used an app", "Used apps"], command: ["Ran a command", "Ran commands"], fetch: ["Fetched a web page", "Fetched web pages"], file: ["Read a file", "Read files"],
    };
    const parts = order.map((a, i) => {
        const text = phrase[a][seen.get(a)!.size > 1 ? 1 : 0];
        return i === 0 ? text : text[0].toLowerCase() + text.slice(1);
    });
    return new Intl.ListFormat("en", { type: "conjunction" }).format(parts);
}
