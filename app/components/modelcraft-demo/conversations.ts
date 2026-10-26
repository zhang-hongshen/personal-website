import { locale, pick, type L, type Lang, type Text } from "~/components/demo-text";
import type { SymbolName } from "~/components/sf-symbol";

// The demo's conversations: what each prompt makes the model do (tool calls, the way the app records
// them) and what it answers. Typed prompts are matched to a scenario by keywords; replies follow the
// language of the prompt. Tool requests and results stay as the apps sent them.

export type ConnectorId = "arthub" | "cellar" | "container" | "keel" | "quaero";
export const CONNECTOR_NAME: Record<ConnectorId, string> = {
    arthub: "Arthub", cellar: "Cellar", container: "Container", keel: "Keel", quaero: "Quaero",
};

/** The Mac's own apps a reply can use. */
export type NativeApp = "Mail" | "Reminders" | "Calendar";
export const NATIVE_NAME: Record<NativeApp, L> = {
    Mail: ["Mail", "邮件", "郵件"], Reminders: ["Reminders", "提醒事项", "提醒事項"], Calendar: ["Calendar", "日历", "行事曆"],
};

/** A card's rows: a label and its value. */
type Card = [L, L | string][];

/** One tool call. Connectors and the Mac's own apps count as "using an app" in the group's title. */
export type Tool =
    | { kind: "connector"; app: ConnectorId; name: string; args: string; result: string }
    | { kind: "native"; app: NativeApp; icon: SymbolName; running: L; done: L; card: Card }
    | { kind: "command"; command: string; output: string }
    | { kind: "fetch"; url: string; title: string; excerpt: string }
    | { kind: "file"; name: string; card: Card }
    | { kind: "edit"; path: string; diff: string }
    | { kind: "image"; prompt: string; art: Art; size: string; saved: string }
    | { kind: "video"; prompt: string; art: Art; size: string; seconds: number; saved: string };

/** The pictures the image and video tools make, drawn in media.tsx. */
export type Art = "night-city";

/** A file the visitor attached, with what the page could read from it without sending it anywhere. */
export type Attachment = {
    name: string;
    size: number;
    type: string;
    /** For an image: a URL of the file for showing it, and its size in pixels. */
    url?: string;
    width?: number;
    height?: number;
    /** For a text file: how long it is and its first line. */
    lines?: number;
    words?: number;
    first?: string;
};

/** Prepared text comes in every language; what the visitor types stays as typed. */
export type Message = { role: "user" | "assistant"; text: L | string; tools?: Tool[]; attachments?: Attachment[] };
export type Chat = { id: string; title: L | string; messages: Message[] };

type Scenario = {
    id: string;
    title: L;
    prompt: L;
    match: RegExp;
    tools: Tool[];
    reply: L;
};

const json = (value: unknown) => JSON.stringify(value, null, 2);

const MAIL_DRAFT = { running: ["Creating Mail draft", "正在创建邮件草稿", "正在建立郵件草稿"] as L, done: ["Created Mail draft", "已创建邮件草稿", "已建立郵件草稿"] as L };
const TO: L = ["To", "收件人", "收件人"];
const SUBJECT: L = ["Subject", "主题", "主旨"];
const BODY: L = ["Body", "正文", "內文"];
const EVENT: L = ["Event", "日程", "行程"];
const WHEN: L = ["When", "时间", "時間"];
const LIST: L = ["List", "列表", "列表"];
const PERSONAL: L = ["Personal", "个人", "個人"];
const UPDATE_CALENDAR = { running: ["Updating Calendar", "正在更新日历", "正在更新行事曆"] as L, done: ["Updated Calendar", "已更新日历", "已更新行事曆"] as L };

