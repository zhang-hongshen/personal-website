import { useCallback, useEffect, useState } from "react";

import { Inspector, MAC, MacSidebar, MacWindow, Popover, Segmented, ShowSidebarButton, SidebarHeader, SidebarRow, TitleBar, ToolButton, Unavailable, useSidebar } from "~/components/mac-ui";
import { CAPSULE } from "~/components/mac-window";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { KeyBrowser } from "./browser";
import { Console, type Line } from "./console";
import { newServer, servers as initialServers, type Server } from "./data";
import { InsightsPage, PAGES, type Page } from "./insights";
import { expire } from "./redis";
import { TTLBar, ValueEditor, keySubtitle } from "./value";

// A Keel window that works like the app: connections in the sidebar, the key browser or Insights in
// the middle, the selected key's value on the right, and the command console in the inspector. The
// keyspace lives in the page, keys with a TTL expire on time, and a reload starts over.

const EXPIRY: [string, number | null][] = [["No Expiry", null], ["1 Minute", 60], ["10 Minutes", 600], ["1 Hour", 3600], ["1 Day", 86400]];

export function KeelDemo({ className }: { className?: string }) {
    const sidebar = useSidebar();
    const [servers, setServers] = useState<Server[]>(initialServers);
    const [serverId, setServerId] = useState("local");
    const [dbs, setDbs] = useState<Record<string, number>>({});
    const [keys, setKeys] = useState<Record<string, string | null>>({ local: "user:1001" });
    const [mode, setMode] = useState<"browse" | "insights">("browse");
    const [page, setPage] = useState<Page>("overview");
    const [consoleOpen, setConsoleOpen] = useState(false);
    const [lines, setLines] = useState<Record<string, Line[]>>({});
    const [menu, setMenu] = useState<"expiry" | "delete" | null>(null);
    // Narrow screens show the key list or the detail, not both.
    const [showDetail, setShowDetail] = useState(false);
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
        sidebar.done();
    };
    const selectKey = (name: string) => {
        setKeys((k) => ({ ...k, [serverId]: name }));
        setMenu(null);
        setShowDetail(true);
    };
    const addServer = () => {
        const added = newServer();
        if (!servers.some((s) => s.id === added.id)) setServers((ss) => [...ss, added]);
        openServer(added.id);
    };

    const consoleButton = <ToolButton grouped icon="terminal" label="Console" active={consoleOpen} onClick={() => setConsoleOpen((o) => !o)} />;
    const back = (
        <button type="button" aria-label="Back" className={cn("flex size-8 items-center justify-center rounded-full md:hidden", MAC.field)} onClick={() => setShowDetail(false)}>
            <SFSymbol name="chevron.left" className="size-3.5" />
        </button>
    );

    return (
        <MacWindow className={className}>
            <MacSidebar sidebar={sidebar} toolbar={<ToolButton icon="plus" label="New Connection" onClick={addServer} />}>
                <SidebarHeader>Connections</SidebarHeader>
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
                                <span className="truncate">{s.name}</span>
                                <span className={cn("truncate text-[11px]", s.id === serverId ? "text-white/75" : MAC.muted)}>{s.address}</span>
                            </span>
                            {s.id === serverId && <span className="size-2 shrink-0 rounded-full bg-[#34c759] ring-2 ring-white/70" aria-label="Connected" />}
                        </button>
                    ))}
                </nav>
            </MacSidebar>

            <section className={cn("flex w-full shrink-0 flex-col border-r md:w-[300px]", MAC.line, showDetail && mode === "browse" && "max-md:hidden")}>
                <TitleBar leading={<ShowSidebarButton sidebar={sidebar} />} title={server.name} subtitle={`${server.product} ${server.version}`}>
                    <select
                        aria-label="Database"
                        value={dbIndex}
                        className={cn(CAPSULE, "px-2.5 text-[12px] outline-none")}
                        onChange={(e) => { setDbs((d) => ({ ...d, [serverId]: Number(e.target.value) })); setKeys((k) => ({ ...k, [serverId]: null })); }}
                    >
                        {server.keyspace.map((d, i) => <option key={i} value={i}>db{i}{Object.keys(d).length ? ` · ${Object.keys(d).length}` : ""}</option>)}
                    </select>
                    <span className="md:hidden"><div className={cn(CAPSULE, "px-0.5")}>{consoleButton}</div></span>
                </TitleBar>
                <div className="px-3 pb-2">
                    <Segmented options={[{ value: "browse", label: "Browse" }, { value: "insights", label: "Insights" }]} value={mode} onChange={setMode} className="w-full" />
                </div>
                {mode === "browse" ? (
                    <KeyBrowser db={db} selected={keyName} now={now} onSelect={selectKey} />
                ) : (
                    <nav className="flex flex-col gap-0.5 overflow-y-auto pb-3">
                        {PAGES.map((group) => (
                            <div key={group.section} className="flex flex-col gap-0.5">
                                <SidebarHeader>{group.section}</SidebarHeader>
                                {group.pages.map((p) => (
                                    <SidebarRow key={p.id} icon={p.icon} label={p.title} selected={p.id === page} onClick={() => { setPage(p.id); setShowDetail(true); }} />
                                ))}
                            </div>
                        ))}
                    </nav>
                )}
            </section>

            <main className={cn("flex min-w-0 flex-1 flex-col", !showDetail && "max-md:hidden")}>
                {mode === "insights" ? (
                    <>
                        <TitleBar leading={back} title={PAGES.flatMap((g) => g.pages).find((p) => p.id === page)!.title} subtitle={server.name}>
                            <div className={cn(CAPSULE, "px-0.5 max-md:hidden")}>{consoleButton}</div>
                        </TitleBar>
                        <InsightsPage page={page} server={server} />
                    </>
                ) : entry && keyName ? (
                    <>
                        <TitleBar leading={back} title={<span className="font-mono">{keyName}</span>} subtitle={keySubtitle(entry)}>
                            <div className={cn(CAPSULE, "relative gap-0.5 px-0.5")}>
                                <ToolButton grouped icon="timer" label="Expiry" active={menu === "expiry"} onClick={() => setMenu((m) => (m === "expiry" ? null : "expiry"))} />
                                <ToolButton grouped icon="trash" label="Delete" active={menu === "delete"} onClick={() => setMenu((m) => (m === "delete" ? null : "delete"))} />
                                <span className="max-md:hidden">{consoleButton}</span>
                                <Popover open={menu === "expiry"} onClose={() => setMenu(null)} className="w-40">
                                    {EXPIRY.map(([label, seconds]) => (
                                        <button key={label} type="button" className="block w-full rounded-md px-2 py-1 text-left hover:bg-[#007aff] hover:text-white" onClick={() => { entry.expiresAt = seconds === null ? null : Date.now() + seconds * 1000; setMenu(null); changed(); }}>
                                            {label}
                                        </button>
                                    ))}
                                </Popover>
                                <Popover open={menu === "delete"} onClose={() => setMenu(null)} className="w-60 p-3">
                                    <p className="font-semibold">Delete “{keyName}”?</p>
                                    <p className={cn("mt-1", MAC.muted)}>The key and its value are removed from db{dbIndex}. This can't be undone.</p>
                                    <div className="mt-3 flex justify-end gap-2">
                                        <button type="button" className={cn("h-7 rounded-md px-3", MAC.field)} onClick={() => setMenu(null)}>Cancel</button>
                                        <button type="button" className="h-7 rounded-md bg-[#ff3b30] px-3 font-medium text-white" onClick={() => { delete db[keyName]; setKeys((k) => ({ ...k, [serverId]: null })); setMenu(null); setShowDetail(false); }}>Delete</button>
                                    </div>
                                </Popover>
                            </div>
                        </TitleBar>
                        <TTLBar entry={entry} now={now} />
                        <ValueEditor key={`${serverId}:${dbIndex}:${keyName}`} entry={entry} onChange={changed} />
                    </>
                ) : (
                    <>
                        <TitleBar leading={back} title="" ><div className={cn(CAPSULE, "px-0.5 max-md:hidden")}>{consoleButton}</div></TitleBar>
                        <Unavailable icon="key" title={keyName ? "Key Expired" : "No Key Selected"}>{keyName ? `${keyName} reached its TTL and was removed.` : "Select a key to see its value."}</Unavailable>
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
