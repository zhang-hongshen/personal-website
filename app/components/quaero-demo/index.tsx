import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useText, type L } from "~/components/demo-text";
import { Inspector, MAC, MacSidebar, MacWindow, SearchField, ShowSidebarButton, SidebarHeader, SidebarRow, Spinner, TitleBar, ToolButton, Unavailable, useSidebar } from "~/components/mac-ui";
import { CAPSULE } from "~/components/mac-window";
import { SFSymbol, type SymbolName } from "~/components/sf-symbol";
import { useTour, type Tour } from "~/components/tour";
import { cn } from "~/lib/utils";
import { CONNECTIONS, KIND_NAME, NEW_CONNECTION, SAMPLE_SQL, createStatement, isVectorDB, type Connection, type Kind, type Table, type Value } from "./data";
import { runRequest, similarRequest } from "./rest";
import { run, type Result } from "./sql";
import { parseVector } from "./vector";
import { VectorCell, VectorDetail, VectorMenu, dimensionsOf, type Metric } from "./vectors";

// A Quaero window that works like the app (Docs/Features in its repository): connections in the
// sidebar, the schema browser, the table's rows with a filter bar and in-place editing, vectors with
// Find Similar Rows, and the inspector with Table Info, the console (SQL, or REST for Qdrant and
// Milvus) or a vector's details. The databases live in the page; a reload starts over.

const KIND_ICON: Record<Kind, SymbolName> = { postgresql: "cylinder.split.1x2", mysql: "cylinder", sqlite: "doc", qdrant: "circle.hexagongrid", milvus: "circle.hexagongrid.fill" };
const isVectorColumn = (type: string) => /vector/i.test(type);

type Operator = { id: string; label: L; test: (v: Value, x: string) => boolean; noValue?: boolean };
const text = (v: Value) => String(v ?? "").toLowerCase();
const cmp = (v: Value, x: string) => (typeof v === "number" ? v - Number(x) : String(v ?? "").localeCompare(x));
const OPERATORS: Operator[] = [
    { id: "eq", label: ["equals", "等于", "等於"], test: (v, x) => v !== null && text(v) === x.toLowerCase() },
    { id: "ne", label: ["does not equal", "不等于", "不等於"], test: (v, x) => v !== null && text(v) !== x.toLowerCase() },
    { id: "gt", label: ["greater than", "大于", "大於"], test: (v, x) => v !== null && cmp(v, x) > 0 },
    { id: "lt", label: ["less than", "小于", "小於"], test: (v, x) => v !== null && cmp(v, x) < 0 },
    { id: "ge", label: ["greater than or equal to", "大于或等于", "大於或等於"], test: (v, x) => v !== null && cmp(v, x) >= 0 },
    { id: "le", label: ["less than or equal to", "小于或等于", "小於或等於"], test: (v, x) => v !== null && cmp(v, x) <= 0 },
    { id: "has", label: ["contains", "包含", "包含"], test: (v, x) => v !== null && text(v).includes(x.toLowerCase()) },
    { id: "lacks", label: ["does not contain", "不包含", "不包含"], test: (v, x) => v !== null && !text(v).includes(x.toLowerCase()) },
    { id: "starts", label: ["begins with", "开头是", "開頭是"], test: (v, x) => v !== null && text(v).startsWith(x.toLowerCase()) },
    { id: "ends", label: ["ends with", "结尾是", "結尾是"], test: (v, x) => v !== null && text(v).endsWith(x.toLowerCase()) },
    { id: "null", label: ["is NULL", "为 NULL", "為 NULL"], test: (v) => v === null, noValue: true },
    { id: "notnull", label: ["is not NULL", "不为 NULL", "不為 NULL"], test: (v) => v !== null, noValue: true },
];
const CLOSE: L = ["Close", "关闭", "關閉"];
const CONSOLE: L = ["Console", "控制台", "主控台"];
const TABLE_INFO: L = ["Table Info", "表信息", "表格資訊"];
const NO_TABLE: L = ["No Table Selected", "未选择表", "未選擇表格"];

type Condition = { column: string; op: string; value: string };
/** The parts of the app a tour walks through: SQL tables, the console beside them, and vector collections. */
export type QuaeroStop = "sql" | "console" | "vector";

