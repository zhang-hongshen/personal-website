import { locale, pick, type L, type Lang, type Text } from "~/components/demo-text";
import type { SymbolName } from "~/components/sf-symbol";

// The demo's conversations: what each prompt makes the model do (tool calls, the way the app records
// them) and what it answers. A reply works the way the model does: it calls a few tools, says what it
// found and what it'll do next, calls more, and ends with an answer. Typed prompts are matched to a
// turn by keywords; replies follow the language of the prompt. Tool requests and results stay as the
// apps sent them.

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

/** A stretch of a reply: a run of tool calls, shown as one group, or text. */
export type Part = { tools: Tool[] } | { text: L | string };

/** Prepared text comes in every language; what the visitor types stays as typed. */
export type Message =
    | { role: "user"; text: L | string; attachments?: Attachment[] }
    | Reply;
export type Reply = { role: "assistant"; parts: Part[] };
export type Chat = { id: string; title: L | string; messages: Message[] };

/** One exchange: what the visitor asked, and the reply. `match` lets a typed prompt replay it. */
type Turn = { prompt: L; attachments?: Attachment[]; match?: RegExp; parts: Part[] };
type Conversation = { id: string; title: L; turns: Turn[] };

const json = (value: unknown) => JSON.stringify(value, null, 2);

const MAIL_DRAFT = { running: ["Creating Mail draft", "正在创建邮件草稿", "正在建立郵件草稿"] as L, done: ["Created Mail draft", "已创建邮件草稿", "已建立郵件草稿"] as L };
const MAIL_UPDATE = { running: ["Updating Mail draft", "正在更新邮件草稿", "正在更新郵件草稿"] as L, done: ["Updated Mail draft", "已更新邮件草稿", "已更新郵件草稿"] as L };
const READ_CALENDAR = { running: ["Reading Calendar", "正在读取日历", "正在讀取行事曆"] as L, done: ["Read Calendar", "已读取日历", "已讀取行事曆"] as L };
const UPDATE_CALENDAR = { running: ["Updating Calendar", "正在更新日历", "正在更新行事曆"] as L, done: ["Updated Calendar", "已更新日历", "已更新行事曆"] as L };
const ADD_REMINDER = { running: ["Adding to Reminders", "正在添加到提醒事项", "正在加入提醒事項"] as L, done: ["Added to Reminders", "已添加到提醒事项", "已加入提醒事項"] as L };
const TO: L = ["To", "收件人", "收件人"];
const BCC: L = ["Bcc", "密送", "密件副本"];
const SUBJECT: L = ["Subject", "主题", "主旨"];
const BODY: L = ["Body", "正文", "內文"];
const EVENT: L = ["Event", "日程", "行程"];
const WHEN: L = ["When", "时间", "時間"];
const LIST: L = ["List", "列表", "列表"];
const DUE: L = ["Due", "到期", "到期"];

