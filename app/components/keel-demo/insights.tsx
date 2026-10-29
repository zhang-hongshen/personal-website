import { useEffect, useState, type ReactNode } from "react";

import { useLang, useText, locale, type L } from "~/components/demo-text";
import { MAC } from "~/components/mac-ui";
import type { SymbolName } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { TYPES, memoryOf, type KeyType, type Server } from "./data";
import { TypeBadge } from "./browser";

// Insights (InsightsSidebar, ServerMonitorView, AnalysisView): the server's state and where its memory
// goes. Server numbers are made up and move a little each second; the data pages read the real keys.

export type Page = "overview" | "clients" | "commands" | "slowlog" | "configuration" | "memory" | "prefixes" | "largest";

const MEMORY: L = ["Memory", "内存", "記憶體"];
const COMMAND: L = ["Command", "命令", "指令"];

export const PAGES: { section: L; pages: { id: Page; title: L; icon: SymbolName }[] }[] = [
    {
        section: ["Server", "服务器", "伺服器"], pages: [
            { id: "overview", title: ["Overview", "概览", "概覽"], icon: "gauge.with.dots.needle.33percent" },
            { id: "clients", title: ["Clients", "客户端", "用戶端"], icon: "person.2" },
            { id: "commands", title: ["Commands", "命令", "指令"], icon: "chart.bar" },
            { id: "slowlog", title: ["Slow Log", "慢日志", "慢查詢日誌"], icon: "tortoise" },
            { id: "configuration", title: ["Configuration", "配置", "設定"], icon: "slider.horizontal.3" },
        ],
    },
    {
        section: ["Data", "数据", "資料"], pages: [
            { id: "memory", title: MEMORY, icon: "memorychip" },
            { id: "prefixes", title: ["Prefixes", "前缀", "前綴"], icon: "folder" },
            { id: "largest", title: ["Largest Keys", "最大的 Key", "最大的 Key"], icon: "list.number" },
        ],
    },
];

