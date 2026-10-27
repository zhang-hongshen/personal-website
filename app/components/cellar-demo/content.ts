// What the Cellar demo opens with: a few pages and two databases from the app's showcase data (a small
// team building ModelCraft), in the visitor's language.

export type Lang = "en" | "zh-CN" | "zh-TW";

export type BlockType = "p" | "h1" | "h2" | "h3" | "todo" | "bullet" | "number" | "quote" | "code" | "divider" | "page";
export type Block = { id: string; type: BlockType; text: string; checked?: boolean; /** For "page": the page it opens. */ target?: string };

export type Color = "gray" | "blue" | "purple" | "green" | "yellow" | "orange" | "red" | "pink" | "brown";
export type Option = { name: string; color: Color };
export type Column = { key: string; name: string; options?: Option[] };
export type Row = { id: string; title: string; [key: string]: string };

export type Doc =
    | { kind: "page"; id: string; title: string; blocks: Block[] }
    | { kind: "database"; id: string; title: string; columns: Column[]; rows: Row[]; groupBy: string };

let next = 0;
export const newId = () => `b${++next}`;

/** One string in each language. */
type L = [en: string, cn: string, tw: string];

export function seed(lang: Lang): Doc[] {
    const i = lang === "en" ? 0 : lang === "zh-CN" ? 1 : 2;
    const s = (l: L) => l[i];
    const b = (type: BlockType, text: L | string, extra: Partial<Block> = {}): Block =>
        ({ id: newId(), type, text: typeof text === "string" ? text : s(text), ...extra });

    const status: Option[] = [
        { name: s(["Not started", "未开始", "未開始"]), color: "gray" },
        { name: s(["In progress", "进行中", "進行中"]), color: "blue" },
        { name: s(["In review", "待审核", "待審核"]), color: "purple" },
        { name: s(["Done", "已完成", "已完成"]), color: "green" },
    ];
    const priority: Option[] = [
        { name: s(["Low", "低", "低"]), color: "gray" },
        { name: s(["Medium", "中", "中"]), color: "yellow" },
        { name: s(["High", "高", "高"]), color: "orange" },
        { name: s(["Urgent", "紧急", "緊急"]), color: "red" },
    ];
    const people = [s(["Maya Chen", "林晓", "林曉"]), s(["Leo Fischer", "周远", "周遠"]), s(["Priya Raman", "陈思雨", "陳思雨"]), s(["Sam Okafor", "王磊", "王磊"]), s(["Hana Sato", "苏念", "蘇念"])];
    const tasks: [L, number, number, number, L][] = [
        [["Pick the Model Store's featured models", "选定模型商店的推荐模型", "選定模型商店的推薦模型"], 2, 2, 0, ["Oct 26", "10月26日", "10月26日"]],
        [["Build the connector install flow", "开发连接器安装流程", "開發連接器安裝流程"], 1, 2, 1, ["Oct 29", "10月29日", "10月29日"]],
        [["Monthly download report", "月度下载量报表", "月度下載量報表"], 0, 1, 3, ["Nov 6", "11月6日", "11月6日"]],
        [["Scheduled tasks settings", "定时任务设置页", "排程任務設定頁"], 3, 2, 2, ["Oct 22", "10月22日", "10月22日"]],
        [["Fix crash when pausing a download", "修复暂停下载时崩溃", "修正暫停下載時當機"], 1, 3, 3, ["Today", "今天", "今天"]],
        [["New welcome screens", "新的欢迎页", "新的歡迎頁"], 2, 2, 2, ["Oct 28", "10月28日", "10月28日"]],
        [["Write onboarding copy", "撰写引导文案", "撰寫引導文案"], 3, 1, 4, ["Oct 20", "10月20日", "10月20日"]],
    ];

    const reading: Option[] = [
        { name: s(["Want to read", "想读", "想讀"]), color: "gray" },
        { name: s(["Reading", "在读", "在讀"]), color: "orange" },
        { name: s(["Finished", "读完", "讀完"]), color: "green" },
    ];
    const books: [L, L, number, string][] = [
        [["Klara and the Sun", "克拉拉与太阳", "克拉拉與太陽"], ["Kazuo Ishiguro", "石黑一雄", "石黑一雄"], 1, "★★★★☆"],
        [["The Design of Everyday Things", "设计心理学", "設計的心理學"], ["Don Norman", "唐纳德·诺曼", "唐納·諾曼"], 2, "★★★★★"],
        [["Project Hail Mary", "挽救计划", "極限返航"], ["Andy Weir", "安迪·威尔", "安迪·威爾"], 0, ""],
        [["Shoe Dog", "鞋狗", "跑出全世界的人"], ["Phil Knight", "菲尔·奈特", "菲爾·奈特"], 2, "★★★★☆"],
        [["Thinking, Fast and Slow", "思考，快与慢", "快思慢想"], ["Daniel Kahneman", "丹尼尔·卡尼曼", "丹尼爾·康納曼"], 0, ""],
    ];

    return [
        {
            kind: "page", id: "home", title: s(["Home", "首页", "首頁"]),
            blocks: [
                b("p", ["Everything for ModelCraft and life outside it. Nothing here leaves this Mac.", "ModelCraft 的工作和生活里的琐事都在这里，所有内容只存在这台 Mac 上。", "ModelCraft 的工作和生活裡的瑣事都在這裡，所有內容只存在這台 Mac 上。"]),
                b("h1", ["This week", "本周", "本週"]),
                b("todo", ["Send 1.0 beta 3 to TestFlight", "把 1.0 beta 3 发到 TestFlight", "把 1.0 beta 3 發到 TestFlight"], { checked: true }),
                b("todo", ["Review the welcome screens with Priya", "和思雨过一遍新的欢迎页", "和思雨過一遍新的歡迎頁"], { checked: true }),
                b("todo", ["Pick the Model Store's featured models before Thursday", "周四前选定模型商店的推荐模型", "週四前選定模型商店的推薦模型"]),
                b("todo", ["Book the ryokan for the Kyoto trip", "预订京都旅行的旅馆", "預訂京都旅行的旅館"]),
                b("todo", ["Finish Klara and the Sun", "读完《克拉拉与太阳》", "讀完《克拉拉與太陽》"]),
                b("h2", ["Jump to", "常用", "常用"]),
                b("page", "", { target: "launch" }),
                b("page", "", { target: "tasks" }),
                b("page", "", { target: "books" }),
                b("divider", ""),
                b("quote", ["Make it work, make it right, make it fast. — Kent Beck", "先让它能用，再让它正确，最后让它变快。—— Kent Beck", "先讓它能用，再讓它正確，最後讓它變快。—— Kent Beck"]),
            ],
        },
        {
            kind: "page", id: "launch", title: s(["ModelCraft 1.0 launch plan", "ModelCraft 1.0 发布计划", "ModelCraft 1.0 發布計畫"]),
            blocks: [
                b("p", ["Goal: a private assistant that runs entirely on the Mac and works your other apps for you, with 10,000 downloads in the first month.", "目标：做一个完全在 Mac 本地运行、能替你操作其他 App 的私人助手，首月下载 10,000 次。", "目標：做一個完全在 Mac 本機執行、能替你操作其他 App 的私人助理，首月下載 10,000 次。"]),
                b("h2", ["What ships", "包含内容", "包含內容"]),
                b("number", ["Connectors — work Container, Quaero, Keel, Cellar and Arthub from a chat", "连接器 —— 在对话里操作 Container、Quaero、Keel、Cellar 和 Arthub", "連接器 —— 在對話裡操作 Container、Quaero、Keel、Cellar 和 Arthub"]),
                b("number", ["Scheduled tasks — run a prompt every day or week", "定时任务 —— 每天或每周自动运行一个提示", "排程任務 —— 每天或每週自動執行一個提示"]),
                b("number", ["New onboarding — three screens instead of seven", "新的引导流程 —— 从七屏减到三屏", "新的引導流程 —— 從七頁減到三頁"]),
                b("h2", ["Open questions", "待定问题", "待定問題"]),
                b("bullet", ["Which models should the Model Store feature first?", "模型商店首先推荐哪些模型？", "模型商店首先推薦哪些模型？"]),
                b("bullet", ["How much memory should the default model need?", "默认模型应该占用多少内存？", "預設模型應該佔用多少記憶體？"]),
                b("code", "let connectors = [\"container\", \"quaero\", \"keel\", \"cellar\", \"arthub\"]\nlet launch = Date(\"2027-01-12\")"),
            ],
        },
        {
            kind: "page", id: "kyoto", title: s(["Kyoto trip", "京都旅行", "京都旅行"]),
            blocks: [
                b("p", ["Five days in November, mostly on foot.", "十一月去五天，大部分时间走路。", "十一月去五天，大部分時間走路。"]),
                b("h2", ["Plan", "行程", "行程"]),
                b("bullet", ["Day 1 — Fushimi Inari before the crowds", "第 1 天 —— 趁人少去伏见稻荷", "第 1 天 —— 趁人少去伏見稻荷"]),
                b("bullet", ["Day 2 — Arashiyama and the bamboo grove", "第 2 天 —— 岚山和竹林", "第 2 天 —— 嵐山和竹林"]),
                b("bullet", ["Day 3 — Day trip to Nara", "第 3 天 —— 奈良一日游", "第 3 天 —— 奈良一日遊"]),
                b("h2", ["Packing", "要带的", "要帶的"]),
                b("todo", ["Rail pass", "JR 周游券", "JR 周遊券"], { checked: true }),
                b("todo", ["Walking shoes", "好走的鞋", "好走的鞋"]),
                b("todo", ["35mm lens", "35mm 镜头", "35mm 鏡頭"]),
            ],
        },
        {
            kind: "database", id: "tasks", title: s(["Tasks", "任务", "任務"]), groupBy: "status",
            columns: [
                { key: "status", name: s(["Status", "状态", "狀態"]), options: status },
                { key: "priority", name: s(["Priority", "优先级", "優先級"]), options: priority },
                { key: "assignee", name: s(["Assignee", "负责人", "負責人"]) },
                { key: "due", name: s(["Due", "截止", "截止"]) },
            ],
            rows: tasks.map(([title, st, pr, who, due]) => ({
                id: newId(), title: s(title), status: status[st].name, priority: priority[pr].name, assignee: people[who], due: s(due),
            })),
        },
        {
            kind: "database", id: "books", title: s(["Reading list", "书单", "書單"]), groupBy: "status",
            columns: [
                { key: "author", name: s(["Author", "作者", "作者"]) },
                { key: "status", name: s(["Status", "状态", "狀態"]), options: reading },
                { key: "rating", name: s(["Rating", "评分", "評分"]) },
            ],
            rows: books.map(([title, author, st, rating]) => ({ id: newId(), title: s(title), author: s(author), status: reading[st].name, rating })),
        },
    ];
}