const SCENARIOS: Scenario[] = [
    {
        id: "fix-test", title: ["Fix the Failing Test", "修复失败的测试", "修正失敗的測試"],
        prompt: [
            "Run the tests in ~/Code/lumen-api and fix whatever fails.",
            "在 ~/Code/lumen-api 里跑一下测试，把失败的修好。",
            "在 ~/Code/lumen-api 裡跑一下測試，把失敗的修好。",
        ],
        match: /\btests?\b|\bfail|\bbugs?\b|\bfix|测试|修复|修好|測試|修正|錯誤|错误/,
        tools: [
            {
                kind: "command", command: "cd ~/Code/lumen-api && npm test",
                output: " PASS  src/sessions.test.ts\n FAIL  src/pricing.test.ts\n  ● presetPrice › applies the bundle discount once\n\n    Expected: 15.98\n    Received: 11.98\n\n      at src/pricing.test.ts:27:44\n\nTests:  1 failed, 23 passed, 24 total",
            },
            {
                kind: "edit", path: "~/Code/lumen-api/src/pricing.ts",
                diff: "@@ -18,7 +18,7 @@ export function presetPrice(items: Preset[], bundle: boolean) {\n   const subtotal = items.reduce((sum, p) => sum + p.price, 0);\n-  const discount = bundle ? items.length * 4 : 0;\n+  const discount = bundle ? 4 : 0;\n   return Math.max(0, subtotal - discount);\n }",
            },
            { kind: "command", command: "npm test", output: " PASS  src/sessions.test.ts\n PASS  src/pricing.test.ts\n\nTests:  24 passed, 24 total\nTime:   1.84 s" },
        ],
        reply: [
            "One test was failing: **presetPrice › applies the bundle discount once**. The bundle discount was taken once per preset (`items.length * 4`) rather than once per order, so two $9.99 presets came to $11.98 instead of $15.98.\n- Changed it to a flat $4 in `src/pricing.ts`\n- Ran the suite again: all 24 tests pass",
            "有一个测试没过：**presetPrice › applies the bundle discount once**。套装折扣按预设个数扣了多次（`items.length * 4`），而不是每单扣一次，所以两个 $9.99 的预设算成了 $11.98，应该是 $15.98。\n- 已在 `src/pricing.ts` 里改成固定减 $4\n- 重新跑了一遍：24 个测试全部通过",
            "有一個測試沒過：**presetPrice › applies the bundle discount once**。套裝折扣按預設個數扣了多次（`items.length * 4`），而不是每筆訂單扣一次，所以兩個 $9.99 的預設算成了 $11.98，應該是 $15.98。\n- 已在 `src/pricing.ts` 裡改成固定減 $4\n- 重新跑了一遍：24 個測試全部通過",
        ],
    },
    {
        id: "night-city-video", title: ["Night City Loop", "Night City 循环视频", "Night City 循環影片"],
        prompt: [
            "Turn the Night City cover into a 6-second looping video for the store page.",
            "把 Night City 的封面做成一段 6 秒的循环视频，放在商店页面上。",
            "把 Night City 的封面做成一段 6 秒的循環影片，放在商店頁面上。",
        ],
        match: /\bvideo|\banimat|\bclip\b|\bloop|视频|动画|動畫|影片/,
        tools: [
            {
                kind: "video", art: "night-city", size: "1080 × 1080", seconds: 6, saved: "~/Movies/ModelCraft/night-city-loop.mp4",
                prompt: "The Night City cover, slowly alive: rain falling, neon signs flickering, a car's lights passing on the wet street. Seamless 6-second loop.",
            },
        ],
        reply: [
            "Here's a 6-second loop of the cover: the rain keeps falling, the signs flicker and a car passes on the wet street, and the last frame meets the first so it loops cleanly. It's 1080 × 1080, saved as **night-city-loop.mp4** in Movies › ModelCraft.",
            "做好了一段 6 秒的循环视频：雨一直在下，招牌闪烁，一辆车从湿漉漉的街上驶过，最后一帧和第一帧接得上，可以无缝循环。尺寸 1080 × 1080，已保存为 影片 › ModelCraft 里的 **night-city-loop.mp4**。",
            "做好了一段 6 秒的循環影片：雨一直在下，招牌閃爍，一輛車從濕漉漉的街上駛過，最後一格和第一格接得上，可以無縫循環。尺寸 1080 × 1080，已儲存為 影片 › ModelCraft 裡的 **night-city-loop.mp4**。",
        ],
    },
    {
        id: "night-city-cover", title: ["Night City Cover", "Night City 封面", "Night City 封面"],
        prompt: [
            "Make a cover image for the Night City Looks preset: a rainy street at night, purple and teal neon.",
            "给 Night City Looks 预设做一张封面：雨夜的街道，紫色和青色的霓虹灯。",
            "幫 Night City Looks 預設做一張封面：雨夜的街道，紫色和青色的霓虹燈。",
        ],
        match: /\bimage|\bpicture|\bcover\b|\bposter|\bdraw\b|illustrat|图片|图像|封面|海报|画|圖片|圖像|海報|畫/,
        tools: [
            {
                kind: "image", art: "night-city", size: "1024 × 1024", saved: "~/Pictures/ModelCraft/night-city-cover.png",
                prompt: "A rain-soaked city street at night, purple and teal neon signs reflected on wet asphalt, tall buildings fading into mist, cinematic, square cover.",
            },
        ],
        reply: [
            "Here's a cover for **Night City Looks**: a rainy street with purple and teal neon reflected on the asphalt, square for the store. It's saved as **night-city-cover.png** in Pictures › ModelCraft. Want a version with the preset's name on it, or a short looping video of it?",
            "**Night City Looks** 的封面做好了：雨夜街道，紫色和青色的霓虹倒映在路面上，正方形适合商店。已保存为 图片 › ModelCraft 里的 **night-city-cover.png**。要不要加上预设名称，或者做成一段循环小视频？",
            "**Night City Looks** 的封面做好了：雨夜街道，紫色和青色的霓虹倒映在路面上，正方形適合商店。已儲存為 圖片 › ModelCraft 裡的 **night-city-cover.png**。要不要加上預設名稱，或者做成一段循環小影片？",
        ],
    },
    {
        id: "tidy-downloads", title: ["Tidy Up Downloads", "整理下载文件夹", "整理下載項目"],
        prompt: [
            "Tidy up my Downloads folder: put installers and documents into folders of their own.",
            "整理一下我的下载文件夹：把安装包和文档分别放进各自的文件夹。",
            "整理一下我的下載項目：把安裝檔和文件分別放進各自的檔案夾。",
        ],
        match: /\bdownloads\b|\btidy|clean ?up|organi[sz]e|整理|下载|下載/,
        tools: [
            { kind: "command", command: "ls ~/Downloads", output: "Klara and the Sun.epub\nKyoto ryokan booking.pdf\nModelCraft-0.9.0.dmg\nQuaero-1.0.dmg\ninvoice-1042.pdf\nScreenshot 2026-10-24 at 21.14.png" },
            { kind: "command", command: "cd ~/Downloads && mkdir -p Installers Documents && mv *.dmg Installers/ && mv *.pdf *.epub Documents/", output: "" },
            { kind: "command", command: "ls ~/Downloads ~/Downloads/*/", output: "Documents\nInstallers\nScreenshot 2026-10-24 at 21.14.png\n\n/Users/maya/Downloads/Documents/:\nKlara and the Sun.epub\nKyoto ryokan booking.pdf\ninvoice-1042.pdf\n\n/Users/maya/Downloads/Installers/:\nModelCraft-0.9.0.dmg\nQuaero-1.0.dmg" },
        ],
        reply: [
            "Downloads is tidy:\n- **Installers**: ModelCraft-0.9.0.dmg and Quaero-1.0.dmg\n- **Documents**: the ryokan booking, invoice 1042 and *Klara and the Sun*\nI left the screenshot where it was. Nothing was deleted, so the installers are there if you need them again.",
            "下载文件夹整理好了：\n- **Installers**：ModelCraft-0.9.0.dmg 和 Quaero-1.0.dmg\n- **Documents**：旅馆预订单、1042 号发票和《克拉拉与太阳》\n截图我留在了原处。没有删除任何文件，安装包需要时还在。",
            "下載項目整理好了：\n- **Installers**：ModelCraft-0.9.0.dmg 和 Quaero-1.0.dmg\n- **Documents**：旅館訂房單、1042 號發票和《克拉拉與太陽》\n截圖我留在原處。沒有刪除任何檔案，安裝檔需要時還在。",
        ],
    },
    {
        id: "dev-stack", title: ["Start the Dev Stack", "启动开发环境", "啟動開發環境"],
        prompt: [
            "Start the Lumen dev stack in Container and make sure Redis and Postgres are both answering.",
            "在 Container 里启动 Lumen 的开发环境，确认 Redis 和 Postgres 都能响应。",
            "在 Container 裡啟動 Lumen 的開發環境，確認 Redis 和 Postgres 都能回應。",
        ],
        match: /container|docker|dev stack|stack|容器|开发环境|開發環境/,
        tools: [
            {
                kind: "connector", app: "container", name: "list_containers",
                args: json({ all: true }),
                result: json([{ name: "web", image: "nginx:1.27", status: "running" }, { name: "db", image: "postgres:17", status: "running" }, { name: "cache", image: "redis:7.4", status: "stopped" }]),
            },
            {
                kind: "connector", app: "container", name: "start_container",
                args: json({ name: "cache" }),
                result: json({ name: "cache", status: "running", ports: ["6379:6379"], networks: ["backend"] }),
            },
            {
                kind: "connector", app: "keel", name: "ping",
                args: json({ connection: "localhost:6379" }),
                result: json({ reply: "PONG", latency_ms: 0.4, keys: 1284 }),
            },
            {
                kind: "connector", app: "quaero", name: "run_query",
                args: json({ connection: "shop", sql: "SELECT count(*) FROM orders;" }),
                result: json({ columns: ["count"], rows: [[12]], took_ms: 3 }),
            },
        ],
        reply: [
            "The stack is up. **web** and **db** were already running; **cache** (redis:7.4) was stopped, so I started it in Container.\n- **Redis** answers `PONG` in 0.4 ms and holds 1,284 keys (checked with Keel)\n- **Postgres** answers too: the shop database has 12 orders (checked with Quaero)\nThe API at localhost:8080 should be good to go.",
            "环境已经起来了。**web** 和 **db** 本来就在运行，**cache**（redis:7.4）是停着的，我在 Container 里把它启动了。\n- **Redis** 0.4 毫秒内返回 `PONG`，共有 1,284 个键（用 Keel 检查）\n- **Postgres** 也正常：shop 数据库里有 12 个订单（用 Quaero 检查）\nlocalhost:8080 上的 API 现在应该可以用了。",
            "環境已經起來了。**web** 和 **db** 本來就在執行，**cache**（redis:7.4）是停著的，我在 Container 裡把它啟動了。\n- **Redis** 0.4 毫秒內回傳 `PONG`，共有 1,284 個鍵（用 Keel 檢查）\n- **Postgres** 也正常：shop 資料庫裡有 12 筆訂單（用 Quaero 檢查）\nlocalhost:8080 上的 API 現在應該可以用了。",
        ],
    },
    {
        id: "top-customers", title: ["Top Customers Report", "大客户报表", "大客戶報表"],
        prompt: [
            "Use Quaero to find our top customers by revenue, save the table as a page in Cellar, and draft a thank-you email to them.",
            "用 Quaero 找出营收最高的客户，把表格存成 Cellar 里的一个页面，再给他们起草一封感谢信。",
            "用 Quaero 找出營收最高的客戶，把表格存成 Cellar 裡的一個頁面，再給他們草擬一封感謝信。",
        ],
        match: /quaero|sql|sales|customer|revenue|数据库|销售|客户|营收|資料庫|銷售|客戶|營收/,
        tools: [
            {
                kind: "connector", app: "quaero", name: "run_query",
                args: json({ connection: "shop", sql: "SELECT c.name, c.email, t.orders, t.revenue\nFROM order_totals t JOIN customers c ON c.id = t.customer_id\nORDER BY t.revenue DESC LIMIT 3;" }),
                result: json({ columns: ["name", "email", "orders", "revenue"], rows: [["Maya Chen", "maya@lumen.app", 2, 29.98], ["Priya Raman", "priya@lumen.app", 2, 24.98], ["Lucas Moreau", "lucas@example.com", 1, 19.99]] }),
            },
            {
                kind: "connector", app: "cellar", name: "create_page",
                args: json({ title: "Top customers — October", parent: "Lumen", blocks: [{ type: "table", rows: 3 }, { type: "paragraph" }] }),
                result: json({ id: "p_93c0", url: "cellar://page/p_93c0", created: true }),
            },
            {
                kind: "native", app: "Mail", icon: "envelope", ...MAIL_DRAFT,
                card: [
                    [TO, "maya@lumen.app, priya@lumen.app, lucas@example.com"],
                    [SUBJECT, ["Thank you from Lumen", "来自 Lumen 的感谢", "來自 Lumen 的感謝"]],
                    [BODY, [
                        "Thanks for being one of our best customers this year — here's 20% off your next preset pack.",
                        "感谢你成为我们今年最好的客户之一。下一套预设包可享 8 折优惠。",
                        "感謝你成為我們今年最好的客戶之一。下一套預設包可享 8 折優惠。",
                    ]],
                ],
            },
        ],
        reply: [
            "Your top three customers by paid revenue:\n1. **Maya Chen** — 2 orders, $29.98\n2. **Priya Raman** — 2 orders, $24.98\n3. **Lucas Moreau** — 1 order, $19.99\n- Saved the table as **Top customers — October** under Lumen in Cellar\n- Drafted a thank-you with a 20% code in Mail; it's in Drafts for you to check and send",
            "按已付款收入排，前三位客户是：\n1. **Maya Chen** —— 2 笔订单，$29.98\n2. **Priya Raman** —— 2 笔订单，$24.98\n3. **Lucas Moreau** —— 1 笔订单，$19.99\n- 已把这张表保存到 Cellar 的 Lumen 下，页面名为 **Top customers — October**\n- 在邮件里写好了一封附带 8 折优惠码的感谢信草稿，放在草稿箱等你确认后发送",
            "按已付款收入排，前三位客戶是：\n1. **Maya Chen** —— 2 筆訂單，$29.98\n2. **Priya Raman** —— 2 筆訂單，$24.98\n3. **Lucas Moreau** —— 1 筆訂單，$19.99\n- 已把這張表儲存到 Cellar 的 Lumen 下，頁面名為 **Top customers — October**\n- 在郵件裡寫好了一封附上 8 折優惠碼的感謝信草稿，放在草稿匣等你確認後寄出",
        ],
    },
    {
        id: "release-notes", title: ["Release Notes from GitHub", "GitHub 上的发布说明", "GitHub 上的發佈說明"],
        prompt: [
            "Read the latest ModelCraft release on GitHub and save the release notes as a page in Cellar.",
            "读一下 GitHub 上 ModelCraft 的最新版本，把发布说明存成 Cellar 里的一个页面。",
            "讀一下 GitHub 上 ModelCraft 的最新版本，把發佈說明存成 Cellar 裡的一個頁面。",
        ],
        match: /github|release|changelog|发布|更新日志|版本|發佈|發布|更新日誌/,
        tools: [
            {
                kind: "fetch", url: "https://github.com/zhang-hongshen/ModelCraft/releases/latest", title: "Release 0.9.0 · zhang-hongshen/ModelCraft",
                excerpt: "• Scheduled tasks run prompts every day or week\n• Connectors for Container and Quaero\n• Long conversations stay fast with context compaction\n• Fixed: model downloads resuming from zero",
            },
            {
                kind: "connector", app: "cellar", name: "create_page",
                args: json({ title: "ModelCraft 0.9.0 release notes", parent: "Projects", blocks: 9 }),
                result: json({ id: "p_81f2", url: "cellar://page/p_81f2", created: true }),
            },
        ],
        reply: [
            "Saved **ModelCraft 0.9.0 release notes** under Projects in Cellar. The release has three headline changes:\n- **Scheduled tasks** that run a prompt every day or week\n- **Connectors** for Container and Quaero\n- **Faster long conversations** thanks to context compaction\nIt also fixes downloads that restarted from zero after a pause.",
            "已经在 Cellar 的 Projects 下面保存了 **ModelCraft 0.9.0 发布说明**。这个版本主要有三点：\n- **定时任务**：每天或每周自动运行一个提示\n- 新增 Container 和 Quaero 的 **连接器**\n- 上下文压缩让 **长对话更快**\n另外修复了暂停后下载从头开始的问题。",
            "已經在 Cellar 的 Projects 下面儲存了 **ModelCraft 0.9.0 發佈說明**。這個版本主要有三點：\n- **排程任務**：每天或每週自動執行一個提示\n- 新增 Container 和 Quaero 的 **連接器**\n- 上下文壓縮讓 **長對話更快**\n另外修正了暫停後下載從頭開始的問題。",
        ],
    },
    {
        id: "playlist", title: ["Sunday Morning Playlist", "周日早晨歌单", "週日早晨歌單"],
        prompt: [
            "Pick ten songs from my Arthub library for a slow Sunday morning and put them in order.",
            "从我的 Arthub 资料库里挑十首适合慢悠悠周日早晨的歌，排好顺序。",
            "從我的 Arthub 媒體庫裡挑十首適合慢悠悠週日早晨的歌，排好順序。",
        ],
        match: /song|music|playlist|album|音乐|歌|歌单|专辑|音樂|歌單|專輯/,
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
            "從很安靜開始，慢慢變得溫暖一些：\n1. Bill Evans — Peace Piece\n2. Nick Drake — Pink Moon\n3. Norah Jones — Don't Know Why\n4. José González — Heartbeats\n5. Bon Iver — Holocene\n6. Feist — Mushaboom\n7. Jack Johnson — Banana Pancakes\n8. Corinne Bailey Rae — Put Your Records On\n9. The Staves — Facing West\n10. Iron & Wine — Naked As We Came",
        ],
    },
    {
        id: "movie-night", title: ["Friday Movie Night", "周五电影之夜", "週五電影之夜"],
        prompt: [
            "Find a comedy in Arthub I haven't watched in a while, put it on my calendar for Friday at 8 pm, and draft an invite to Leo and Priya.",
            "在 Arthub 里找一部我很久没看的喜剧，加到日历的周五晚上 8 点，再给 Leo 和思雨起草一封邀请。",
            "在 Arthub 裡找一部我很久沒看的喜劇，加到行事曆的週五晚上 8 點，再幫 Leo 和思雨草擬一封邀請。",
        ],
        match: /arthub|movie|film|watch|cinema|电影|影片|看片|電影/,
        tools: [
            {
                kind: "connector", app: "arthub", name: "search_library",
                args: json({ kind: "movie", genre: "comedy", not_watched_in_days: 180 }),
                result: json({ matches: [{ title: "Paddington 2", year: 2017, runtime: "1h 43m", last_watched: "2025-03-14" }, { title: "The Grand Budapest Hotel", year: 2014, runtime: "1h 39m", last_watched: "2024-12-02" }] }),
            },
            {
                kind: "native", app: "Calendar", icon: "calendar", ...UPDATE_CALENDAR,
                card: [
                    [EVENT, ["Movie Night: Paddington 2", "电影之夜：帕丁顿熊 2", "電影之夜：帕丁頓熊 2"]],
                    [WHEN, ["Fri, 30 Oct · 20:00 – 21:45", "10月30日 周五 · 20:00 – 21:45", "10月30日 週五 · 20:00 – 21:45"]],
                    [["Calendar", "日历", "行事曆"], ["Home", "家庭", "家庭"]],
                ],
            },
            {
                kind: "native", app: "Mail", icon: "envelope", ...MAIL_DRAFT,
                card: [
                    [TO, "leo@lumen.app, priya@lumen.app"],
                    [SUBJECT, ["Movie night on Friday?", "周五来看电影吗？", "週五來看電影嗎？"]],
                    [BODY, ["Paddington 2 at mine, 8 pm. Snacks on me!", "晚上 8 点来我家看《帕丁顿熊 2》，零食我包了！", "晚上 8 點來我家看《帕丁頓熊 2》，零食我包了！"]],
                ],
            },
        ],
        reply: [
            "Friday's set: **Paddington 2 (2017)** — you last watched it in March 2025, and it's an easy, warm pick for the end of the week.\n- Added **Movie Night** to your Home calendar, Friday 20:00 – 21:45\n- Drafted an invite to Leo and Priya in Mail; it's waiting in Drafts for you to send",
            "周五安排好了：**《帕丁顿熊 2》(2017)**，你上次看是 2025 年 3 月，轻松又温暖，适合一周的结尾。\n- 已在「家庭」日历添加 **电影之夜**，周五 20:00 – 21:45\n- 在邮件里给 Leo 和思雨写好了邀请草稿，放在草稿箱等你发送",
            "週五安排好了：**《帕丁頓熊 2》(2017)**，你上次看是 2025 年 3 月，輕鬆又溫暖，適合一週的結尾。\n- 已在「家庭」行事曆加入 **電影之夜**，週五 20:00 – 21:45\n- 在郵件裡幫 Leo 和思雨寫好了邀請草稿，放在草稿匣等你寄出",
        ],
    },
    {
        id: "slow-api", title: ["Why Is the API Slow?", "API 为什么慢？", "API 為什麼慢？"],
        prompt: [
            "The API feels slow this morning. Check Redis with Keel and tell me what's going on.",
            "今天早上 API 有点慢。用 Keel 查一下 Redis，告诉我是怎么回事。",
            "今天早上 API 有點慢。用 Keel 查一下 Redis，告訴我是怎麼回事。",
        ],
        match: /keel|redis|slow|latency|api|慢|延迟|卡|延遲/,
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
            "Redis 本身沒問題，記憶體只用了 18 MB，也沒有逐出。但慢查詢日誌指向一條指令：`KEYS session:*` 耗時 18 毫秒，執行時會阻塞整個伺服器。它出現在 lumen-api 的兩個地方：\n- `src/sessions.ts:42` 用 `KEYS session:*` 列出工作階段\n- `src/admin/stats.ts:17` 用 `KEYS user:*` 統計使用者數\n把這兩處改成帶 `MATCH` 的 `SCAN`（或者另外維護一個計數），早上的卡頓應該就會消失。",
        ],
    },
    {
        id: "weekly-sync", title: ["Weekly Sync Schedule Change", "每周例会改时间", "每週例會改時間"],
        prompt: [
            "The weekly sync moves from Tuesday to Thursday at 10:00. Update my calendar and tell me what's on the agenda in Cellar.",
            "每周例会从周二改到周四 10:00。帮我更新日历，再告诉我 Cellar 里的议程有哪些。",
            "每週例會從週二改到週四 10:00。幫我更新行事曆，再告訴我 Cellar 裡的議程有哪些。",
        ],
        match: /meeting|sync|agenda|calendar|schedule|会议|日程|例会|會議|例會|行事曆/,
        tools: [
            {
                kind: "native", app: "Calendar", icon: "calendar",
                running: ["Reading Calendar", "正在读取日历", "正在讀取行事曆"], done: ["Read Calendar", "已读取日历", "已讀取行事曆"],
                card: [[["Found", "找到", "找到"], ["Weekly Sync · every Tuesday 10:00 – 10:30", "每周例会 · 每周二 10:00 – 10:30", "每週例會 · 每週二 10:00 – 10:30"]]],
            },
            {
                kind: "native", app: "Calendar", icon: "calendar", ...UPDATE_CALENDAR,
                card: [[EVENT, ["Weekly Sync", "每周例会", "每週例會"]], [WHEN, ["Every Thursday · 10:00 – 10:30", "每周四 · 10:00 – 10:30", "每週四 · 10:00 – 10:30"]]],
            },
            {
                kind: "connector", app: "cellar", name: "search_pages",
                args: json({ database: "Meeting notes", sort: "newest", limit: 1 }),
                result: json({ title: "Weekly sync — 29 Oct", agenda: ["Preset pricing", "iPad layout review", "Beta 3 feedback"] }),
            },
        ],
        reply: [
            "Moved **Weekly Sync** to Thursdays, 10:00 – 10:30, starting this week. The latest page in Meeting notes has three items:\n1. Preset pricing — decide between $2.99 and $4.99\n2. iPad layout review with Priya\n3. Beta 3 feedback from TestFlight",
            "已经把 **每周例会** 改到每周四 10:00 – 10:30，本周开始生效。会议记录里最新一页有三项议程：\n1. 预设定价：在 2.99 和 4.99 美元之间做决定\n2. 和思雨过一遍 iPad 布局\n3. TestFlight 上 Beta 3 的反馈",
            "已經把 **每週例會** 改到每週四 10:00 – 10:30，本週開始生效。會議記錄裡最新一頁有三項議程：\n1. 預設定價：在 2.99 和 4.99 美元之間做決定\n2. 和思雨過一遍 iPad 版面\n3. TestFlight 上 Beta 3 的回饋",
        ],
    },
    {
        id: "daily-notes", title: ["Daily Notes Digest", "每日笔记摘要", "每日筆記摘要"],
        prompt: [
            "Search Cellar for the notes I created or edited today and summarize them in a few bullet points. List any open to-dos at the end.",
            "在 Cellar 里搜索我今天新建或编辑过的笔记，用几条要点总结一下，最后列出还没完成的待办。",
            "在 Cellar 裡搜尋我今天新增或編輯過的筆記，用幾條重點總結一下，最後列出還沒完成的待辦事項。",
        ],
        match: /cellar|note|to-?do|page|笔记|待办|页面|总结|筆記|待辦|頁面|總結/,
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
            {
                kind: "native", app: "Reminders", icon: "checklist",
                running: ["Reading Reminders", "正在读取提醒事项", "正在讀取提醒事項"], done: ["Read Reminders", "已读取提醒事项", "已讀取提醒事項"],
                card: [[LIST, PERSONAL], [["Due today", "今天到期", "今天到期"], ["Book the ryokan for the Kyoto trip", "预订京都旅行的旅馆", "預訂京都旅行的旅館"]]],
            },
        ],
        reply: [
            "Here's what changed in Cellar today:\n- **Lumen 2.0 launch plan** — the goal is now 1,000 paid presets by the end of Q1, and Pencil masking moves to 2.1 if it slips.\n- **Sync engine design** — added a diagram of the merge flow and notes on conflict handling.\n- **Kyoto trip** — a day-by-day table and a shortlist of three ryokans.\n**Open to-dos**\n1. Decide on preset pricing before Thursday\n2. Book the ryokan for the Kyoto trip (also due today in Reminders)\n3. Finish Klara and the Sun",
            "这是 Cellar 里今天改过的内容：\n- **Lumen 2.0 发布计划** —— 目标改为 Q1 结束前上架 1,000 个付费预设，Pencil 蒙版来不及就放到 2.1。\n- **同步引擎设计** —— 加了合并流程图和冲突处理的说明。\n- **京都旅行** —— 按天排好的行程表，还选好了三家旅馆。\n**未完成的待办**\n1. 周四前定下预设的价格\n2. 预订京都旅行的旅馆（提醒事项里也是今天到期）\n3. 读完《克拉拉与太阳》",
            "這是 Cellar 裡今天改過的內容：\n- **Lumen 2.0 發布計畫** —— 目標改為 Q1 結束前上架 1,000 個付費預設，Pencil 遮色片來不及就放到 2.1。\n- **同步引擎設計** —— 加了合併流程圖和衝突處理的說明。\n- **京都旅行** —— 按天排好的行程表，還選好了三家旅館。\n**未完成的待辦事項**\n1. 週四前定下預設的價格\n2. 預訂京都旅行的旅館（提醒事項裡也是今天到期）\n3. 讀完《克拉拉與太陽》",
        ],
    },
];