const CONVERSATIONS: Conversation[] = [
    {
        id: "launch", title: ["Night City Looks Launch", "Night City Looks 上架", "Night City Looks 上架"],
        turns: [
            {
                prompt: [
                    "Night City Looks goes on sale tomorrow. Make sure the shop backend in ~/Code/shop-api actually works.",
                    "Night City Looks 明天上架。帮我确认一下 ~/Code/shop-api 这个店铺后端真的能跑。",
                    "Night City Looks 明天上架。幫我確認一下 ~/Code/shop-api 這個商店後端真的能跑。",
                ],
                match: /shop-api|backend|launch|\btests?\b|\bfail|\bfix|\bbugs?\b|上架|后端|後端|测试|測試|修复|修正|错误|錯誤/,
                parts: [
                    {
                        tools: [{
                            kind: "connector", app: "container", name: "list_containers",
                            args: json({ all: true }),
                            result: json([{ name: "web", image: "nginx:1.27", status: "running" }, { name: "db", image: "postgres:17", status: "running" }, { name: "cache", image: "redis:7.4", status: "stopped" }]),
                        }],
                    },
                    {
                        text: [
                            "**cache** is stopped. The API keeps its sessions in that Redis, so I'll start it before running the tests.",
                            "**cache** 是停着的。API 的会话存在这个 Redis 里，我先把它启动，再跑测试。",
                            "**cache** 是停著的。API 的工作階段存在這個 Redis 裡，我先把它啟動，再跑測試。",
                        ],
                    },
                    {
                        tools: [
                            {
                                kind: "connector", app: "container", name: "start_container",
                                args: json({ name: "cache" }),
                                result: json({ name: "cache", status: "running", ports: ["6379:6379"], networks: ["backend"] }),
                            },
                            {
                                kind: "command", command: "cd ~/Code/shop-api && npm test",
                                output: " PASS  src/sessions.test.ts\n FAIL  src/pricing.test.ts\n  ● presetPrice › applies the bundle discount once\n\n    Expected: 15.98\n    Received: 11.98\n\n      at src/pricing.test.ts:27:44\n\nTests:  1 failed, 23 passed, 24 total",
                            },
                        ],
                    },
                    {
                        text: [
                            "Everything's running now, but one test fails, and it's about money: a bundle of two presets comes out $4 too cheap. Let me see how the discount is worked out.",
                            "服务都起来了，但有一个测试没过，而且和钱有关：两个预设的套装便宜了 $4。我看看折扣是怎么算的。",
                            "服務都起來了，但有一個測試沒過，而且和錢有關：兩個預設的套裝便宜了 $4。我看看折扣是怎麼算的。",
                        ],
                    },
                    {
                        tools: [
                            {
                                kind: "command", command: "sed -n 17,21p src/pricing.ts",
                                output: "export function presetPrice(items: Preset[], bundle: boolean) {\n  const subtotal = items.reduce((sum, p) => sum + p.price, 0);\n  const discount = bundle ? items.length * 4 : 0;\n  return Math.max(0, subtotal - discount);\n}",
                            },
                        ],
                    },
                    {
                        text: [
                            "There it is: the $4 is taken once per preset (`items.length * 4`), while the test and the store page both say once per order. Fixing that and running the tests again.",
                            "找到了：$4 是按预设个数扣的（`items.length * 4`），而测试和商店页面写的都是每单减一次。改掉它，再跑一遍测试。",
                            "找到了：$4 是按預設個數扣的（`items.length * 4`），而測試和商店頁面寫的都是每筆訂單減一次。改掉它，再跑一遍測試。",
                        ],
                    },
                    {
                        tools: [
                            {
                                kind: "edit", path: "~/Code/shop-api/src/pricing.ts",
                                diff: "@@ -17,5 +17,5 @@\n export function presetPrice(items: Preset[], bundle: boolean) {\n   const subtotal = items.reduce((sum, p) => sum + p.price, 0);\n-  const discount = bundle ? items.length * 4 : 0;\n+  const discount = bundle ? 4 : 0;\n   return Math.max(0, subtotal - discount);\n }",
                            },
                            { kind: "command", command: "npm test", output: " PASS  src/sessions.test.ts\n PASS  src/pricing.test.ts\n\nTests:  24 passed, 24 total\nTime:   1.84 s" },
                        ],
                    },
                    {
                        text: [
                            "The backend is ready for tomorrow:\n- Started **cache** in Container; web and db were already running\n- Fixed the bundle discount in `src/pricing.ts`, so two $9.99 presets now cost $15.98 instead of $11.98\n- All 24 tests pass",
                            "后端可以迎接明天了：\n- 在 Container 里启动了 **cache**，web 和 db 本来就在运行\n- 修好了 `src/pricing.ts` 里的套装折扣，两个 $9.99 的预设现在是 $15.98，不再是 $11.98\n- 24 个测试全部通过",
                            "後端可以迎接明天了：\n- 在 Container 裡啟動了 **cache**，web 和 db 本來就在執行\n- 修好了 `src/pricing.ts` 裡的套裝折扣，兩個 $9.99 的預設現在是 $15.98，不再是 $11.98\n- 24 個測試全部通過",
                        ],
                    },
                ],
            },
            {
                prompt: [
                    "Great. Now it needs a cover: a rainy street at night, purple and teal neon.",
                    "好。现在它还缺一张封面：雨夜的街道，紫色和青色的霓虹灯。",
                    "好。現在它還缺一張封面：雨夜的街道，紫色和青色的霓虹燈。",
                ],
                match: /\bimage|\bpicture|\bcover\b|\bposter|\bdraw\b|illustrat|图片|图像|封面|海报|圖片|圖像|海報/,
                parts: [
                    {
                        tools: [{
                            kind: "image", art: "night-city", size: "1024 × 1024", saved: "~/Pictures/ModelCraft/night-city-cover.png",
                            prompt: "A rain-soaked city street at night, purple and teal neon signs reflected on wet asphalt, tall buildings fading into mist, cinematic, square cover.",
                        }],
                    },
                    {
                        text: [
                            "Here's the cover: purple and teal neon reflected on the wet street, square for the store. It's saved as **night-city-cover.png** in Pictures › ModelCraft. A still image is fine, but a slow loop would show off the look better on the store page. Want one?",
                            "封面做好了：紫色和青色的霓虹倒映在湿漉漉的街面上，正方形适合商店。已保存为 图片 › ModelCraft 里的 **night-city-cover.png**。静图也可以，不过在商店页面放一段慢慢动的循环视频，更能体现这套预设的感觉。要做一段吗？",
                            "封面做好了：紫色和青色的霓虹倒映在濕漉漉的街面上，正方形適合商店。已儲存為 圖片 › ModelCraft 裡的 **night-city-cover.png**。靜態圖也可以，不過在商店頁面放一段慢慢動的循環影片，更能展現這套預設的感覺。要做一段嗎？",
                        ],
                    },
                ],
            },
            {
                prompt: [
                    "Yes, a 6-second loop. And put it on the preset's page in the shop.",
                    "要，做 6 秒的循环。然后把它放到店里这个预设的页面上。",
                    "要，做 6 秒的循環。然後把它放到店裡這個預設的頁面上。",
                ],
                match: /\bvideo|\banimat|\bclip\b|\bloop|视频|动画|動畫|影片|循环|循環/,
                parts: [
                    {
                        tools: [{
                            kind: "video", art: "night-city", size: "1080 × 1080", seconds: 6, saved: "~/Movies/ModelCraft/night-city-loop.mp4",
                            prompt: "The Night City cover, slowly alive: rain falling, neon signs flickering, a car's lights passing on the wet street. Seamless 6-second loop.",
                        }],
                    },
                    {
                        text: [
                            "The loop's done: the rain keeps falling, the signs flicker and a car goes by, and the last frame meets the first. Now let me find the preset's page in the shop.",
                            "循环视频做好了：雨一直在下，招牌闪烁，一辆车驶过，最后一帧和第一帧接得上。接下来找一下店里这个预设的页面。",
                            "循環影片做好了：雨一直在下，招牌閃爍，一輛車駛過，最後一格和第一格接得上。接下來找一下店裡這個預設的頁面。",
                        ],
                    },
                    {
                        tools: [
                            { kind: "command", command: "ls ~/Code/shop-api/web/public/presets/night-city", output: "index.html\nplaceholder.png" },
                            { kind: "command", command: "cd ~/Code/shop-api/web/public/presets/night-city && cp ~/Pictures/ModelCraft/night-city-cover.png cover.png && cp ~/Movies/ModelCraft/night-city-loop.mp4 loop.mp4", output: "" },
                            {
                                kind: "edit", path: "~/Code/shop-api/web/public/presets/night-city/index.html",
                                diff: "@@ -12,7 +12,8 @@\n   <section class=\"hero\">\n-    <img src=\"placeholder.png\" alt=\"Night City Looks\">\n+    <video src=\"loop.mp4\" poster=\"cover.png\" autoplay loop muted playsinline\n+           aria-label=\"Night City Looks\"></video>\n     <h1>Night City Looks</h1>",
                            },
                        ],
                    },
                    {
                        text: [
                            "The page plays the loop now:\n- Copied the cover and the loop next to the page as `cover.png` and `loop.mp4`\n- Swapped the placeholder for the video in `index.html`. It's muted so browsers let it autoplay, and it shows the cover until it loads\nOpen localhost:8080/presets/night-city to see it before tomorrow.",
                            "页面现在会播放这段循环视频了：\n- 把封面和视频复制到页面旁边，命名为 `cover.png` 和 `loop.mp4`\n- 在 `index.html` 里用视频替换了占位图。视频是静音的，浏览器才允许自动播放；加载完成前会先显示封面\n明天之前可以打开 localhost:8080/presets/night-city 看看效果。",
                            "頁面現在會播放這段循環影片了：\n- 把封面和影片複製到頁面旁邊，命名為 `cover.png` 和 `loop.mp4`\n- 在 `index.html` 裡用影片取代了佔位圖。影片是靜音的，瀏覽器才允許自動播放；載入完成前會先顯示封面\n明天之前可以打開 localhost:8080/presets/night-city 看看效果。",
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: "slow-api", title: ["Why Is the Shop Slow?", "店铺为什么慢？", "商店為什麼慢？"],
        turns: [
            {
                prompt: [
                    "The shop's API has been slow every morning this week. Check Redis with Keel and find out why.",
                    "这周每天早上店铺的 API 都很慢。用 Keel 查一下 Redis，找出原因。",
                    "這週每天早上商店的 API 都很慢。用 Keel 查一下 Redis，找出原因。",
                ],
                match: /keel|redis|\bslow|latency|\bapi\b|慢|延迟|延遲/,
                parts: [
                    {
                        tools: [{
                            kind: "connector", app: "keel", name: "info",
                            args: json({ connection: "localhost:6379", section: "memory" }),
                            result: json({ used_memory_human: "18.42M", maxmemory_human: "256.00M", mem_fragmentation_ratio: 1.08, evicted_keys: 0 }),
                        }],
                    },
                    {
                        text: [
                            "Memory looks healthy: 18 MB of 256 MB, nothing evicted. So Redis isn't short of room. Next, which commands are slow?",
                            "内存很健康：256 MB 只用了 18 MB，没有淘汰任何键。所以不是 Redis 空间不够。接下来看看哪些命令慢。",
                            "記憶體很健康：256 MB 只用了 18 MB，沒有逐出任何鍵。所以不是 Redis 空間不夠。接下來看看哪些指令慢。",
                        ],
                    },
                    {
                        tools: [{
                            kind: "connector", app: "keel", name: "slowlog_get",
                            args: json({ connection: "localhost:6379", count: 3 }),
                            result: json([{ id: 31, time: "09:02:14", duration_ms: 18.4, command: "KEYS session:*" }, { id: 30, time: "09:02:11", duration_ms: 17.9, command: "KEYS session:*" }, { id: 29, time: "08:58:40", duration_ms: 2.1, command: "HGETALL config:feature_flags" }]),
                        }],
                    },
                    {
                        text: [
                            "One command stands out: `KEYS session:*`, about 18 ms each time, right when the morning traffic starts. `KEYS` walks every key and blocks Redis while it does, so every other request waits. Let me find where the shop calls it.",
                            "有一条命令很突出：`KEYS session:*`，每次约 18 毫秒，正好在早上流量上来的时候。`KEYS` 会遍历所有键，执行期间阻塞 Redis，其他请求都得等。我找找店铺代码哪里调用了它。",
                            "有一條指令很突出：`KEYS session:*`，每次約 18 毫秒，正好在早上流量上來的時候。`KEYS` 會走訪所有鍵，執行期間阻塞 Redis，其他請求都得等。我找找商店程式碼哪裡呼叫了它。",
                        ],
                    },
                    {
                        tools: [{ kind: "command", command: 'cd ~/Code/shop-api && grep -rn "keys(" src', output: "src/sessions.ts:42:  const ids = await redis.keys(\"session:*\")\nsrc/admin/stats.ts:17:  const total = (await redis.keys(\"user:*\")).length" }],
                    },
                    {
                        text: [
                            "Two places. `sessions.ts` runs on every sign-in, so that's the one hurting; the admin stats only run when someone opens that page. The fix is `SCAN`, but first let me check exactly what it promises.",
                            "有两处。`sessions.ts` 每次登录都会执行，罪魁祸首就是它；后台统计只在有人打开那个页面时才跑。解决办法是换成 `SCAN`，不过我先确认一下它的具体保证。",
                            "有兩處。`sessions.ts` 每次登入都會執行，罪魁禍首就是它；後台統計只在有人打開那個頁面時才跑。解決辦法是換成 `SCAN`，不過我先確認一下它的具體保證。",
                        ],
                    },
                    {
                        tools: [{
                            kind: "fetch", url: "https://redis.io/docs/latest/commands/scan/", title: "SCAN | Docs",
                            excerpt: "SCAN walks the keyspace a few keys at a time with a cursor, so no single call blocks the server for long. It can return the same key more than once, so callers should drop duplicates. MATCH filters the keys it returns.",
                        }],
                    },
                    {
                        text: [
                            "Good: `SCAN` with `MATCH` does the same job in small steps, as long as I drop duplicates. Changing `sessions.ts` and running the tests.",
                            "很好：带 `MATCH` 的 `SCAN` 可以分小步完成同样的事，只要去掉重复的键就行。我来改 `sessions.ts` 并跑测试。",
                            "很好：帶 `MATCH` 的 `SCAN` 可以分小步完成同樣的事，只要去掉重複的鍵就行。我來改 `sessions.ts` 並跑測試。",
                        ],
                    },
                    {
                        tools: [
                            {
                                kind: "edit", path: "~/Code/shop-api/src/sessions.ts",
                                diff: "@@ -40,5 +40,8 @@ export async function activeSessions() {\n   // Sessions expire on their own; this only lists the live ones.\n-  const ids = await redis.keys(\"session:*\")\n+  const ids = new Set<string>()\n+  for await (const key of redis.scanIterator({ MATCH: \"session:*\", COUNT: 500 })) {\n+    ids.add(key)\n+  }\n   return loadSessions([...ids])",
                            },
                            { kind: "command", command: "npm test", output: " PASS  src/sessions.test.ts\n PASS  src/pricing.test.ts\n\nTests:  24 passed, 24 total\nTime:   1.91 s" },
                        ],
                    },
                    {
                        text: [
                            "Found it: the morning slowdown was `KEYS session:*` blocking Redis on every sign-in.\n- Replaced it with `SCAN` in `src/sessions.ts:42`; the tests pass\n- Redis itself is fine: 18 MB used, nothing evicted\n- `src/admin/stats.ts:17` does the same for users. It only runs when you open the stats page, so it can wait, but it's worth changing too",
                            "找到了：早上变慢是因为每次登录都会执行 `KEYS session:*`，把 Redis 堵住了。\n- 已在 `src/sessions.ts:42` 换成 `SCAN`，测试通过\n- Redis 本身没问题：用了 18 MB，没有淘汰\n- `src/admin/stats.ts:17` 对用户也做了同样的事。它只在打开统计页面时运行，可以晚点改，但也值得改掉",
                            "找到了：早上變慢是因為每次登入都會執行 `KEYS session:*`，把 Redis 堵住了。\n- 已在 `src/sessions.ts:42` 換成 `SCAN`，測試通過\n- Redis 本身沒問題：用了 18 MB，沒有逐出\n- `src/admin/stats.ts:17` 對使用者也做了同樣的事。它只在打開統計頁面時執行，可以晚點改，但也值得改掉",
                        ],
                    },
                ],
            },
            {
                prompt: [
                    "Thanks! The order history page is still slow, though. Is that the database?",
                    "谢谢！不过订单历史页面还是很慢，是数据库的问题吗？",
                    "謝謝！不過訂單歷史頁面還是很慢，是資料庫的問題嗎？",
                ],
                match: /database|postgres|\bindex|\bsql\b|\borders? (page|history)|数据库|資料庫|索引|订单|訂單/,
                parts: [
                    {
                        tools: [{
                            kind: "connector", app: "quaero", name: "run_query",
                            args: json({ connection: "shop", sql: "EXPLAIN ANALYZE\nSELECT * FROM orders\nWHERE customer_id = 4127\nORDER BY created_at DESC LIMIT 20;" }),
                            result: json({ plan: ["Limit (rows=20)", "  -> Sort (key: created_at DESC)", "    -> Seq Scan on orders (rows=48210, filter: customer_id = 4127)"], execution_ms: 212.6 }),
                        }],
                    },
                    {
                        text: [
                            "Yes. To show one customer's 20 orders, Postgres reads all 48,210 orders and sorts them, because nothing indexes `customer_id`. An index on customer and date fits this page exactly. I'll build it without locking the table, since the shop is live.",
                            "是的。为了显示一位客户的 20 笔订单，Postgres 读了全部 48,210 笔订单再排序，因为 `customer_id` 上没有索引。按客户和日期建一个索引正好适合这个页面。店铺正在营业，我用不锁表的方式来建。",
                            "是的。為了顯示一位客戶的 20 筆訂單，Postgres 讀了全部 48,210 筆訂單再排序，因為 `customer_id` 上沒有索引。按客戶和日期建一個索引正好適合這個頁面。商店正在營業，我用不鎖表的方式來建。",
                        ],
                    },
                    {
                        tools: [
                            {
                                kind: "connector", app: "quaero", name: "run_query",
                                args: json({ connection: "shop", sql: "CREATE INDEX CONCURRENTLY orders_customer_created\nON orders (customer_id, created_at DESC);" }),
                                result: json({ status: "CREATE INDEX", execution_ms: 1840 }),
                            },
                            {
                                kind: "connector", app: "quaero", name: "run_query",
                                args: json({ connection: "shop", sql: "EXPLAIN ANALYZE\nSELECT * FROM orders\nWHERE customer_id = 4127\nORDER BY created_at DESC LIMIT 20;" }),
                                result: json({ plan: ["Limit (rows=20)", "  -> Index Scan using orders_customer_created on orders"], execution_ms: 0.9 }),
                            },
                        ],
                    },
                    {
                        text: [
                            "From 212 ms down to 0.9 ms. That index only exists in your local database, though, so I'll add a migration so production gets it too.",
                            "从 212 毫秒降到了 0.9 毫秒。不过这个索引只建在你本地的数据库里，我再加一个迁移，让生产环境也有。",
                            "從 212 毫秒降到了 0.9 毫秒。不過這個索引只建在你本機的資料庫裡，我再加一個遷移，讓正式環境也有。",
                        ],
                    },
                    {
                        tools: [
                            { kind: "command", command: "ls ~/Code/shop-api/db/migrations | tail -2", output: "0011_preset_bundles.sql\n0012_session_expiry.sql" },
                            {
                                kind: "edit", path: "~/Code/shop-api/db/migrations/0013_orders_customer_index.sql",
                                diff: "@@ -0,0 +1,3 @@\n+-- The order history page looks up a customer's latest orders.\n+CREATE INDEX CONCURRENTLY IF NOT EXISTS orders_customer_created\n+  ON orders (customer_id, created_at DESC);",
                            },
                        ],
                    },
                    {
                        text: [
                            "It was the database. The order history page scanned every order to find one customer's.\n- Added an index on `(customer_id, created_at)` with Quaero: the query went from **212 ms to 0.9 ms**\n- Built it `CONCURRENTLY`, so orders kept coming in meanwhile\n- Saved it as migration `0013_orders_customer_index.sql`, so production gets it on your next deploy",
                            "确实是数据库。订单历史页面为了找一位客户的订单，扫描了所有订单。\n- 用 Quaero 在 `(customer_id, created_at)` 上加了索引：查询从 **212 毫秒降到 0.9 毫秒**\n- 用 `CONCURRENTLY` 建的，期间订单照常写入\n- 存成了迁移 `0013_orders_customer_index.sql`，下次部署时生产环境也会有",
                            "確實是資料庫。訂單歷史頁面為了找一位客戶的訂單，掃描了所有訂單。\n- 用 Quaero 在 `(customer_id, created_at)` 上加了索引：查詢從 **212 毫秒降到 0.9 毫秒**\n- 用 `CONCURRENTLY` 建的，期間訂單照常寫入\n- 存成了遷移 `0013_orders_customer_index.sql`，下次部署時正式環境也會有",
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: "customers", title: ["Thank Our Best Customers", "感谢大客户", "感謝大客戶"],
        turns: [
            {
                prompt: [
                    "Who were our best customers in October? Save the list in Cellar and draft them a thank-you with a discount code.",
                    "10 月份我们最好的客户是谁？把名单存到 Cellar，再给他们起草一封附带优惠码的感谢信。",
                    "10 月份我們最好的客戶是誰？把名單存到 Cellar，再給他們草擬一封附上優惠碼的感謝信。",
                ],
                match: /quaero|\bsales\b|customer|revenue|客户|营收|销售|客戶|營收|銷售/,
                parts: [
                    {
                        tools: [{
                            kind: "connector", app: "quaero", name: "run_query",
                            args: json({ connection: "shop", sql: "SELECT c.name, c.email, count(*) AS orders, sum(o.total) AS revenue\nFROM orders o JOIN customers c ON c.id = o.customer_id\nWHERE o.paid_at >= '2026-10-01'\nGROUP BY c.id ORDER BY revenue DESC LIMIT 3;" }),
                            result: json({ columns: ["name", "email", "orders", "revenue"], rows: [["Hana Sato", "hana@example.com", 5, 54.95], ["Lucas Moreau", "lucas@example.com", 4, 43.96], ["Omar Haddad", "omar@example.com", 4, 39.96]], execution_ms: 6 }),
                        }],
                    },
                    {
                        text: [
                            "October's top three are Hana Sato, Lucas Moreau and Omar Haddad, with 13 orders between them. I'll save the table under Reports in Cellar, then write the email.",
                            "10 月前三名是 Hana Sato、Lucas Moreau 和 Omar Haddad，一共 13 笔订单。我先把表格存到 Cellar 的 Reports 下，再写邮件。",
                            "10 月前三名是 Hana Sato、Lucas Moreau 和 Omar Haddad，一共 13 筆訂單。我先把表格存到 Cellar 的 Reports 下，再寫郵件。",
                        ],
                    },
                    {
                        tools: [
                            {
                                kind: "connector", app: "cellar", name: "create_page",
                                args: json({ title: "Top customers — October 2026", parent: "Reports", blocks: [{ type: "table", columns: ["Name", "Orders", "Revenue"], rows: 3 }, { type: "paragraph", text: "From the shop database, paid orders only." }] }),
                                result: json({ id: "p_93c0", url: "cellar://page/p_93c0", created: true }),
                            },
                            {
                                kind: "native", app: "Mail", icon: "envelope", ...MAIL_DRAFT,
                                card: [
                                    [BCC, "hana@example.com, lucas@example.com, omar@example.com"],
                                    [SUBJECT, ["Thank you for a great October", "感谢你陪我们度过的 10 月", "感謝你陪我們度過的 10 月"]],
                                    [BODY, [
                                        "You were one of our best customers this month. Here's 20% off your next preset pack: THANKYOU20.",
                                        "你是我们这个月最好的客户之一。下一套预设包可享 8 折优惠：THANKYOU20。",
                                        "你是我們這個月最好的客戶之一。下一套預設包可享 8 折優惠：THANKYOU20。",
                                    ]],
                                ],
                            },
                        ],
                    },
                    {
                        text: [
                            "Your best customers in October, by paid orders:\n1. **Hana Sato**: 5 orders, $54.95\n2. **Lucas Moreau**: 4 orders, $43.96\n3. **Omar Haddad**: 4 orders, $39.96\n- Saved as **Top customers — October 2026** under Reports in Cellar\n- Drafted one thank-you in Mail with the code THANKYOU20, everyone in Bcc. It's in Drafts for you to check",
                            "按已付款订单算，10 月最好的客户是：\n1. **Hana Sato**：5 笔订单，$54.95\n2. **Lucas Moreau**：4 笔订单，$43.96\n3. **Omar Haddad**：4 笔订单，$39.96\n- 已存到 Cellar 的 Reports 下，页面名为 **Top customers — October 2026**\n- 在邮件里写了一封感谢信，附上优惠码 THANKYOU20，三人都放在密送里。草稿在草稿箱，等你确认",
                            "按已付款訂單算，10 月最好的客戶是：\n1. **Hana Sato**：5 筆訂單，$54.95\n2. **Lucas Moreau**：4 筆訂單，$43.96\n3. **Omar Haddad**：4 筆訂單，$39.96\n- 已存到 Cellar 的 Reports 下，頁面名為 **Top customers — October 2026**\n- 在郵件裡寫了一封感謝信，附上優惠碼 THANKYOU20，三人都放在密件副本裡。草稿在草稿匣，等你確認",
                        ],
                    },
                ],
            },
            {
                prompt: [
                    "Hang on, didn't Omar report a bug recently? He shouldn't get the same email as everyone else.",
                    "等一下，Omar 最近是不是报过一个 bug？他不该收到和别人一样的邮件。",
                    "等一下，Omar 最近是不是回報過一個 bug？他不該收到和別人一樣的郵件。",
                ],
                parts: [
                    {
                        tools: [{
                            kind: "connector", app: "cellar", name: "search_pages",
                            args: json({ database: "Customer feedback", query: "Omar Haddad" }),
                            result: json([{ title: "Export fails on HEIC photos", reporter: "Omar Haddad", reported: "2026-10-19", status: "Fixed in 1.4.2", fixed: "2026-10-23" }]),
                        }],
                    },
                    {
                        text: [
                            "You're right. On 19 October he reported that exports failed on HEIC photos, and the fix shipped in 1.4.2 on the 23rd. Nobody has told him yet, so I'll take him off the group email and write to him on his own.",
                            "没错。他在 10 月 19 日反馈过 HEIC 照片导出失败，23 日的 1.4.2 已经修好了，但还没人告诉他。我把他从群发邮件里去掉，单独给他写一封。",
                            "沒錯。他在 10 月 19 日回報過 HEIC 照片匯出失敗，23 日的 1.4.2 已經修好了，但還沒人告訴他。我把他從群發郵件裡移除，單獨給他寫一封。",
                        ],
                    },
                    {
                        tools: [
                            {
                                kind: "native", app: "Mail", icon: "envelope", ...MAIL_UPDATE,
                                card: [[BCC, "hana@example.com, lucas@example.com"]],
                            },
                            {
                                kind: "native", app: "Mail", icon: "envelope", ...MAIL_DRAFT,
                                card: [
                                    [TO, "omar@example.com"],
                                    [SUBJECT, ["Your HEIC export bug is fixed", "你反馈的 HEIC 导出问题已修复", "你回報的 HEIC 匯出問題已修正"]],
                                    [BODY, [
                                        "Thanks for reporting the HEIC export problem. It's fixed in 1.4.2. And thank you for sticking with us this month: here's 20% off your next preset pack, THANKYOU20.",
                                        "谢谢你反馈 HEIC 导出的问题，1.4.2 已经修复了。也谢谢你这个月一直支持我们：下一套预设包可享 8 折，优惠码 THANKYOU20。",
                                        "謝謝你回報 HEIC 匯出的問題，1.4.2 已經修正了。也謝謝你這個月一直支持我們：下一套預設包可享 8 折，優惠碼 THANKYOU20。",
                                    ]],
                                ],
                            },
                        ],
                    },
                    {
                        text: [
                            "Done. Omar gets his own email now:\n- Took him off the group thank-you, which goes to Hana and Lucas\n- Drafted a separate note telling him the HEIC export bug was fixed in 1.4.2, with the same discount code\nBoth are in Drafts.",
                            "好了，Omar 现在会收到单独的邮件：\n- 把他从群发感谢信里去掉了，那封现在只发给 Hana 和 Lucas\n- 另外起草了一封给他，告诉他 HEIC 导出问题在 1.4.2 已修复，并附上同样的优惠码\n两封都在草稿箱里。",
                            "好了，Omar 現在會收到單獨的郵件：\n- 把他從群發感謝信裡移除了，那封現在只寄給 Hana 和 Lucas\n- 另外草擬了一封給他，告訴他 HEIC 匯出問題在 1.4.2 已修正，並附上同樣的優惠碼\n兩封都在草稿匣裡。",
                        ],
                    },
                ],
            },
            {
                prompt: [
                    "Perfect. Remind me on Friday to check whether he wrote back.",
                    "很好。周五提醒我看看他有没有回信。",
                    "很好。週五提醒我看看他有沒有回信。",
                ],
                match: /remind|reminder|提醒/,
                parts: [
                    {
                        tools: [{
                            kind: "native", app: "Reminders", icon: "checklist", ...ADD_REMINDER,
                            card: [
                                [["Reminder", "提醒", "提醒"], ["Check if Omar replied about the HEIC fix", "看看 Omar 有没有回复 HEIC 修复的邮件", "看看 Omar 有沒有回覆 HEIC 修正的郵件"]],
                                [DUE, ["Fri, 30 Oct · 10:00", "10月30日 周五 · 10:00", "10月30日 週五 · 10:00"]],
                                [LIST, ["Work", "工作", "工作"]],
                            ],
                        }],
                    },
                    {
                        text: [
                            "I'll remind you on **Friday at 10:00** to check whether Omar replied. It's in your Work list in Reminders.",
                            "会在 **周五 10:00** 提醒你看看 Omar 有没有回信，已加到提醒事项的「工作」列表。",
                            "會在 **週五 10:00** 提醒你看看 Omar 有沒有回信，已加到提醒事項的「工作」列表。",
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: "movie-night", title: ["Friday Movie Night", "周五电影之夜", "週五電影之夜"],
        turns: [
            {
                prompt: [
                    "Leo sent his list of films for Friday. Pick one from it that I have and haven't watched in a while.",
                    "Leo 发来了他周五想看的片单。从里面挑一部我有、而且很久没看的。",
                    "Leo 傳來了他週五想看的片單。從裡面挑一部我有、而且很久沒看的。",
                ],
                attachments: [{ name: "films-for-friday.txt", size: 214, type: "text/plain", lines: 7, words: 31, first: "Films for Friday — Leo" }],
                parts: [
                    {
                        tools: [{
                            kind: "file", name: "films-for-friday.txt",
                            card: [[["Kind", "种类", "種類"], "text/plain"], [["Size", "大小", "大小"], "214 B"], [["Lines", "行数", "行數"], "7"], [["Words", "字数", "字數"], "31"]],
                        }],
                    },
                    {
                        text: [
                            "Leo's list has six films: three comedies, two thrillers and a documentary. Let me see which ones are in your Arthub library and when you last watched them.",
                            "Leo 的片单有六部：三部喜剧、两部惊悚片和一部纪录片。我去 Arthub 看看哪些在你的资料库里，以及你上次是什么时候看的。",
                            "Leo 的片單有六部：三部喜劇、兩部驚悚片和一部紀錄片。我去 Arthub 看看哪些在你的媒體庫裡，以及你上次是什麼時候看的。",
                        ],
                    },
                    {
                        tools: [{
                            kind: "connector", app: "arthub", name: "search_library",
                            args: json({ kind: "movie", titles: ["Paddington 2", "The Grand Budapest Hotel", "Game Night", "Knives Out", "Gone Girl", "Free Solo"] }),
                            result: json({ found: [{ title: "Paddington 2", year: 2017, runtime: "1h 43m", last_watched: "2025-03-14" }, { title: "The Grand Budapest Hotel", year: 2014, runtime: "1h 39m", last_watched: "2026-09-05" }, { title: "Knives Out", year: 2019, runtime: "2h 10m", last_watched: "2026-10-02" }], missing: ["Game Night", "Gone Girl", "Free Solo"] }),
                        }],
                    },
                    {
                        text: [
                            "You have three of them. Grand Budapest and Knives Out you watched in the last two months, but **Paddington 2** not since March 2025, and at 1h 43m it's an easy Friday. Let me check your evening is free.",
                            "其中三部在你的资料库里。《布达佩斯大饭店》和《利刃出鞘》你最近两个月看过，而 **《帕丁顿熊 2》** 从 2025 年 3 月起就没看了，1 小时 43 分钟，周五看正轻松。我看看你那天晚上有没有空。",
                            "其中三部在你的媒體庫裡。《歡迎來到布達佩斯大飯店》和《鋒迴路轉》你最近兩個月看過，而 **《柏靈頓：熊熊出任務》** 從 2025 年 3 月起就沒看了，1 小時 43 分鐘，週五看正輕鬆。我看看你那天晚上有沒有空。",
                        ],
                    },
                    {
                        tools: [{
                            kind: "native", app: "Calendar", icon: "calendar", ...READ_CALENDAR,
                            card: [[["Fri, 30 Oct", "10月30日 周五", "10月30日 週五"], ["Yoga · 18:30 – 19:30", "瑜伽 · 18:30 – 19:30", "瑜伽 · 18:30 – 19:30"]]],
                        }],
                    },
                    {
                        text: [
                            "Yoga ends at 19:30, so 20:00 leaves time to get home. Adding it to your calendar and drafting the invite.",
                            "瑜伽 19:30 结束，定在 20:00 刚好来得及回家。我把它加到日历，再起草邀请。",
                            "瑜伽 19:30 結束，定在 20:00 剛好來得及回家。我把它加到行事曆，再草擬邀請。",
                        ],
                    },
                    {
                        tools: [
                            {
                                kind: "native", app: "Calendar", icon: "calendar", ...UPDATE_CALENDAR,
                                card: [
                                    [EVENT, ["Movie Night: Paddington 2", "电影之夜：帕丁顿熊 2", "電影之夜：柏靈頓：熊熊出任務"]],
                                    [WHEN, ["Fri, 30 Oct · 20:00 – 21:45", "10月30日 周五 · 20:00 – 21:45", "10月30日 週五 · 20:00 – 21:45"]],
                                    [["Calendar", "日历", "行事曆"], ["Home", "家庭", "家庭"]],
                                ],
                            },
                            {
                                kind: "native", app: "Mail", icon: "envelope", ...MAIL_DRAFT,
                                card: [
                                    [TO, "leo@example.com, priya@example.com"],
                                    [SUBJECT, ["Movie night on Friday?", "周五来看电影吗？", "週五來看電影嗎？"]],
                                    [BODY, ["From Leo's list: Paddington 2 at mine, Friday at 8 pm. Snacks on me!", "从 Leo 的片单里选了《帕丁顿熊 2》，周五晚上 8 点来我家，零食我包了！", "從 Leo 的片單裡選了《柏靈頓：熊熊出任務》，週五晚上 8 點來我家，零食我包了！"]],
                                ],
                            },
                        ],
                    },
                    {
                        text: [
                            "Friday's movie is **Paddington 2 (2017)** from Leo's list: it's in your library, you last watched it in March 2025, and it runs 1h 43m.\n- Added **Movie Night** to your Home calendar, Friday 20:00 – 21:45, after yoga\n- Drafted the invite to Leo and Priya in Mail; it's waiting in Drafts",
                            "周五就看 Leo 片单里的 **《帕丁顿熊 2》(2017)**：资料库里有，你上次看是 2025 年 3 月，片长 1 小时 43 分钟。\n- 已在「家庭」日历添加 **电影之夜**，周五 20:00 – 21:45，在瑜伽之后\n- 在邮件里给 Leo 和思雨写好了邀请，放在草稿箱",
                            "週五就看 Leo 片單裡的 **《柏靈頓：熊熊出任務》(2017)**：媒體庫裡有，你上次看是 2025 年 3 月，片長 1 小時 43 分鐘。\n- 已在「家庭」行事曆加入 **電影之夜**，週五 20:00 – 21:45，在瑜伽之後\n- 在郵件裡幫 Leo 和思雨寫好了邀請，放在草稿匣",
                        ],
                    },
                ],
            },
            {
                prompt: [
                    "Leo's vegetarian and Priya's bringing her daughter. Put some snacks on my shopping list.",
                    "Leo 吃素，思雨会带她女儿来。帮我在购物清单里加些零食。",
                    "Leo 吃素，思雨會帶她女兒來。幫我在購物清單裡加些零食。",
                ],
                match: /snack|shopping|grocer|零食|购物|購物/,
                parts: [
                    {
                        text: [
                            "Everything should be vegetarian and fine for a child: no whole nuts, nothing too spicy. Adding them to Groceries.",
                            "零食要全素，也要适合小朋友：不放整颗坚果，也别太辣。我把它们加到「购物」列表。",
                            "零食要全素，也要適合小朋友：不放整顆堅果，也別太辣。我把它們加到「購物」列表。",
                        ],
                    },
                    {
                        tools: [{
                            kind: "native", app: "Reminders", icon: "checklist", ...ADD_REMINDER,
                            card: [
                                [LIST, ["Groceries", "购物", "購物"]],
                                [["Items", "项目", "項目"], ["Popcorn kernels · Hummus and pita · Veggie spring rolls · Grapes · Dark chocolate · Sparkling apple juice", "爆米花玉米粒 · 鹰嘴豆泥和皮塔饼 · 素春卷 · 葡萄 · 黑巧克力 · 苹果气泡果汁", "爆米花玉米粒 · 鷹嘴豆泥和皮塔餅 · 素春捲 · 葡萄 · 黑巧克力 · 蘋果氣泡果汁"]],
                                [DUE, ["Fri, 30 Oct · 17:00", "10月30日 周五 · 17:00", "10月30日 週五 · 17:00"]],
                            ],
                        }],
                    },
                    {
                        text: [
                            "Added six things to **Groceries**, due Friday at 17:00 so you can shop on the way home from yoga:\n- Popcorn to make at home\n- Hummus and pita, and veggie spring rolls\n- Grapes and dark chocolate\n- Sparkling apple juice, so Priya's daughter has something fizzy too",
                            "已在 **购物** 列表加了六样东西，周五 17:00 到期，瑜伽回家路上可以顺便买：\n- 在家现做的爆米花\n- 鹰嘴豆泥配皮塔饼，还有素春卷\n- 葡萄和黑巧克力\n- 苹果气泡果汁，思雨的女儿也能喝点有气泡的",
                            "已在 **購物** 列表加了六樣東西，週五 17:00 到期，瑜伽回家路上可以順便買：\n- 在家現做的爆米花\n- 鷹嘴豆泥配皮塔餅，還有素春捲\n- 葡萄和黑巧克力\n- 蘋果氣泡果汁，思雨的女兒也能喝點有氣泡的",
                        ],
                    },
                ],
            },
        ],
    },
];

/** Replies for Scheduled Tasks whose prompts none of the conversations above answer. */
const SONGS: Turn = {
    prompt: [
        "Pick ten songs from my Arthub library for a slow Sunday morning and put them in order.",
        "从我的 Arthub 资料库里挑十首适合慢悠悠周日早晨的歌，排好顺序。",
        "從我的 Arthub 媒體庫裡挑十首適合慢悠悠週日早晨的歌，排好順序。",
    ],
    match: /song|music|playlist|album|音乐|歌|专辑|音樂|專輯/,
    parts: [
        {
            tools: [{
                kind: "connector", app: "arthub", name: "search_library",
                args: json({ kind: "music", mood: ["calm", "acoustic"], limit: 40 }),
                result: json({ matches: 37, top: ["Bill Evans — Peace Piece", "Nick Drake — Pink Moon", "Norah Jones — Don't Know Why"] }),
            }],
        },
        {
            text: [
                "Here's a slow start, getting a little warmer as it goes:\n1. Bill Evans — Peace Piece\n2. Nick Drake — Pink Moon\n3. Norah Jones — Don't Know Why\n4. José González — Heartbeats\n5. Bon Iver — Holocene\n6. Feist — Mushaboom\n7. Jack Johnson — Banana Pancakes\n8. Corinne Bailey Rae — Put Your Records On\n9. The Staves — Facing West\n10. Iron & Wine — Naked As We Came",
                "从很安静开始，慢慢变得温暖一些：\n1. Bill Evans — Peace Piece\n2. Nick Drake — Pink Moon\n3. Norah Jones — Don't Know Why\n4. José González — Heartbeats\n5. Bon Iver — Holocene\n6. Feist — Mushaboom\n7. Jack Johnson — Banana Pancakes\n8. Corinne Bailey Rae — Put Your Records On\n9. The Staves — Facing West\n10. Iron & Wine — Naked As We Came",
                "從很安靜開始，慢慢變得溫暖一些：\n1. Bill Evans — Peace Piece\n2. Nick Drake — Pink Moon\n3. Norah Jones — Don't Know Why\n4. José González — Heartbeats\n5. Bon Iver — Holocene\n6. Feist — Mushaboom\n7. Jack Johnson — Banana Pancakes\n8. Corinne Bailey Rae — Put Your Records On\n9. The Staves — Facing West\n10. Iron & Wine — Naked As We Came",
            ],
        },
    ],
};
const TASK_TURNS: Turn[] = [
    {
        prompt: [
            "Pick one movie from my Arthub library that I haven't watched recently and explain in two sentences why it suits a Friday night.",
            "从我的 Arthub 资料库里挑一部最近没看过的电影，用两句话说说为什么适合周五晚上。",
            "從我的 Arthub 媒體庫裡挑一部最近沒看過的電影，用兩句話說說為什麼適合週五晚上。",
        ],
        match: /arthub|movie|film|watch|cinema|电影|影片|看片|電影/,
        parts: [
            {
                tools: [{
                    kind: "connector", app: "arthub", name: "search_library",
                    args: json({ kind: "movie", not_watched_in_days: 180, sort: "rating" }),
                    result: json({ matches: [{ title: "Paddington 2", year: 2017, runtime: "1h 43m", last_watched: "2025-03-14" }, { title: "The Grand Budapest Hotel", year: 2014, runtime: "1h 39m", last_watched: "2024-12-02" }] }),
                }],
            },
            {
                text: [
                    "**Paddington 2 (2017)**. It's warm and funny without asking much of you after a long week, and at 1h 43m it still leaves the evening open. You last watched it in March 2025, so it'll feel fresh again.",
                    "**《帕丁顿熊 2》(2017)**。它温暖又好笑，忙了一周之后看不费脑子，1 小时 43 分钟也不会占掉整个晚上。你上次看是 2025 年 3 月，再看会很新鲜。",
                    "**《柏靈頓：熊熊出任務》(2017)**。它溫暖又好笑，忙了一週之後看不費腦，1 小時 43 分鐘也不會佔掉整個晚上。你上次看是 2025 年 3 月，再看會很新鮮。",
                ],
            },
        ],
    },
    {
        prompt: [
            "Search Cellar for the notes I created or edited today and summarize them in a few bullet points. List any open to-dos at the end.",
            "在 Cellar 里搜索我今天新建或编辑过的笔记，用几条要点总结一下，最后列出还没完成的待办。",
            "在 Cellar 裡搜尋我今天新增或編輯過的筆記，用幾條重點總結一下，最後列出還沒完成的待辦事項。",
        ],
        match: /cellar|note|to-?do|page|笔记|待办|页面|总结|筆記|待辦|頁面|總結/,
        parts: [
            {
                tools: [{
                    kind: "connector", app: "cellar", name: "search_pages",
                    args: json({ edited: "today" }),
                    result: json([{ title: "Night City Looks launch", edited: "09:42" }, { title: "Shop performance notes", edited: "11:15" }, { title: "Kyoto trip", edited: "16:03" }]),
                }],
            },
            {
                text: [
                    "Three pages changed today. The launch plan has a to-do list, so let me read it.",
                    "今天改过三个页面。上架计划里有待办清单，我读一下。",
                    "今天改過三個頁面。上架計畫裡有待辦清單，我讀一下。",
                ],
            },
            {
                tools: [{
                    kind: "connector", app: "cellar", name: "read_page",
                    args: json({ title: "Night City Looks launch" }),
                    result: json({ blocks: 38, open_todos: ["Post the launch on the blog", "Email the beta testers their free copy"] }),
                }],
            },
            {
                text: [
                    "Here's what changed in Cellar today:\n- **Night City Looks launch**: the price is set at $9.99, $15.98 for the bundle, and the store page now has a looping video.\n- **Shop performance notes**: why mornings were slow (`KEYS` in Redis) and the new orders index.\n- **Kyoto trip**: a day-by-day plan and a shortlist of three ryokans.\n**Open to-dos**\n1. Post the launch on the blog\n2. Email the beta testers their free copy",
                    "这是 Cellar 里今天改过的内容：\n- **Night City Looks 上架**：定价 $9.99，套装 $15.98，商店页面加上了循环视频。\n- **店铺性能笔记**：早上变慢的原因（Redis 里的 `KEYS`）和新加的订单索引。\n- **京都旅行**：按天排好的行程，还选好了三家旅馆。\n**未完成的待办**\n1. 在博客上发布上架消息\n2. 给内测用户发邮件送免费版",
                    "這是 Cellar 裡今天改過的內容：\n- **Night City Looks 上架**：定價 $9.99，套裝 $15.98，商店頁面加上了循環影片。\n- **商店效能筆記**：早上變慢的原因（Redis 裡的 `KEYS`）和新加的訂單索引。\n- **京都旅行**：按天排好的行程，還選好了三家旅館。\n**未完成的待辦事項**\n1. 在部落格上發佈上架消息\n2. 寄郵件給測試者送免費版",
                ],
            },
        ],
    },
];

/** The Recents the window opens with, newest first. */
export const CHATS: Chat[] = CONVERSATIONS.map((c) => ({
    id: c.id,
    title: c.title,
    messages: c.turns.flatMap((t): Message[] => [
        { role: "user", text: t.prompt, ...(t.attachments ? { attachments: t.attachments } : {}) },
        { role: "assistant", parts: t.parts },
    ]),
}));

/**
 * What a typed prompt can replay: the turns that make sense on their own, then the tasks'. Songs come
 * first, since a playlist can be "slow" too; within a conversation the later turns, being narrower.
 */
const TURNS = [SONGS, ...CONVERSATIONS.flatMap((c) => [...c.turns].reverse()), ...TASK_TURNS].filter((t) => t.match);

/** Prompts offered under an empty New Chat. */
export const SUGGESTIONS: L[] = [
    ["Make sure shop-api is ready for launch", "确认 shop-api 可以上架了", "確認 shop-api 可以上架了"],
    ["Why is the shop's API slow in the mornings?", "店铺的 API 为什么早上很慢？", "商店的 API 為什麼早上很慢？"],
    ["Who were our best customers in October?", "10 月份我们最好的客户是谁？", "10 月份我們最好的客戶是誰？"],
    ["Make a cover image for Night City Looks", "给 Night City Looks 做一张封面", "幫 Night City Looks 做一張封面"],
];

/** General answers for prompts no turn covers. */
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
 * The scripted answer to a prompt: the turn it matches, or why a connector is missing.
 * A prompt in Chinese gets a Chinese reply, in the script of `lang` when that is Chinese.
 */
export function replyTo(prompt: string, installed: Record<string, boolean>, lang: Lang, files: Attachment[] = []): Reply {
    const s = pick(CJK.test(prompt) || (!prompt && lang !== "en") ? (lang === "zh-TW" ? "zh-TW" : "zh-CN") : "en");
    if (files.length) return replyToFiles(files, s);
    const p = prompt.toLowerCase();
    if (/^(hi|hello|hey)\b|你好|嗨/.test(p)) {
        return {
            role: "assistant",
            parts: [{
                text: s([
                    "Hi! I run entirely on this Mac. Ask me about your notes in Cellar or something to watch in Arthub.",
                    "你好！我完全运行在这台 Mac 上。可以问我 Cellar 里的笔记，或者让我从 Arthub 里挑部电影。",
                    "你好！我完全在這台 Mac 上執行。可以問我 Cellar 裡的筆記，或者讓我從 Arthub 裡挑部電影。",
                ]),
            }],
        };
    }
    const turn = TURNS.find((x) => x.match!.test(p));
    if (!turn) {
        const general = GENERAL[[...prompt].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % GENERAL.length];
        return { role: "assistant", parts: [{ text: s(general) }] };
    }
    const missing = turn.parts.flatMap((part) => ("tools" in part ? part.tools : [])).find((t) => t.kind === "connector" && !installed[CONNECTOR_NAME[t.app]]);
    if (missing && missing.kind === "connector") {
        const name = CONNECTOR_NAME[missing.app];
        return {
            role: "assistant",
            parts: [{
                text: s([
                    `${name} isn't connected yet. Install it in **Connectors**, then ask me again.`,
                    `${name} 还没有连接。先在 **连接器** 里安装它，再问我一次。`,
                    `${name} 還沒有連接。先在 **連接器** 裡安裝它，再問我一次。`,
                ]),
            }],
        };
    }
    return { role: "assistant", parts: turn.parts.map((part) => ("text" in part ? { text: s(part.text) } : part)) };
}

const bytes = (n: number) => (n >= 1024 ** 2 ? `${(n / 1024 ** 2).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`);
const extension = (name: string) => (name.includes(".") ? name.split(".").pop()!.toUpperCase() : "");

/** Reads each attached file (what the page found in it) and says what it is, then asks what to do with it. */
function replyToFiles(files: Attachment[], s: Text): Reply {
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
    return { role: "assistant", parts: [{ tools }, { text }] };
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
