import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Inspector, MAC, MacSidebar, MacWindow, SearchField, ShowSidebarButton, SidebarHeader, SidebarRow, Spinner, TitleBar, ToolButton, Unavailable, useSidebar } from "~/components/mac-ui";
import { CAPSULE } from "~/components/mac-window";
import { SFSymbol, type SymbolName } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { CONNECTIONS, KIND_NAME, NEW_CONNECTION, SAMPLE_SQL, createStatement, type Connection, type Kind, type Table, type Value } from "./data";
import { run, type Result } from "./sql";

// A Quaero window that works like the app (Docs/Features in its repository): connections in the
// sidebar, the schema browser, the table's rows with a filter bar and in-place editing, and the
// inspector with Table Info or the SQL console. The databases live in the page; a reload starts over.

const KIND_ICON: Record<Kind, SymbolName> = { postgresql: "cylinder.split.1x2", mysql: "cylinder", sqlite: "doc" };

type Operator = { id: string; label: string; test: (v: Value, x: string) => boolean; noValue?: boolean };
const text = (v: Value) => String(v ?? "").toLowerCase();
const cmp = (v: Value, x: string) => (typeof v === "number" ? v - Number(x) : String(v ?? "").localeCompare(x));
const OPERATORS: Operator[] = [
    { id: "eq", label: "equals", test: (v, x) => v !== null && text(v) === x.toLowerCase() },
    { id: "ne", label: "does not equal", test: (v, x) => v !== null && text(v) !== x.toLowerCase() },
    { id: "gt", label: "greater than", test: (v, x) => v !== null && cmp(v, x) > 0 },
    { id: "lt", label: "less than", test: (v, x) => v !== null && cmp(v, x) < 0 },
    { id: "ge", label: "greater than or equal to", test: (v, x) => v !== null && cmp(v, x) >= 0 },
    { id: "le", label: "less than or equal to", test: (v, x) => v !== null && cmp(v, x) <= 0 },
    { id: "has", label: "contains", test: (v, x) => v !== null && text(v).includes(x.toLowerCase()) },
    { id: "lacks", label: "does not contain", test: (v, x) => v !== null && !text(v).includes(x.toLowerCase()) },
    { id: "starts", label: "begins with", test: (v, x) => v !== null && text(v).startsWith(x.toLowerCase()) },
    { id: "ends", label: "ends with", test: (v, x) => v !== null && text(v).endsWith(x.toLowerCase()) },
    { id: "null", label: "is NULL", test: (v) => v === null, noValue: true },
    { id: "notnull", label: "is not NULL", test: (v) => v !== null, noValue: true },
];

type Condition = { column: string; op: string; value: string };