const chatOf = (s: Scenario): Chat => ({ id: s.id, title: s.title, messages: [{ role: "user", text: s.prompt }, { role: "assistant", text: s.reply, tools: s.tools }] });

/** The Recents the window opens with, newest first. */
export const CHATS: Chat[] = ["dev-stack", "night-city-cover", "fix-test", "daily-notes", "top-customers", "tidy-downloads", "movie-night", "slow-api", "release-notes", "weekly-sync"].map((id) => chatOf(SCENARIOS.find((s) => s.id === id)!));

/** Prompts offered under an empty New Chat. */
export const SUGGESTIONS: L[] = [
    ["Start my dev stack in Container", "在 Container 里启动我的开发环境", "在 Container 裡啟動我的開發環境"],
    ["Run the tests in lumen-api and fix what fails", "跑一下 lumen-api 的测试，把失败的修好", "跑一下 lumen-api 的測試，把失敗的修好"],
    ["Turn the Night City cover into a looping video", "把 Night City 封面做成循环视频", "把 Night City 封面做成循環影片"],
    ["Find our top customers with Quaero", "用 Quaero 找出我们的大客户", "用 Quaero 找出我們的大客戶"],
    ["Tidy up my Downloads folder", "整理一下我的下载文件夹", "整理一下我的下載項目"],
];