const bytes = (n: number) => (n >= 1 << 20 ? `${(n / (1 << 20)).toFixed(2)} MB` : n >= 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`);

export function InsightsPage({ page, server }: { page: Page; server: Server }) {
    const s = useText();
    const keys = server.keyspace.flatMap((db, i) => Object.entries(db).map(([name, entry]) => ({ name, entry, db: i })));
    switch (page) {
        case "overview": return <Overview server={server} keys={keys.length} />;
        case "clients":
            return <Table head={["ID", ["Address", "地址", "位址"], ["Name", "名称", "名稱"], ["Age", "连接时长", "連線時長"], COMMAND]} rows={[
                ["7", "127.0.0.1:52144", "keel", "2m", "client|list"],
                ["12", "10.0.4.17:40122", "api-1", "3d", "get"],
                ["13", "10.0.4.18:40876", "api-2", "3d", "hgetall"],
                ["21", "10.0.6.2:51002", "worker-3", "11h", "brpop"],
            ]} />;
        case "commands":
            return <Table head={[COMMAND, ["Calls", "调用次数", "呼叫次數"], ["µs per Call", "每次耗时 (µs)", "每次耗時 (µs)"]]} numeric={[false, true, true]} rows={[
                ["get", "4,182,331", "1.21"], ["hgetall", "912,804", "3.87"], ["set", "604,119", "1.64"],
                ["expire", "511,020", "0.92"], ["lrange", "88,213", "6.40"], ["zadd", "41,977", "4.15"],
            ]} />;
        case "slowlog":
            return <Table head={["ID", ["Time", "时间", "時間"], ["Duration", "耗时", "耗時"], COMMAND]} rows={[
                ["31", "19:02:14", "18.4 ms", "KEYS session:*"],
                ["30", "17:45:52", "12.1 ms", "HGETALL config:feature_flags"],
                ["29", "15:20:08", "10.7 ms", "LRANGE queue:thumbnails 0 -1"],
            ]} />;
        case "configuration":
            return <Table head={[["Parameter", "参数", "參數"], ["Value", "值", "值"]]} rows={[
                ["maxmemory", "1gb"], ["maxmemory-policy", "allkeys-lru"], ["appendonly", "yes"], ["save", "3600 1 300 100 60 10000"],
                ["timeout", "0"], ["databases", "16"], ["io-threads", "4"],
            ]} />;
        case "memory": {
            const byType = new Map<KeyType, number>();
            for (const k of keys) byType.set(k.entry.data.type, (byType.get(k.entry.data.type) ?? 0) + memoryOf(k.entry));
            const rows = [...byType].sort((a, b) => b[1] - a[1]);
            const total = rows.reduce((n, [, v]) => n + v, 0);
            return (
                <Bars total={total} rows={rows.map(([type, value]) => ({ label: <span className="flex items-center gap-2"><TypeBadge type={type} />{s(TYPES[type].name)}</span>, value, color: TYPES[type].color }))} />
            );
        }
        case "prefixes": {
            const byPrefix = new Map<string, number>();
            for (const k of keys) { const p = k.name.includes(":") ? `${k.name.split(":")[0]}:*` : k.name; byPrefix.set(p, (byPrefix.get(p) ?? 0) + memoryOf(k.entry)); }
            const rows = [...byPrefix].sort((a, b) => b[1] - a[1]);
            return <Bars total={rows.reduce((n, [, v]) => n + v, 0)} rows={rows.map(([p, value]) => ({ label: <span className="font-mono">{p}</span>, value, color: "#007aff" }))} />;
        }
        case "largest":
            return <Table head={["Key", ["Type", "类型", "類型"], ["Database", "数据库", "資料庫"], MEMORY]} numeric={[false, false, false, true]} rows={
                [...keys].sort((a, b) => memoryOf(b.entry) - memoryOf(a.entry)).slice(0, 10).map((k) => [k.name, s(TYPES[k.entry.data.type].name), `db${k.db}`, bytes(memoryOf(k.entry))])
            } />;
    }
}

function Overview({ server, keys }: { server: Server; keys: number }) {
    const s = useText();
    const lang = useLang();
    const [ops, setOps] = useState<number[]>(() => Array.from({ length: 40 }, (_, i) => 1200 + Math.round(Math.sin(i / 4) * 180)));
    useEffect(() => {
        const timer = setInterval(() => setOps((o) => [...o.slice(1), Math.max(300, Math.round(o[o.length - 1] + (Math.random() - 0.5) * 240))]), 1000);
        return () => clearInterval(timer);
    }, []);
    const max = Math.max(...ops) * 1.15;
    const stats: [L, string][] = [
        [["Version", "版本", "版本"], `${server.product} ${server.version}`], [["Uptime", "运行时间", "執行時間"], s(["12 days", "12 天", "12 天"])],
        [["Used Memory", "已用内存", "已用記憶體"], "18.42 MB"], [["Clients", "客户端", "用戶端"], "4"],
        [["Ops per Second", "每秒操作数", "每秒操作數"], ops[ops.length - 1].toLocaleString(locale(lang))], [["Hit Rate", "命中率", "命中率"], "96.8%"],
        [["Keys", "Key 数", "Key 數"], keys.toLocaleString(locale(lang))], [["Evicted Keys", "已驱逐 Key", "已逐出 Key"], "0"],
    ];
    return (
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
            <div className="grid grid-cols-4 gap-2">
                {stats.map(([label, value]) => (
                    <div key={label[0]} className={cn("rounded-xl border p-3", MAC.line)}>
                        <p className={cn("text-[11px]", MAC.muted)}>{s(label)}</p>
                        <p className="mt-0.5 text-[17px] font-semibold tabular-nums">{value}</p>
                    </div>
                ))}
            </div>
            <div className={cn("rounded-xl border p-3", MAC.line)}>
                <p className="mb-2 text-[12px] font-semibold">{s(["Operations per Second", "每秒操作数", "每秒操作數"])}</p>
                <svg viewBox="0 0 400 120" className="h-32 w-full" preserveAspectRatio="none" role="img" aria-label={s(["Operations per second over the last 40 seconds", "最近 40 秒的每秒操作数", "最近 40 秒的每秒操作數"])}>
                    <path d={`M0 120 ${ops.map((v, i) => `L${(i / (ops.length - 1)) * 400} ${120 - (v / max) * 120}`).join(" ")} L400 120 Z`} fill="#007aff" fillOpacity="0.12" />
                    <path d={ops.map((v, i) => `${i ? "L" : "M"}${(i / (ops.length - 1)) * 400} ${120 - (v / max) * 120}`).join(" ")} fill="none" stroke="#007aff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
            </div>
        </div>
    );
}

function Bars({ rows, total }: { rows: { label: ReactNode; value: number; color: string }[]; total: number }) {
    const s = useText();
    return (
        <div className="flex flex-col gap-2.5 overflow-y-auto p-4">
            <p className={cn("text-[12px]", MAC.muted)}>{s([`${bytes(total)} in all`, `共 ${bytes(total)}`, `共 ${bytes(total)}`])}</p>
            {rows.map((r, i) => (
                <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[12px]">{r.label}<span className={cn("tabular-nums", MAC.muted)}>{bytes(r.value)} · {Math.round((r.value / total) * 100)}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/6 dark:bg-white/8">
                        <div className="h-full rounded-full" style={{ width: `${(r.value / total) * 100}%`, background: r.color }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function Table({ head, rows, numeric = [] }: { head: (L | string)[]; rows: string[][]; numeric?: boolean[] }) {
    const s = useText();
    return (
        <div className="min-h-0 overflow-auto">
            <table className="w-full text-[12px]">
                <thead className={cn("sticky top-0", MAC.window)}>
                    <tr className={cn("border-b text-left", MAC.line)}>{head.map((h, i) => <th key={i} className={cn("px-4 py-1.5 font-semibold", numeric[i] && "text-right")}>{s(h)}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className={MAC.stripe}>{r.map((v, j) => <td key={j} className={cn("px-4 py-1.5 font-mono whitespace-nowrap", numeric[j] && "text-right tabular-nums")}>{v}</td>)}</tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