export function QuaeroDemo({ className, tour }: { className?: string; tour?: Tour<QuaeroStop> }) {
    const s = useText();
    const sidebar = useSidebar();
    const [connections, setConnections] = useState<Connection[]>(() => structuredClone(CONNECTIONS));
    const [connectionId, setConnectionId] = useState("shop");
    // The database and table open in each connection.
    const [databases, setDatabases] = useState<Record<string, string>>({});
    const [tables, setTables] = useState<Record<string, string>>({});
    const [inspector, setInspector] = useState<"info" | "console" | "vector" | null>(null);
    // The outlined cell, which the vector panel follows, and the open context menu.
    const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
    const [menu, setMenu] = useState<{ x: number; y: number; row: number; col: number } | null>(null);
    const [tableQuery, setTableQuery] = useState("");
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [applied, setApplied] = useState<{ conditions: Condition[]; all: boolean } | null>(null);
    const [matchAll, setMatchAll] = useState(true);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState<{ row: number; col: number } | null>(null);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [sql, setSql] = useState<Record<string, string>>({});
    const [results, setResults] = useState<Record<string, Result[]>>({});
    const [resultIndex, setResultIndex] = useState(0);
    const [, redraw] = useState(0);

    const connection = connections.find((c) => c.id === connectionId)!;
    const database = connection.databases.find((d) => d.name === databases[connectionId]) ?? connection.databases[0];
    const visibleTables = database.tables.filter((t) => t.name.toLowerCase().includes(tableQuery.trim().toLowerCase()));
    const table: Table | undefined = database.tables.find((t) => t.name === tables[connectionId]) ?? database.tables[0];

    // A new table or connection starts unfiltered, with nothing selected.
    useEffect(() => {
        setConditions(table ? [{ column: table.columns[0].name, op: "eq", value: "" }] : []);
        setApplied(null);
        setEditing(null);
        setSelectedRow(null);
        setActiveCell(null);
    }, [table?.name, connectionId, database.name]);

    useEffect(() => {
        if (!loading) return;
        const timer = setTimeout(() => setLoading(false), 350);
        return () => clearTimeout(timer);
    }, [loading]);

    // Vectors can't be compared to a typed value, so a condition on one fails in place of the rows.
    const filterError = applied && table && applied.conditions.some((c) => isVectorColumn(table.columns.find((x) => x.name === c.column)?.type ?? ""))
        ? s(["Conditions on vector columns aren't supported. Use Find Similar Rows instead.", "不支持对向量列设置条件，请改用“查找相似行”。", "不支援對向量欄設定條件，請改用「尋找相似列」。"])
        : null;
    const rows = useMemo(() => {
        if (!table || filterError) return [];
        const indexed = table.rows.map((values, index) => ({ values, index }));
        if (!applied) return indexed;
        const tests = applied.conditions.map((c) => {
            const op = OPERATORS.find((o) => o.id === c.op)!;
            const at = table.columns.findIndex((x) => x.name === c.column);
            return (values: Value[]) => op.test(values[at], c.value);
        });
        return indexed.filter(({ values }) => (applied.all ? tests.every((t) => t(values)) : tests.some((t) => t(values))));
    }, [table, applied, table?.rows, filterError]);

    const openConnection = (id: string) => {
        setConnectionId(id);
        setTableQuery("");
        setResultIndex(0);
    };
    const openTable = (name: string) => {
        setTables((t) => ({ ...t, [connectionId]: name }));
        setLoading(true);
    };
    useTour(tour, inspector === "console" ? "console" : isVectorDB(connection.kind) ? "vector" : "sql", (stop) => {
        if (stop === "console") return setInspector("console");
        setInspector((i) => (i === "console" ? null : i));
        if (stop === "vector" && !isVectorDB(connection.kind)) openConnection("vectors");
        if (stop === "sql" && isVectorDB(connection.kind)) openConnection("shop");
    });
    const addConnection = () => {
        if (connections.some((c) => c.id === NEW_CONNECTION.id)) return openConnection(NEW_CONNECTION.id);
        setConnections((cs) => [...cs, structuredClone(NEW_CONNECTION)]);
        openConnection(NEW_CONNECTION.id);
    };

    const commitEdit = (rowIndex: number, col: number, raw: string) => {
        if (!table) return;
        const column = table.columns[col];
        const old = table.rows[rowIndex][col];
        const value: Value = raw === "" && column.nullable ? null : typeof old === "number" && raw.trim() !== "" && !Number.isNaN(Number(raw)) ? Number(raw) : typeof old === "boolean" ? raw === "true" : raw;
        table.rows[rowIndex] = table.rows[rowIndex].map((v, i) => (i === col ? value : v));
        setEditing(null);
        redraw((n) => n + 1);
    };

    const runConsole = (override?: string) => {
        const text = override ?? sql[connection.kind] ?? SAMPLE_SQL[connection.kind];
        const out = isVectorDB(connection.kind) ? [runRequest(text, database, connection.kind)] : run(text, database, connection.kind);
        setResults((r) => ({ ...r, [connectionId]: out }));
        setResultIndex(out.length - 1);
        redraw((n) => n + 1);
    };

    /** Writes the search for the rows nearest a vector cell into the console and runs it (VectorColumns.md). */
    const findSimilar = (row: number, col: number, metric: Metric = "<=>") => {
        if (!table) return;
        const vector = String(table.rows[row][col]);
        const column = table.columns[col].name;
        const [schema, name] = table.name.includes(".") ? table.name.split(".") : [null, table.name];
        const text = isVectorDB(connection.kind)
            ? similarRequest(connection.kind, table, vector)
            : `SELECT *, "${column}" ${metric} '${vector}' AS distance\nFROM ${schema ? `"${schema}".` : ""}"${name}"\nORDER BY distance\nLIMIT 20;`;
        setSql((all) => ({ ...all, [connection.kind]: text }));
        setInspector("console");
        setMenu(null);
        runConsole(text);
    };

    const exportRows = (format: "csv" | "json") => {
        if (!table) return;
        const names = table.columns.map((c) => c.name);
        const body = format === "csv"
            ? [names, ...rows.map((r) => r.values)].map((r) => r.map((v) => (v === null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))).join(",")).join("\n")
            : JSON.stringify(rows.map((r) => Object.fromEntries(names.map((n, i) => [n, r.values[i]]))), null, 2);
        const url = URL.createObjectURL(new Blob([body], { type: format === "csv" ? "text/csv" : "application/json" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `${table.name.split(".").pop()}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <MacWindow className={className}>
            <MacSidebar sidebar={sidebar} toolbar={<ToolButton icon="plus" label={s(["New Connection", "新建连接", "新增連線"])} onClick={addConnection} />}>
                <SidebarHeader>{s(["Connections", "连接", "連線"])}</SidebarHeader>
                <nav className="flex flex-col gap-0.5 overflow-y-auto pb-3">
                    {connections.map((c) => (
                        <SidebarRow
                            key={c.id}
                            className="h-11"
                            icon={KIND_ICON[c.kind]}
                            selected={c.id === connectionId}
                            label={<span className="flex flex-col leading-tight"><span className="truncate">{c.name}</span><span className={cn("truncate text-[11px]", c.id === connectionId ? "text-white/75" : MAC.muted)}>{c.summary}</span></span>}
                            detail={c.id === connectionId && <span className="block size-2 rounded-full bg-[#34c759] ring-2 ring-white/70" aria-label={s(["Connected", "已连接", "已連線"])} />}
                            onClick={() => openConnection(c.id)}
                        />
                    ))}
                </nav>
            </MacSidebar>

            {/* The schema browser. On narrow screens the table picker moves into the detail's title bar. */}
            <section className={cn("flex w-[220px] shrink-0 flex-col border-r", MAC.line)}>
                <TitleBar leading={<ShowSidebarButton sidebar={sidebar} />} title={connection.name} subtitle={KIND_NAME[connection.kind]} />
                <div className="flex flex-col gap-2 px-3 pb-2">
                    {connection.databases.length > 1 && (
                        <select
                            aria-label={s(["Database", "数据库", "資料庫"])}
                            value={database.name}
                            className={cn("h-7 px-2", MAC.field)}
                            onChange={(e) => {
                                setDatabases((d) => ({ ...d, [connectionId]: e.target.value }));
                                setTables((t) => ({ ...t, [connectionId]: "" }));
                            }}
                        >
                            {connection.databases.map((d) => <option key={d.name}>{d.name}</option>)}
                        </select>
                    )}
                    <SearchField value={tableQuery} placeholder={isVectorDB(connection.kind) ? s(["Filter Collections", "筛选集合", "篩選集合"]) : s(["Filter Tables", "筛选表", "篩選表格"])} onChange={setTableQuery} className="w-full" />
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pb-3 [&>button]:mx-1.5">
                    {visibleTables.map((t) => (
                        <SidebarRow key={t.name} icon={t.kind === "view" ? "eye" : t.kind === "collection" ? "circle.grid.3x3" : "tablecells"} iconClass={MAC.muted} label={t.name} selected={t === table} onClick={() => openTable(t.name)} />
                    ))}
                    {database.tables.length === 0 && (isVectorDB(connection.kind) ? <Unavailable icon="circle.grid.3x3" title={s(["No Collections", "没有集合", "沒有集合"])} /> : <Unavailable icon="tablecells" title={s(["No Tables", "没有表", "沒有表格"])} />)}
                </div>
            </section>

            <main className="flex min-w-0 flex-1 flex-col">
                <TitleBar
                    leading={<ShowSidebarButton sidebar={sidebar} />}
                    title={table?.name ?? s(NO_TABLE)}
                    subtitle={database.name}
                >
                    <div className={cn(CAPSULE, "gap-0.5 px-0.5")}>
                        <ToolButton grouped icon="arrow.clockwise" label={s(["Refresh", "刷新", "重新整理"])} onClick={() => setLoading(true)} disabled={!table} />
                        <ToolButton grouped icon="terminal" label={s(CONSOLE)} active={inspector === "console"} onClick={() => setInspector((i) => (i === "console" ? null : "console"))} />
                        <ToolButton grouped icon="info.circle" label={s(TABLE_INFO)} active={inspector === "info"} disabled={!table} onClick={() => setInspector((i) => (i === "info" ? null : "info"))} />
                    </div>
                    <ExportMenu disabled={!table} onExport={exportRows} />
                </TitleBar>

                {table ? (
                    <>
                        <FilterBar
                            kind={connection.kind}
                            table={table}
                            conditions={conditions}
                            matchAll={matchAll}
                            onChange={setConditions}
                            onMatchAll={setMatchAll}
                            onFilter={() => { setApplied({ conditions, all: matchAll }); setLoading(true); }}
                            onClear={() => { setApplied(null); setConditions([{ column: table.columns[0].name, op: "eq", value: "" }]); setLoading(true); }}
                        />
                        <div className="relative min-h-0 flex-1 overflow-auto">
                            {loading ? (
                                <div className="flex h-full items-center justify-center"><Spinner className={cn("size-5", MAC.muted)} label={s(["Loading", "正在载入", "正在載入"])} /></div>
                            ) : (
                                <table className="w-max min-w-full border-collapse text-[12px] tabular-nums">
                                    <thead className={cn("sticky top-0 z-10", MAC.window)}>
                                        <tr className={cn("border-b text-left", MAC.line)}>
                                            {table.columns.map((c, col) => {
                                                const dims = isVectorColumn(c.type) ? dimensionsOf(rows.map((r) => r.values[col])) : null;
                                                return (
                                                    <th key={c.name} className={cn("border-r px-2 py-1.5 font-semibold whitespace-nowrap last:border-r-0", MAC.line, isVectorColumn(c.type) && "min-w-[220px]")} title={dims ? s([`${dims} dimensions`, `${dims} 维`, `${dims} 維`]) : undefined}>
                                                        {c.name}
                                                        {dims && <span className={cn("ml-2 font-normal", MAC.muted)}>{s([`${dims} dims`, `${dims} 维`, `${dims} 維`])}</span>}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map(({ values, index }) => (
                                            <tr key={index} className={cn(selectedRow === index ? MAC.selected : MAC.stripe)} onClick={() => setSelectedRow(index)}>
                                                {values.map((v, col) => (
                                                    <td
                                                        key={col}
                                                        className={cn(
                                                            "max-w-[260px] truncate px-2 py-1 whitespace-nowrap",
                                                            typeof v === "number" && "text-right",
                                                            activeCell?.row === index && activeCell.col === col && "outline-2 -outline-offset-2 outline-[#007aff] dark:outline-[#0a84ff]",
                                                        )}
                                                        onClick={() => setActiveCell({ row: index, col })}
                                                        onDoubleClick={() => table.kind === "table" && !isVectorColumn(table.columns[col].type) && setEditing({ row: index, col })}
                                                        onContextMenu={(e) => {
                                                            if (!parseVector(v)) return;
                                                            e.preventDefault();
                                                            setSelectedRow(index);
                                                            setActiveCell({ row: index, col });
                                                            setMenu({ x: e.clientX, y: e.clientY, row: index, col });
                                                        }}
                                                    >
                                                        {editing?.row === index && editing.col === col ? (
                                                            <CellField initial={v === null ? "" : String(v)} onDone={(raw) => (raw === null ? setEditing(null) : commitEdit(index, col, raw))} />
                                                        ) : v === null ? (
                                                            <span className={cn("italic", selectedRow === index ? "text-white/70" : MAC.muted)}>NULL</span>
                                                        ) : parseVector(v) ? (
                                                            <VectorCell value={v} />
                                                        ) : (
                                                            String(v)
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {!loading && filterError && <p className="m-4 flex gap-2 text-[12px] text-[#d70015] dark:text-[#ff6961]"><SFSymbol name="xmark.circle.fill" className="mt-0.5 size-3.5 shrink-0" />{filterError}</p>}
                            {!loading && !filterError && rows.length === 0 && <Unavailable icon="tablecells" title={s(["No Rows", "没有行", "沒有資料列"])}>{applied ? s(["No rows match the filter.", "没有符合筛选条件的行。", "沒有符合篩選條件的資料列。"]) : undefined}</Unavailable>}
                        </div>
                    </>
                ) : (
                    <Unavailable icon="tablecells" title={s(NO_TABLE)} />
                )}
            </main>

            <Inspector open={inspector !== null} width={340}>
                {inspector === "info" && table && <TableInfo kind={connection.kind} table={table} onClose={() => setInspector(null)} />}
                {inspector === "vector" && table && (
                    <VectorDetail
                        column={activeCell ? table.columns[activeCell.col].name : ""}
                        row={activeCell?.row ?? 0}
                        value={activeCell ? table.rows[activeCell.row]?.[activeCell.col] ?? null : null}
                        onClose={() => setInspector(null)}
                    />
                )}
                {inspector === "console" && (
                    <Console
                        rest={isVectorDB(connection.kind)}
                        database={connection.kind === "qdrant" ? null : database.name}
                        sql={sql[connection.kind] ?? SAMPLE_SQL[connection.kind]}
                        results={results[connectionId] ?? []}
                        resultIndex={resultIndex}
                        onSql={(text) => setSql((all) => ({ ...all, [connection.kind]: text }))}
                        onRun={() => runConsole()}
                        onPickResult={setResultIndex}
                        onClose={() => setInspector(null)}
                    />
                )}
            </Inspector>

            {menu && table && (
                <VectorMenu
                    at={menu}
                    kind={connection.kind}
                    indexed={table.indexes?.some((i) => i.includes("vector_cosine_ops")) ? "<=>" : null}
                    onSimilar={(metric) => findSimilar(menu.row, menu.col, metric)}
                    onDetails={() => { setInspector("vector"); setMenu(null); }}
                    onClose={() => setMenu(null)}
                />
            )}
        </MacWindow>
    );
}

function ExportMenu({ disabled, onExport }: { disabled: boolean; onExport: (format: "csv" | "json") => void }) {
    const s = useText();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
        document.addEventListener("pointerdown", close);
        return () => document.removeEventListener("pointerdown", close);
    }, [open]);
    return (
        <div ref={ref} className="relative">
            <ToolButton icon="square.and.arrow.up" label={s(["Export", "导出", "匯出"])} disabled={disabled} onClick={() => setOpen((o) => !o)} />
            {open && (
                <div className={cn("absolute top-9 right-0 z-30 w-44 rounded-lg border p-1 shadow-[0_10px_30px_rgb(0_0_0/0.2)]", MAC.line, MAC.window)}>
                    {(["csv", "json"] as const).map((f) => (
                        <button key={f} type="button" className="block w-full rounded-md px-2 py-1 text-left hover:bg-[#007aff] hover:text-white" onClick={() => { onExport(f); setOpen(false); }}>
                            {s([`Export as ${f.toUpperCase()}…`, `导出为 ${f.toUpperCase()}…`, `匯出為 ${f.toUpperCase()}…`])}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function FilterBar({ kind, table, conditions, matchAll, onChange, onMatchAll, onFilter, onClear }: {
    kind: Kind;
    table: Table;
    conditions: Condition[];
    matchAll: boolean;
    onChange: (conditions: Condition[]) => void;
    onMatchAll: (all: boolean) => void;
    onFilter: () => void;
    onClear: () => void;
}) {
    const s = useText();
    const set = (i: number, patch: Partial<Condition>) => onChange(conditions.map((c, j) => (j === i ? { ...c, ...patch } : c)));
    return (
        <div className={cn("flex flex-col gap-1.5 border-b px-3 pb-2", MAC.line)}>
            {conditions.length > 1 && (
                <select aria-label={s(["Match", "匹配", "符合"])} value={matchAll ? "all" : "any"} className={cn("h-6 self-start px-1.5 text-[12px]", MAC.field)} onChange={(e) => onMatchAll(e.target.value === "all")}>
                    <option value="all">{s(["Match All", "全部满足", "全部符合"])}</option>
                    <option value="any">{s(["Match Any", "满足任一", "符合任一"])}</option>
                </select>
            )}
            {conditions.map((c, i) => {
                const op = OPERATORS.find((o) => o.id === c.op)!;
                return (
                    <div key={i} className="flex flex-wrap items-center gap-1.5 text-[12px]">
                        <button type="button" aria-label={s(["Remove Condition", "移除条件", "移除條件"])} disabled={conditions.length === 1} className={cn("flex size-6 items-center justify-center rounded-md disabled:opacity-35", MAC.field)} onClick={() => onChange(conditions.filter((_, j) => j !== i))}>
                            <SFSymbol name="minus" className="w-2.5" />
                        </button>
                        <button type="button" aria-label={s(["Add Condition", "添加条件", "加入條件"])} className={cn("flex size-6 items-center justify-center rounded-md", MAC.field)} onClick={() => onChange([...conditions.slice(0, i + 1), { column: table.columns[0].name, op: "eq", value: "" }, ...conditions.slice(i + 1)])}>
                            <SFSymbol name="plus" className="size-2.5" />
                        </button>
                        <select aria-label={s(["Column", "列", "欄"])} value={c.column} className={cn("h-6 px-1.5", MAC.field)} onChange={(e) => set(i, { column: e.target.value })}>
                            {table.columns.map((col) => <option key={col.name}>{col.name}</option>)}
                        </select>
                        <select aria-label={s(["Operator", "运算符", "運算子"])} value={c.op} className={cn("h-6 px-1.5", MAC.field)} onChange={(e) => set(i, { op: e.target.value })}>
                            {OPERATORS.filter((o) => kind !== "qdrant" || (o.id !== "starts" && o.id !== "ends")).map((o) => <option key={o.id} value={o.id}>{s(o.label)}</option>)}
                        </select>
                        {!op.noValue && (
                            <input
                                aria-label={s(["Value", "值", "值"])}
                                value={c.value}
                                placeholder={s(["Value", "值", "值"])}
                                className={cn("h-6 w-32 min-w-0 flex-1 px-2", MAC.field)}
                                onChange={(e) => set(i, { value: e.target.value })}
                                onKeyDown={(e) => e.key === "Enter" && onFilter()}
                            />
                        )}
                        {i === 0 && (
                            <span className="ml-auto flex gap-1.5">
                                <button type="button" className={cn("h-6 rounded-md px-2.5", MAC.accentBg)} onClick={onFilter}>{s(["Filter", "筛选", "篩選"])}</button>
                                <button type="button" className={cn("h-6 rounded-md px-2.5", MAC.field)} onClick={onClear}>{s(["Clear", "清除", "清除"])}</button>
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/** A cell being edited: Return saves, Escape (null) or leaving keeps it. */
function CellField({ initial, onDone }: { initial: string; onDone: (value: string | null) => void }) {
    const s = useText();
    const [text, setText] = useState(initial);
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        ref.current?.focus();
        ref.current?.select();
    }, []);
    return (
        <input
            ref={ref}
            value={text}
            aria-label={s(["Cell", "单元格", "儲存格"])}
            className="w-full min-w-24 rounded-[3px] bg-white px-1 text-[#1d1d1f] outline-2 outline-[#007aff] dark:bg-[#2a2a2a] dark:text-[#ececec]"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") onDone(text);
                if (e.key === "Escape") onDone(null);
            }}
            onBlur={() => onDone(null)}
            onClick={(e) => e.stopPropagation()}
        />
    );
}

function InspectorHeader({ title, onClose, children }: { title: string; onClose: () => void; children?: ReactNode }) {
    const s = useText();
    return (
        <header className="flex h-[52px] shrink-0 items-center gap-2 px-3">
            <h4 className="mr-auto truncate text-[13px] font-semibold">{title}</h4>
            {children}
        </header>
    );
}

function TableInfo({ kind, table, onClose }: { kind: Kind; table: Table; onClose: () => void }) {
    const s = useText();
    const ddl = createStatement(kind, table);
    const [copied, setCopied] = useState(false);
    return (
        <>
            <InspectorHeader title={s(TABLE_INFO)} onClose={onClose} />
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3">
                <div>
                    <p className="text-[15px] font-semibold">{table.name}</p>
                    {table.comment && <p className={cn("text-[12px]", MAC.muted)}>{table.comment}</p>}
                    <p className={cn("text-[11px]", MAC.muted)}>{s([`${table.columns.length} columns`, `${table.columns.length} 列`, `${table.columns.length} 欄`])}</p>
                </div>
                <div className={cn("overflow-x-auto rounded-lg border", MAC.line)}>
                    <table className="w-full text-[11px]">
                        <thead>
                            <tr className={cn("border-b text-left", MAC.line, MAC.muted)}>
                                {([["Name", "名称", "名稱"], ["Type", "类型", "類型"], ["Nullable", "可为空", "可為空"], ["Default", "默认值", "預設值"]] as L[]).map((h) => (
                                    <th key={h[0]} className="px-2 py-1 font-medium whitespace-nowrap">{s(h)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {table.columns.map((c) => (
                                <tr key={c.name} className={MAC.stripe} title={c.comment}>
                                    <td className="px-2 py-1 whitespace-nowrap">
                                        {c.name}
                                        {c.key && <SFSymbol name="key.fill" className="ml-1 inline size-2.5 text-[#ff9f0a]" aria-label={s(["Primary key", "主键", "主鍵"])} />}
                                    </td>
                                    <td className="px-2 py-1 font-mono whitespace-nowrap">{c.type}</td>
                                    <td className="px-2 py-1">{c.nullable ? "YES" : "NO"}</td>
                                    <td className={cn("max-w-[110px] truncate px-2 py-1 font-mono", MAC.muted)} title={c.default}>{c.default ?? ""}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {table.config !== undefined && <p className="-mb-1.5 text-[12px] font-semibold">{s(["Collection Configuration", "集合配置", "集合設定"])}</p>}
                <div className={cn("relative rounded-lg border", MAC.line)}>
                    <button type="button" className={cn("absolute top-1.5 right-1.5 flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px]", MAC.field)} onClick={() => { void navigator.clipboard?.writeText(ddl); setCopied(true); }}>
                        <SFSymbol name="doc.on.doc" className="size-3" />
                        {copied ? s(["Copied", "已拷贝", "已拷貝"]) : s(["Copy", "拷贝", "拷貝"])}
                    </button>
                    <pre className="overflow-x-auto p-3 pt-8 font-mono text-[11px] leading-[1.55] select-text">{ddl}</pre>
                </div>
            </div>
        </>
    );
}

function Console({ rest, database, sql, results, resultIndex, onSql, onRun, onPickResult, onClose }: {
    /** Takes a REST request (Qdrant, Milvus) instead of SQL. */
    rest: boolean;
    /** Hidden for Qdrant, which has no databases. */
    database: string | null;
    sql: string;
    results: Result[];
    resultIndex: number;
    onSql: (sql: string) => void;
    onRun: () => void;
    onPickResult: (index: number) => void;
    onClose: () => void;
}) {
    const s = useText();
    const result = results[Math.min(resultIndex, results.length - 1)];
    return (
        <>
            <InspectorHeader title={s(CONSOLE)} onClose={onClose}>
                {database && <span className={cn("flex items-center gap-1 text-[12px]", MAC.muted)}><SFSymbol name="cylinder" className="size-3" />{database}</span>}
                <button type="button" disabled={!sql.trim()} className={cn("flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium disabled:opacity-40", MAC.accentBg)} onClick={onRun}>
                    <SFSymbol name="play.fill" className="size-2.5" />{s(["Run", "运行", "執行"])}
                </button>
            </InspectorHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-3">
                <textarea
                    aria-label={rest ? s(["Request", "请求", "請求"]) : "SQL"}
                    value={sql}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    className={cn("h-32 shrink-0 resize-none rounded-lg border bg-transparent p-2.5 font-mono text-[12px] leading-[1.5] outline-none focus:border-[#007aff]", MAC.line)}
                    onChange={(e) => onSql(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            onRun();
                        }
                    }}
                />
                <p className={cn("text-[11px]", MAC.muted)}>{rest
                    ? s(["A request line, then an optional JSON body · ⌘Return to send", "先写请求行，再写可选的 JSON 正文 · ⌘Return 发送", "先寫請求行，再寫可選的 JSON 內文 · ⌘Return 傳送"])
                    : s(["⌘Return to run", "⌘Return 运行", "⌘Return 執行"])}</p>
                <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border", MAC.line)}>
                    {!result ? (
                        <p className={cn("m-auto text-[12px]", MAC.muted)}>{s(["Results show here.", "结果会显示在这里。", "結果會顯示在這裡。"])}</p>
                    ) : result.kind === "error" ? (
                        <div className="flex gap-2 p-3 text-[12px] text-[#d70015] dark:text-[#ff6961]">
                            <SFSymbol name="xmark.circle.fill" className="mt-0.5 size-3.5 shrink-0" />
                            <p className="font-mono select-text">{result.message}</p>
                        </div>
                    ) : result.kind === "done" ? (
                        <p className="m-auto text-[12px]">{s(["Statement Executed", "语句已执行", "陳述式已執行"])}</p>
                    ) : (
                        <div className="min-h-0 flex-1 overflow-auto">
                            <table className="w-max min-w-full text-[11px] tabular-nums">
                                <thead className={cn("sticky top-0", MAC.window)}>
                                    <tr className={cn("border-b text-left", MAC.line)}>{result.columns.map((c, i) => <th key={i} className="px-2 py-1 font-semibold whitespace-nowrap">{c}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {result.rows.map((r, i) => (
                                        <tr key={i} className={MAC.stripe}>
                                            {r.map((v, j) => (
                                                <td key={j} className={cn("max-w-[240px] truncate px-2 py-1 whitespace-nowrap", typeof v === "number" && "text-right", v === null && cn("italic", MAC.muted))}>{v === null ? "NULL" : parseVector(v) ? <VectorCell value={v} /> : String(v)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {result && (
                        <footer className={cn("flex items-center gap-2 border-t px-2.5 py-1.5 text-[11px]", MAC.line, MAC.muted)}>
                            {results.length > 1 && (
                                <select aria-label={s(["Result", "结果", "結果"])} value={Math.min(resultIndex, results.length - 1)} className={cn("h-5 px-1", MAC.field)} onChange={(e) => onPickResult(Number(e.target.value))}>
                                    {results.map((_, i) => <option key={i} value={i}>{s([`Result ${i + 1}`, `结果 ${i + 1}`, `結果 ${i + 1}`])}</option>)}
                                </select>
                            )}
                            <span className="ml-auto">
                                {result.kind === "rows"
                                    ? s([`${result.rows.length} row${result.rows.length === 1 ? "" : "s"}`, `${result.rows.length} 行`, `${result.rows.length} 列`]) + " · "
                                    : result.kind === "done" ? `${result.message} · ` : ""}
                                {result.ms} ms
                            </span>
                        </footer>
                    )}
                </div>
            </div>
        </>
    );
}