/** General answers for prompts no scenario covers. */
const GENERAL: L[] = [
    [
        "Good question. Here's how I'd think it through:\n1. Start with what you already know and what you actually need to decide.\n2. Break it into two or three smaller questions and answer those first.\n3. Write down the trade-offs, then pick the option you'd regret least.\nWant me to go deeper on any of these?",
        "好问题。我会这样想：\n1. 先理清你已经知道什么，真正要决定的是什么。\n2. 把它拆成两三个小问题，先逐个回答。\n3. 把各个选择的利弊写下来，选一个最不容易后悔的。\n要我展开讲其中哪一点吗？",
        "好問題。我會這樣想：\n1. 先理清你已經知道什麼，真正要決定的是什麼。\n2. 把它拆成兩三個小問題，先逐一回答。\n3. 把各個選擇的利弊寫下來，選一個最不容易後悔的。\n要我展開講其中哪一點嗎？",
    ],
    [
        "Here's the short answer, then the details:\n- **In short:** it depends on how much time you have and what matters most to you.\n- **If you're short on time:** go with the simplest option that works today.\n- **If you can wait:** try two options side by side and compare.\nTell me a bit more and I'll make it specific.",
        "先说结论，再说细节：\n- **简单说：** 取决于你有多少时间，以及你最看重什么。\n- **时间紧：** 先选今天就能用的最简单的方案。\n- **不着急：** 拿两个方案并排试一试再比较。\n多告诉我一点情况，我可以说得更具体。",
        "先說結論，再說細節：\n- **簡單說：** 取決於你有多少時間，以及你最看重什麼。\n- **時間緊：** 先選今天就能用的最簡單的方案。\n- **不著急：** 拿兩個方案並排試一試再比較。\n多告訴我一點情況，我可以說得更具體。",
    ],
    [
        "Sure. A few things that might help:\n- Everything I do here stays on this Mac; nothing is sent anywhere.\n- I can look things up in your connected apps, like **Cellar** and **Arthub**, when that helps.\n- Longer jobs can run on their own as **Scheduled Tasks**.\nWhere would you like to start?",
        "好的。有几点可能用得上：\n- 我在这里做的一切都只在这台 Mac 上，不会发到任何地方。\n- 需要的时候，我可以去你连接的应用里查，比如 **Cellar** 和 **Arthub**。\n- 耗时的事情可以设成 **定时任务** 自己运行。\n你想从哪里开始？",
        "好的。有幾點可能用得上：\n- 我在這裡做的一切都只在這台 Mac 上，不會傳到任何地方。\n- 需要的時候，我可以去你連接的 App 裡查，例如 **Cellar** 和 **Arthub**。\n- 耗時的事情可以設成 **排程任務** 自己執行。\n你想從哪裡開始？",
    ],
];

