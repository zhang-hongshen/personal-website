import { useCallback, useEffect, useState } from "react";

import { useText, type L } from "~/components/demo-text";
import { Inspector, MAC, MacSidebar, MacWindow, Popover, Segmented, ShowSidebarButton, SidebarHeader, SidebarRow, TitleBar, ToolButton, Unavailable, useSidebar } from "~/components/mac-ui";
import { CAPSULE } from "~/components/mac-window";
import { useTour, type Tour } from "~/components/tour";
import { cn } from "~/lib/utils";
import { KeyBrowser } from "./browser";
import { Console, type Line } from "./console";
import { newServer, servers as initialServers, type KeyType, type Server } from "./data";
import { InsightsPage, PAGES, type Page } from "./insights";
import { expire } from "./redis";
import { TTLBar, ValueEditor, keySubtitle } from "./value";

// A Keel window that works like the app: connections in the sidebar, the key browser or Insights in
// the middle, the selected key's value on the right, and the command console in the inspector. The
// keyspace lives in the page, keys with a TTL expire on time, and a reload starts over.

const EXPIRY: [L, number | null][] = [
    [["No Expiry", "永不过期", "永不過期"], null], [["1 Minute", "1 分钟", "1 分鐘"], 60], [["10 Minutes", "10 分钟", "10 分鐘"], 600],
    [["1 Hour", "1 小时", "1 小時"], 3600], [["1 Day", "1 天", "1 天"], 86400],
];

/** The parts of the app a tour walks through: the key browser, Insights and the command console. */
export type KeelStop = "browse" | "insights" | "console";