/** The app's own words, for the parts of the window that aren't content. */
export function strings(lang: Lang) {
    const i = lang === "en" ? 0 : lang === "zh-CN" ? 1 : 2;
    const s = (l: L) => l[i];
    return {
        search: s(["Search pages…", "搜索页面…", "搜尋頁面…"]),
        noResults: s(["No pages found", "没有找到页面", "找不到頁面"]),
        untitled: s(["Untitled", "无标题", "未命名"]),
        newPage: s(["New Page", "新建页面", "新增頁面"]),
        placeholder: s(["Type “/” for commands", "输入“/”选择块类型", "輸入「/」選擇區塊類型"]),
        table: s(["Table", "表格", "表格"]),
        board: s(["Board", "看板", "看板"]),
        name: s(["Name", "名称", "名稱"]),
        newRow: s(["New", "新建", "新增"]),
        back: s(["Back", "后退", "上一頁"]),
        forward: s(["Forward", "前进", "下一頁"]),
        hidePanel: s(["Hide Sidebar", "隐藏边栏", "隱藏側邊欄"]),
        showPanel: s(["Show Sidebar", "显示边栏", "顯示側邊欄"]),
        blocks: [
            ["p", s(["Text", "文本", "文字"])], ["h1", s(["Heading 1", "标题 1", "標題 1"])], ["h2", s(["Heading 2", "标题 2", "標題 2"])],
            ["h3", s(["Heading 3", "标题 3", "標題 3"])], ["todo", s(["To-do", "待办", "待辦"])], ["bullet", s(["Bulleted List", "项目符号列表", "項目符號清單"])],
            ["number", s(["Numbered List", "编号列表", "編號清單"])], ["quote", s(["Quote", "引用", "引言"])], ["code", s(["Code", "代码", "程式碼"])],
            ["divider", s(["Divider", "分割线", "分隔線"])],
        ] as [BlockType, string][],
        basic: s(["Basic Blocks", "基础块", "基本區塊"]),
    };
}
export type Strings = ReturnType<typeof strings>;