const CJK = /[㐀-鿿]/;

/**
 * The scripted answer to a prompt: its scenario's tool calls and reply, or why a connector is missing.
 * A prompt in Chinese gets a Chinese reply, in the script of `lang` when that is Chinese.
 */
export function replyTo(prompt: string, installed: Record<string, boolean>, lang: Lang, files: Attachment[] = []): Message {
    const s = pick(CJK.test(prompt) || (!prompt && lang !== "en") ? (lang === "zh-TW" ? "zh-TW" : "zh-CN") : "en");
    if (files.length) return replyToFiles(files, s);
    const p = prompt.toLowerCase();
    if (/^(hi|hello|hey)\b|你好|嗨/.test(p)) {
        return {
            role: "assistant",
            text: s([
                "Hi! I run entirely on this Mac. Ask me about your notes in Cellar or something to watch in Arthub.",
                "你好！我完全运行在这台 Mac 上。可以问我 Cellar 里的笔记，或者让我从 Arthub 里挑部电影。",
                "你好！我完全在這台 Mac 上執行。可以問我 Cellar 裡的筆記，或者讓我從 Arthub 裡挑部電影。",
            ]),
        };
    }
    const scenario = SCENARIOS.find((x) => x.match.test(p));
    if (!scenario) {
        const general = GENERAL[[...prompt].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % GENERAL.length];
        return { role: "assistant", text: s(general) };
    }
    const missing = scenario.tools.find((t) => t.kind === "connector" && !installed[CONNECTOR_NAME[t.app]]);
    if (missing && missing.kind === "connector") {
        const name = CONNECTOR_NAME[missing.app];
        return {
            role: "assistant",
            text: s([
                `${name} isn't connected yet. Install it in **Connectors**, then ask me again.`,
                `${name} 还没有连接。先在 **连接器** 里安装它，再问我一次。`,
                `${name} 還沒有連接。先在 **連接器** 裡安裝它，再問我一次。`,
            ]),
        };
    }
    return { role: "assistant", text: s(scenario.reply), tools: scenario.tools };
}