export function QuaeroDemo({ className }: { className?: string }) {
    const sidebar = useSidebar();
    const [connections, setConnections] = useState<Connection[]>(() => structuredClone(CONNECTIONS));
    const [connectionId, setConnectionId] = useState("shop");
    // The database and table open in each connection.
    const [databases, setDatabases] = useState<Record<string, string>>({});
    const [tables, setTables] = useState<Record<string, string>>({});
    const [inspector, setInspector] = useState<"info" | "console" | null>(null);
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
    }, [table?.name, connectionId, database.name]);

    useEffect(() => {
        if (!loading) return;
        const timer = setTimeout(() => setLoading(false), 350);
        return () => clearTimeout(timer);
    }, [loading]);

    const rows = useMemo(() => {
        if (!table) return [];
        const indexed = table.rows.map((values, index) => ({ values, index }));
        if (!applied) return indexed;
        const tests = applied.conditions.map((c) => {
            const op = OPERATORS.find((o) => o.id === c.op)!;
            const at = table.columns.findIndex((x) => x.name === c.column);
            return (values: Value[]) => op.test(values[at], c.value);
        });
        return indexed.filter(({ values }) => (applied.all ? tests.every((t) => t(values)) : tests.some((t) => t(values))));
    }, [table, applied, table?.rows]);

    const openConnection = (id: string) => {
        setConnectionId(id);
        setTableQuery("");
        setResultIndex(0);
        sidebar.done();
    };
    const openTable = (name: string) => {
        setTables((t) => ({ ...t, [connectionId]: name }));
        setLoading(true);
    };
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

    const runConsole = () => {
        const text = sql[connection.kind] ?? SAMPLE_SQL[connection.kind];
        const out = run(text, database, connection.kind);
        setResults((r) => ({ ...r, [connectionId]: out }));
        setResultIndex(out.length - 1);
        redraw((n) => n + 1);
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
            <MacSidebar sidebar={sidebar} toolbar={<ToolButton icon="plus" label="New Connection" onClick={addConnection} />}>
                <SidebarHeader>Connections</SidebarHeader>
                <nav className="flex flex-col gap-0.5 overflow-y-auto pb-3">
                    {connections.map((c) => (
                        <SidebarRow
                            key={c.id}
                            className="h-11"
                            icon={KIND_ICON[c.kind]}
                            selected={c.id === connectionId}
                            label={<span className="flex flex-col leading-tight"><span className="truncate">{c.name}</span><span className={cn("truncate text-[11px]", c.id === connectionId ? "text-white/75" : MAC.muted)}>{c.summary}</span></span>}
                            detail={c.id === connectionId && <span className="block size-2 rounded-full bg-[#34c759] ring-2 ring-white/70" aria-label="Connected" />}
                            onClick={() => openConnection(c.id)}
                        />
                    ))}
                </nav>
            </MacSidebar>

            {/* The schema browser. On narrow screens the table picker moves into the detail's title bar. */}
            <section className={cn("hidden w-[220px] shrink-0 flex-col border-r md:flex", MAC.line)}>
                <TitleBar leading={<ShowSidebarButton sidebar={sidebar} />} title={connection.name} subtitle={KIND_NAME[connection.kind]} />
                <div className="flex flex-col gap-2 px-3 pb-2">
                    {connection.databases.length > 1 && (
                        <select
                            aria-label="Database"
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
                    <SearchField value={tableQuery} placeholder="Filter Tables" onChange={setTableQuery} className="w-full" />
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pb-3 [&>button]:mx-1.5">
                    {visibleTables.map((t) => (
                        <SidebarRow key={t.name} icon={t.kind === "view" ? "eye" : "tablecells"} iconClass={MAC.muted} label={t.name} selected={t === table} onClick={() => openTable(t.name)} />
                    ))}
                    {database.tables.length === 0 && <Unavailable icon="tablecells" title="No Tables" />}
                </div>
            </section>

            <main className="flex min-w-0 flex-1 flex-col">
                <TitleBar
                    leading={<span className="md:hidden"><ShowSidebarButton sidebar={sidebar} /></span>}
                    title={
                        <>
                            <span className="max-md:hidden">{table?.name ?? "No Table Selected"}</span>
                            <select aria-label="Table" value={table?.name ?? ""} className="bg-transparent font-semibold outline-none md:hidden" onChange={(e) => openTable(e.target.value)}>
                                {database.tables.map((t) => <option key={t.name}>{t.name}</option>)}
                            </select>
                        </>
                    }
                    subtitle={database.name}
                >
                    <div className={cn(CAPSULE, "gap-0.5 px-0.5")}>
                        <ToolButton grouped icon="arrow.clockwise" label="Refresh" onClick={() => setLoading(true)} disabled={!table} />
                        <ToolButton grouped icon="terminal" label="Console" active={inspector === "console"} onClick={() => setInspector((i) => (i === "console" ? null : "console"))} />
                        <ToolButton grouped icon="info.circle" label="Table Info" active={inspector === "info"} disabled={!table} onClick={() => setInspector((i) => (i === "info" ? null : "info"))} />
                    </div>
                    <ExportMenu disabled={!table} onExport={exportRows} />
                </TitleBar>

                {table ? (
                    <>
                        <FilterBar
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
                                <div className="flex h-full items-center justify-center"><Spinner className={cn("size-5", MAC.muted)} label="Loading" /></div>
                            ) : (
                                <table className="w-max min-w-full border-collapse text-[12px] tabular-nums">
                                    <thead className={cn("sticky top-0 z-10", MAC.window)}>
                                        <tr className={cn("border-b text-left", MAC.line)}>
                                            {table.columns.map((c) => (
                                                <th key={c.name} className={cn("border-r px-2 py-1.5 font-semibold whitespace-nowrap last:border-r-0", MAC.line)}>{c.name}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map(({ values, index }) => (
                                            <tr key={index} className={cn(selectedRow === index ? MAC.selected : MAC.stripe)} onClick={() => setSelectedRow(index)}>
                                                {values.map((v, col) => (
                                                    <td
                                                        key={col}
                                                        className={cn("max-w-[260px] truncate px-2 py-1 whitespace-nowrap", typeof v === "number" && "text-right")}
                                                        onDoubleClick={() => table.kind === "table" && setEditing({ row: index, col })}
                                                    >
                                                        {editing?.row === index && editing.col === col ? (
                                                            <CellField initial={v === null ? "" : String(v)} onDone={(raw) => (raw === null ? setEditing(null) : commitEdit(index, col, raw))} />
                                                        ) : v === null ? (
                                                            <span className={cn("italic", selectedRow === index ? "text-white/70" : MAC.muted)}>NULL</span>
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
                            {!loading && rows.length === 0 && <Unavailable icon="tablecells" title="No Rows">{applied ? "No rows match the filter." : undefined}</Unavailable>}
                        </div>
                    </>
                ) : (
                    <Unavailable icon="tablecells" title="No Table Selected" />
                )}
            </main>

            <Inspector open={inspector !== null} width={340}>
                {inspector === "info" && table && <TableInfo kind={connection.kind} table={table} onClose={() => setInspector(null)} />}
                {inspector === "console" && (
                    <Console
                        database={database.name}
                        sql={sql[connection.kind] ?? SAMPLE_SQL[connection.kind]}
                        results={results[connectionId] ?? []}
                        resultIndex={resultIndex}
                        onSql={(text) => setSql((s) => ({ ...s, [connection.kind]: text }))}
                        onRun={runConsole}
                        onPickResult={setResultIndex}
                        onClose={() => setInspector(null)}
                    />
                )}
            </Inspector>
        </MacWindow>
    );
}

function ExportMenu({ disabled, onExport }: { disabled: boolean; onExport: (format: "csv" | "json") => void }) {
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
            <ToolButton icon="square.and.arrow.up" label="Export" disabled={disabled} onClick={() => setOpen((o) => !o)} />
            {open && (
                <div className={cn("absolute top-9 right-0 z-30 w-44 rounded-lg border p-1 shadow-[0_10px_30px_rgb(0_0_0/0.2)]", MAC.line, MAC.window)}>
                    {(["csv", "json"] as const).map((f) => (
                        <button key={f} type="button" className="block w-full rounded-md px-2 py-1 text-left hover:bg-[#007aff] hover:text-white" onClick={() => { onExport(f); setOpen(false); }}>
                            Export as {f.toUpperCase()}…
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function FilterBar({ table, conditions, matchAll, onChange, onMatchAll, onFilter, onClear }: {
    table: Table;
    conditions: Condition[];
    matchAll: boolean;
    onChange: (conditions: Condition[]) => void;
    onMatchAll: (all: boolean) => void;
    onFilter: () => void;
    onClear: () => void;
}) {
    const set = (i: number, patch: Partial<Condition>) => onChange(conditions.map((c, j) => (j === i ? { ...c, ...patch } : c)));
    return (
        <div className={cn("flex flex-col gap-1.5 border-b px-3 pb-2", MAC.line)}>
            {conditions.length > 1 && (
                <select aria-label="Match" value={matchAll ? "all" : "any"} className={cn("h-6 self-start px-1.5 text-[12px]", MAC.field)} onChange={(e) => onMatchAll(e.target.value === "all")}>
                    <option value="all">Match All</option>
                    <option value="any">Match Any</option>
                </select>
            )}
            {conditions.map((c, i) => {
                const op = OPERATORS.find((o) => o.id === c.op)!;
                return (
                    <div key={i} className="flex flex-wrap items-center gap-1.5 text-[12px]">
                        <button type="button" aria-label="Remove Condition" disabled={conditions.length === 1} className={cn("flex size-6 items-center justify-center rounded-md disabled:opacity-35", MAC.field)} onClick={() => onChange(conditions.filter((_, j) => j !== i))}>
                            <SFSymbol name="minus" className="w-2.5" />
                        </button>
                        <button type="button" aria-label="Add Condition" className={cn("flex size-6 items-center justify-center rounded-md", MAC.field)} onClick={() => onChange([...conditions.slice(0, i + 1), { column: table.columns[0].name, op: "eq", value: "" }, ...conditions.slice(i + 1)])}>
                            <SFSymbol name="plus" className="size-2.5" />
                        </button>
                        <select aria-label="Column" value={c.column} className={cn("h-6 px-1.5", MAC.field)} onChange={(e) => set(i, { column: e.target.value })}>
                            {table.columns.map((col) => <option key={col.name}>{col.name}</option>)}
                        </select>
                        <select aria-label="Operator" value={c.op} className={cn("h-6 px-1.5", MAC.field)} onChange={(e) => set(i, { op: e.target.value })}>
                            {OPERATORS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                        {!op.noValue && (
                            <input
                                aria-label="Value"
                                value={c.value}
                                placeholder="Value"
                                className={cn("h-6 w-32 min-w-0 flex-1 px-2", MAC.field)}
                                onChange={(e) => set(i, { value: e.target.value })}
                                onKeyDown={(e) => e.key === "Enter" && onFilter()}
                            />
                        )}
                        {i === 0 && (
                            <span className="ml-auto flex gap-1.5">
                                <button type="button" className={cn("h-6 rounded-md px-2.5", MAC.accentBg)} onClick={onFilter}>Filter</button>
                                <button type="button" className={cn("h-6 rounded-md px-2.5", MAC.field)} onClick={onClear}>Clear</button>
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
            aria-label="Cell"
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
    return (
        <header className="flex h-[52px] shrink-0 items-center gap-2 px-3">
            <h4 className="mr-auto truncate text-[13px] font-semibold">{title}</h4>
            {children}
            <span className="md:hidden"><ToolButton icon="xmark.circle.fill" label="Close" onClick={onClose} /></span>
        </header>
    );
}

function TableInfo({ kind, table, onClose }: { kind: Kind; table: Table; onClose: () => void }) {
    const ddl = createStatement(kind, table);
    const [copied, setCopied] = useState(false);
    return (
        <>
            <InspectorHeader title="Table Info" onClose={onClose} />
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3">
                <div>
                    <p className="text-[15px] font-semibold">{table.name}</p>
                    {table.comment && <p className={cn("text-[12px]", MAC.muted)}>{table.comment}</p>}
                    <p className={cn("text-[11px]", MAC.muted)}>{table.columns.length} columns</p>
                </div>
                <div className={cn("overflow-x-auto rounded-lg border", MAC.line)}>
                    <table className="w-full text-[11px]">
                        <thead>
                            <tr className={cn("border-b text-left", MAC.line, MAC.muted)}>
                                {["Name", "Type", "Nullable", "Default"].map((h) => <th key={h} className="px-2 py-1 font-medium whitespace-nowrap">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {table.columns.map((c) => (
                                <tr key={c.name} className={MAC.stripe} title={c.comment}>
                                    <td className="px-2 py-1 whitespace-nowrap">
                                        {c.name}
                                        {c.key && <SFSymbol name="key.fill" className="ml-1 inline size-2.5 text-[#ff9f0a]" aria-label="Primary key" />}
                                    </td>
                                    <td className="px-2 py-1 font-mono whitespace-nowrap">{c.type}</td>
                                    <td className="px-2 py-1">{c.nullable ? "YES" : "NO"}</td>
                                    <td className={cn("max-w-[110px] truncate px-2 py-1 font-mono", MAC.muted)} title={c.default}>{c.default ?? ""}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className={cn("relative rounded-lg border", MAC.line)}>
                    <button type="button" className={cn("absolute top-1.5 right-1.5 flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px]", MAC.field)} onClick={() => { void navigator.clipboard?.writeText(ddl); setCopied(true); }}>
                        <SFSymbol name="doc.on.doc" className="size-3" />
                        {copied ? "Copied" : "Copy"}
                    </button>
                    <pre className="overflow-x-auto p-3 pt-8 font-mono text-[11px] leading-[1.55] select-text">{ddl}</pre>
                </div>
            </div>
        </>
    );
}

function Console({ database, sql, results, resultIndex, onSql, onRun, onPickResult, onClose }: {
    database: string;
    sql: string;
    results: Result[];
    resultIndex: number;
    onSql: (sql: string) => void;
    onRun: () => void;
    onPickResult: (index: number) => void;
    onClose: () => void;
}) {
    const result = results[Math.min(resultIndex, results.length - 1)];
    return (
        <>
            <InspectorHeader title="Console" onClose={onClose}>
                <span className={cn("flex items-center gap-1 text-[12px]", MAC.muted)}><SFSymbol name="cylinder" className="size-3" />{database}</span>
                <button type="button" disabled={!sql.trim()} className={cn("flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium disabled:opacity-40", MAC.accentBg)} onClick={onRun}>
                    <SFSymbol name="play.fill" className="size-2.5" />Run
                </button>
            </InspectorHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-3">
                <textarea
                    aria-label="SQL"
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
                <p className={cn("text-[11px]", MAC.muted)}>⌘Return to run</p>
                <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border", MAC.line)}>
                    {!result ? (
                        <p className={cn("m-auto text-[12px]", MAC.muted)}>Results show here.</p>
                    ) : result.kind === "error" ? (
                        <div className="flex gap-2 p-3 text-[12px] text-[#d70015] dark:text-[#ff6961]">
                            <SFSymbol name="xmark.circle.fill" className="mt-0.5 size-3.5 shrink-0" />
                            <p className="font-mono select-text">{result.message}</p>
                        </div>
                    ) : result.kind === "done" ? (
                        <p className="m-auto text-[12px]">Statement Executed</p>
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
                                                <td key={j} className={cn("px-2 py-1 whitespace-nowrap", typeof v === "number" && "text-right", v === null && cn("italic", MAC.muted))}>{v === null ? "NULL" : String(v)}</td>
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
                                <select aria-label="Result" value={Math.min(resultIndex, results.length - 1)} className={cn("h-5 px-1", MAC.field)} onChange={(e) => onPickResult(Number(e.target.value))}>
                                    {results.map((_, i) => <option key={i} value={i}>Result {i + 1}</option>)}
                                </select>
                            )}
                            <span className="ml-auto">
                                {result.kind === "rows" ? `${result.rows.length} row${result.rows.length === 1 ? "" : "s"} · ` : result.kind === "done" ? `${result.message} · ` : ""}
                                {result.ms} ms
                            </span>
                        </footer>
                    )}
                </div>
            </div>
        </>
    );
}