export function KeelDemo({ className, tour }: { className?: string; tour?: Tour<KeelStop> }) {
    const t = useText();
    const sidebar = useSidebar();
    const [servers, setServers] = useState<Server[]>(initialServers);
    const [serverId, setServerId] = useState("local");
    const [dbs, setDbs] = useState<Record<string, number>>({});
    const [keys, setKeys] = useState<Record<string, string | null>>({ local: "user:1001" });
    const [mode, setMode] = useState<"browse" | "insights">("browse");
    // The Browse tab's type filter and view, kept while Insights is shown.
    const [type, setType] = useState<KeyType | "all">("all");
    const [asTree, setAsTree] = useState(true);
    const [page, setPage] = useState<Page>("overview");
    const [consoleOpen, setConsoleOpen] = useState(false);
    const [lines, setLines] = useState<Record<string, Line[]>>({});
    const [menu, setMenu] = useState<"expiry" | "delete" | null>(null);
    // Narrow screens show the key list or the detail, not both.
    // The clock for TTLs, null until the page runs so prerendered HTML doesn't depend on the build time.
    const [now, setNow] = useState<number | null>(null);
    const [, redraw] = useState(0);
    const changed = useCallback(() => redraw((n) => n + 1), []);

    useEffect(() => {
        const tick = () => {
            const t = Date.now();
            setNow(t);
            setServers((ss) => (ss.some((s) => s.keyspace.some((db) => expire(db, t))) ? [...ss] : ss));
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, []);

    const server = servers.find((s) => s.id === serverId)!;
    const dbIndex = dbs[serverId] ?? 0;
    const db = server.keyspace[dbIndex];
    const keyName = keys[serverId] ?? null;
    const entry = keyName ? db[keyName] : undefined;

    const openServer = (id: string) => {
        setServerId(id);
        setMenu(null);
    };
    const selectKey = (name: string) => {
        setKeys((k) => ({ ...k, [serverId]: name }));
        setMenu(null);
    };
    useTour(tour, consoleOpen ? "console" : mode, (stop) => {
        setConsoleOpen(stop === "console");
        if (stop !== "console") setMode(stop);
    });
    const addServer = () => {
        const added = newServer();
        if (!servers.some((s) => s.id === added.id)) setServers((ss) => [...ss, added]);
        openServer(added.id);
    };

    const consoleButton = <ToolButton grouped icon="terminal" label={t(["Console", "控制台", "主控台"])} active={consoleOpen} onClick={() => setConsoleOpen((o) => !o)} />;

    return (
        <MacWindow className={className}>
            <MacSidebar sidebar={sidebar} toolbar={<ToolButton icon="plus" label={t(["New Connection", "新建连接", "新增連線"])} onClick={addServer} />}>
                <SidebarHeader>{t(["Connections", "连接", "連線"])}</SidebarHeader>
                <nav className="flex flex-col gap-0.5 overflow-y-auto pb-3">
                    {servers.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            aria-current={s.id === serverId || undefined}
                            className={cn("mx-2.5 flex h-11 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-left", s.id === serverId ? MAC.selected : MAC.hover)}
                            onClick={() => openServer(s.id)}
                        >
                            <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                            <span className="flex min-w-0 flex-1 flex-col leading-tight">
                                <span className="truncate">{t(s.name)}</span>
                                <span className={cn("truncate text-[11px]", s.id === serverId ? "text-white/75" : MAC.muted)}>{s.address}</span>
                            </span>
                            {s.id === serverId && <span className="size-2 shrink-0 rounded-full bg-[#34c759] ring-2 ring-white/70" aria-label={t(["Connected", "已连接", "已連線"])} />}
                        </button>
                    ))}
                </nav>
            </MacSidebar>

            <section className={cn("flex w-[300px] shrink-0 flex-col border-r", MAC.line)}>
                <TitleBar leading={<ShowSidebarButton sidebar={sidebar} />} title={t(server.name)} subtitle={`${server.product} ${server.version}`}>
                    <select
                        aria-label={t(["Database", "数据库", "資料庫"])}
                        value={dbIndex}
                        className={cn(CAPSULE, "px-2.5 text-[12px] outline-none")}
                        onChange={(e) => { setDbs((d) => ({ ...d, [serverId]: Number(e.target.value) })); setKeys((k) => ({ ...k, [serverId]: null })); }}
                    >
                        {server.keyspace.map((d, i) => <option key={i} value={i}>db{i}{Object.keys(d).length ? ` · ${Object.keys(d).length}` : ""}</option>)}
                    </select>
                </TitleBar>
                <div className="px-3 pb-2">
                    <Segmented options={[{ value: "browse", label: t(["Browse", "浏览", "瀏覽"]) }, { value: "insights", label: t(["Insights", "洞察", "洞察"]) }]} value={mode} onChange={setMode} className="w-full" />
                </div>
                {mode === "browse" ? (
                    <KeyBrowser db={db} selected={keyName} now={now} type={type} asTree={asTree} onType={setType} onAsTree={setAsTree} onSelect={selectKey} />
                ) : (
                    <nav className="flex flex-col gap-0.5 overflow-y-auto pb-3">
                        {PAGES.map((group) => (
                            <div key={group.section[0]} className="flex flex-col gap-0.5">
                                <SidebarHeader>{t(group.section)}</SidebarHeader>
                                {group.pages.map((p) => (
                                    <SidebarRow key={p.id} icon={p.icon} label={t(p.title)} selected={p.id === page} onClick={() => setPage(p.id)} />
                                ))}
                            </div>
                        ))}
                    </nav>
                )}
            </section>

            <main className="flex min-w-0 flex-1 flex-col">
                {mode === "insights" ? (
                    <>
                        <TitleBar title={t(PAGES.flatMap((g) => g.pages).find((p) => p.id === page)!.title)} subtitle={t(server.name)}>
                            <div className={cn(CAPSULE, "px-0.5")}>{consoleButton}</div>
                        </TitleBar>
                        <InsightsPage page={page} server={server} />
                    </>
                ) : entry && keyName ? (
                    <>
                        <TitleBar title={<span className="font-mono">{keyName}</span>} subtitle={keySubtitle(entry, t)}>
                            <div className={cn(CAPSULE, "relative gap-0.5 px-0.5")}>
                                <ToolButton grouped icon="timer" label={t(["Expiry", "过期时间", "到期時間"])} active={menu === "expiry"} onClick={() => setMenu((m) => (m === "expiry" ? null : "expiry"))} />
                                <ToolButton grouped icon="trash" label={t(["Delete", "删除", "刪除"])} active={menu === "delete"} onClick={() => setMenu((m) => (m === "delete" ? null : "delete"))} />
                                {consoleButton}
                                <Popover open={menu === "expiry"} onClose={() => setMenu(null)} className="w-40">
                                    {EXPIRY.map(([label, seconds]) => (
                                        <button key={label[0]} type="button" className="block w-full rounded-md px-2 py-1 text-left hover:bg-[#007aff] hover:text-white" onClick={() => { entry.expiresAt = seconds === null ? null : Date.now() + seconds * 1000; setMenu(null); changed(); }}>
                                            {t(label)}
                                        </button>
                                    ))}
                                </Popover>
                                <Popover open={menu === "delete"} onClose={() => setMenu(null)} className="w-60 p-3">
                                    <p className="font-semibold">{t([`Delete “${keyName}”?`, `删除“${keyName}”？`, `刪除「${keyName}」？`])}</p>
                                    <p className={cn("mt-1", MAC.muted)}>{t([`The key and its value are removed from db${dbIndex}. This can't be undone.`, `这个 Key 及其值会从 db${dbIndex} 中删除，无法撤销。`, `這個 Key 及其值會從 db${dbIndex} 中刪除，無法還原。`])}</p>
                                    <div className="mt-3 flex justify-end gap-2">
                                        <button type="button" className={cn("h-7 rounded-md px-3", MAC.field)} onClick={() => setMenu(null)}>{t(["Cancel", "取消", "取消"])}</button>
                                        <button type="button" className="h-7 rounded-md bg-[#ff3b30] px-3 font-medium text-white" onClick={() => { delete db[keyName]; setKeys((k) => ({ ...k, [serverId]: null })); setMenu(null); }}>{t(["Delete", "删除", "刪除"])}</button>
                                    </div>
                                </Popover>
                            </div>
                        </TitleBar>
                        <TTLBar entry={entry} now={now} />
                        <ValueEditor key={`${serverId}:${dbIndex}:${keyName}`} entry={entry} onChange={changed} />
                    </>
                ) : (
                    <>
                        <TitleBar title=""><div className={cn(CAPSULE, "px-0.5")}>{consoleButton}</div></TitleBar>
                        <Unavailable icon="key" title={keyName ? t(["Key Expired", "Key 已过期", "Key 已到期"]) : t(["No Key Selected", "未选择 Key", "未選擇 Key"])}>
                            {keyName
                                ? t([`${keyName} reached its TTL and was removed.`, `${keyName} 已到达 TTL，被删除了。`, `${keyName} 已到達 TTL，被刪除了。`])
                                : t(["Select a key to see its value.", "选择一个 Key 查看它的值。", "選擇一個 Key 查看它的值。"])}
                        </Unavailable>
                    </>
                )}
            </main>

            <Inspector open={consoleOpen} width={360}>
                <Console
                    server={server}
                    db={dbIndex}
                    lines={lines[serverId] ?? []}
                    onLines={(l) => setLines((all) => ({ ...all, [serverId]: l }))}
                    onDb={(n) => setDbs((d) => ({ ...d, [serverId]: n }))}
                    onChange={changed}
                    onClose={() => setConsoleOpen(false)}
                />
            </Inspector>
        </MacWindow>
    );
}