const bytes = (n: number) => (n >= 1024 ** 2 ? `${(n / 1024 ** 2).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`);
const extension = (name: string) => (name.includes(".") ? name.split(".").pop()!.toUpperCase() : "");

/** Reads each attached file (what the page found in it) and says what it is, then asks what to do with it. */
function replyToFiles(files: Attachment[], s: Text): Message {
    const tools: Tool[] = files.map((f) => ({
        kind: "file",
        name: f.name,
        card: [
            [["Kind", "种类", "種類"], f.type || extension(f.name) || "—"],
            [["Size", "大小", "大小"], bytes(f.size)],
            ...(f.width ? [[["Dimensions", "尺寸", "尺寸"], `${f.width} × ${f.height}`] as Card[number]] : []),
            ...(f.lines !== undefined ? [[["Lines", "行数", "行數"], String(f.lines)] as Card[number], [["Words", "字数", "字數"], String(f.words)] as Card[number]] : []),
        ],
    }));
    const lines = files.map((f) => {
        const size = bytes(f.size);
        if (f.width) return s([`- **${f.name}** is a ${f.width} × ${f.height} ${extension(f.name) || "image"} (${size}).`, `- **${f.name}** 是一张 ${f.width} × ${f.height} 的 ${extension(f.name) || "图片"}（${size}）。`, `- **${f.name}** 是一張 ${f.width} × ${f.height} 的 ${extension(f.name) || "圖片"}（${size}）。`]);
        if (f.lines !== undefined) {
            const opens = f.first ? s([` It opens with “${f.first}”.`, `开头是“${f.first}”。`, `開頭是「${f.first}」。`]) : "";
            return s([`- **${f.name}** has ${f.lines} lines and ${f.words} words.${opens}`, `- **${f.name}** 共 ${f.lines} 行、${f.words} 个词。${opens}`, `- **${f.name}** 共 ${f.lines} 行、${f.words} 個詞。${opens}`]);
        }
        return s([`- **${f.name}** is a ${extension(f.name) || "file"} of ${size}.`, `- **${f.name}** 是一个 ${size} 的 ${extension(f.name) || "文件"}。`, `- **${f.name}** 是一個 ${size} 的 ${extension(f.name) || "檔案"}。`]);
    });
    const text = [
        s([files.length > 1 ? "I've read the files. They stay on this Mac:" : "I've read the file. It stays on this Mac:", "文件我已经读过了，它们只留在这台 Mac 上：", "檔案我已經讀過了，它們只留在這台 Mac 上："]),
        ...lines,
        s(["What would you like me to do with them: summarize, rename, or file them away in Cellar?", "想让我怎么处理：总结一下、重命名，还是存进 Cellar？", "想讓我怎麼處理：總結一下、重新命名，還是存進 Cellar？"]),
    ].join("\n");
    return { role: "assistant", text, tools };
}

/** How a tool call reads in its row, while it runs and once it's done (ToolCall.localizedDescription). */
export function toolLabel(tool: Tool, running: boolean, s: Text): string {
    switch (tool.kind) {
        case "connector": {
            const app = CONNECTOR_NAME[tool.app];
            return running ? s([`Using ${app}`, `正在使用 ${app}`, `正在使用 ${app}`]) : s([`Used ${app}`, `已使用 ${app}`, `已使用 ${app}`]);
        }
        case "native": return s(running ? tool.running : tool.done);
        case "command": return running ? s(["Running a command", "正在运行命令", "正在執行指令"]) : s(["Ran a command", "已运行命令", "已執行指令"]);
        case "fetch": {
            const host = new URL(tool.url).hostname;
            return running ? s([`Fetching ${host}`, `正在获取 ${host}`, `正在擷取 ${host}`]) : s([`Fetched ${host}`, `已获取 ${host}`, `已擷取 ${host}`]);
        }
        case "file": return running ? s([`Reading ${tool.name}`, `正在读取 ${tool.name}`, `正在讀取 ${tool.name}`]) : s([`Read ${tool.name}`, `已读取 ${tool.name}`, `已讀取 ${tool.name}`]);
        case "edit": {
            const name = tool.path.split("/").pop();
            return running ? s([`Editing ${name}`, `正在编辑 ${name}`, `正在編輯 ${name}`]) : s([`Edited ${name}`, `已编辑 ${name}`, `已編輯 ${name}`]);
        }
        case "image": return running ? s(["Generating an image", "正在生成图片", "正在生成圖片"]) : s(["Generated an image", "已生成图片", "已生成圖片"]);
        case "video": return running ? s(["Generating a video", "正在生成视频", "正在生成影片"]) : s(["Generated a video", "已生成视频", "已生成影片"]);
    }
}

const PHRASE: Record<string, [one: L, many: L]> = {
    app: [["Used an app", "使用了一个 App", "使用了一個 App"], ["Used apps", "使用了多个 App", "使用了多個 App"]],
    command: [["Ran a command", "运行了一条命令", "執行了一個指令"], ["Ran commands", "运行了多条命令", "執行了多個指令"]],
    fetch: [["Fetched a web page", "获取了一个网页", "擷取了一個網頁"], ["Fetched web pages", "获取了多个网页", "擷取了多個網頁"]],
    file: [["Read a file", "读取了一个文件", "讀取了一個檔案"], ["Read files", "读取了多个文件", "讀取了多個檔案"]],
    edit: [["Edited a file", "编辑了一个文件", "編輯了一個檔案"], ["Edited files", "编辑了多个文件", "編輯了多個檔案"]],
    image: [["Generated an image", "生成了一张图片", "生成了一張圖片"], ["Generated images", "生成了多张图片", "生成了多張圖片"]],
    video: [["Generated a video", "生成了一段视频", "生成了一段影片"], ["Generated videos", "生成了多段视频", "生成了多段影片"]],
};

/** A finished group's title: one phrase per kind of work, in the order it first happened (ToolCallGroupSummary). */
export function groupTitle(tools: Tool[], lang: Lang): string {
    const s = pick(lang);
    const order: string[] = [];
    const seen = new Map<string, Set<string>>();
    for (const t of tools) {
        const [activity, occurrence] =
            t.kind === "connector" || t.kind === "native" ? ["app", t.app]
                : t.kind === "command" ? ["command", t.command]
                    : t.kind === "fetch" ? ["fetch", t.url]
                        : t.kind === "file" ? ["file", t.name]
                            : t.kind === "edit" ? ["edit", t.path]
                                : [t.kind, t.prompt];
        if (!seen.has(activity)) { order.push(activity); seen.set(activity, new Set()); }
        seen.get(activity)!.add(occurrence);
    }
    const parts = order.map((a, i) => {
        const text = s(PHRASE[a][seen.get(a)!.size > 1 ? 1 : 0]);
        return i === 0 || lang !== "en" ? text : text[0].toLowerCase() + text.slice(1);
    });
    return new Intl.ListFormat(locale(lang), { type: "conjunction" }).format(parts);
}
