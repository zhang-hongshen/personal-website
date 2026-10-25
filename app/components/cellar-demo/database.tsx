import { useEffect, useRef, useState, type ReactNode } from "react";

import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { newId, type Color, type Column, type Doc, type Row, type Strings } from "./content";

type Database = Extract<Doc, { kind: "database" }>;
export type Layout = "table" | "board";

// Select colors, light and dark, close to the app's tags.
const TAG: Record<Color, string> = {
    gray: "bg-[#e9e8e6] text-[#55534f] dark:bg-[#3a3937] dark:text-[#c9c7c3]",
    blue: "bg-[#dbe9fd] text-[#1d5bb5] dark:bg-[#1e3550] dark:text-[#8cbcff]",
    purple: "bg-[#ece3fb] text-[#6a3fb3] dark:bg-[#352a4d] dark:text-[#c3a6ff]",
    green: "bg-[#daf1e1] text-[#226f40] dark:bg-[#1f3a2a] dark:text-[#86d6a2]",
    yellow: "bg-[#faefc6] text-[#86650a] dark:bg-[#40361a] dark:text-[#e8c96a]",
    orange: "bg-[#fde4cf] text-[#a24f0e] dark:bg-[#47301c] dark:text-[#ffb27a]",
    red: "bg-[#fbdedb] text-[#b42318] dark:bg-[#4a2421] dark:text-[#ff9a8f]",
    pink: "bg-[#fbe0ee] text-[#a32f6a] dark:bg-[#47263a] dark:text-[#f59ac7]",
    brown: "bg-[#eee2d9] text-[#7a5034] dark:bg-[#3d3027] dark:text-[#d6b39a]",
};

export function DatabaseView({ db, layout, strings, onChange }: {
    db: Database;
    layout: Layout;
    strings: Strings;
    onChange: (rows: Row[]) => void;
}) {
    // The row whose title is being typed, after New or a double-click.
    const [editing, setEditing] = useState<string | null>(null);
    const setRow = (id: string, patch: Partial<Row>) => onChange(db.rows.map((r) => (r.id === id ? { ...r, ...patch } as Row : r)));
    const addRow = (patch: Partial<Row> = {}) => {
        const row = { id: newId(), title: "", ...Object.fromEntries(db.columns.map((c) => [c.key, ""])), ...patch } as Row;
        onChange([...db.rows, row]);
        setEditing(row.id);
    };
    const title = (row: Row) =>
        editing === row.id ? (
            <TitleField value={row.title} onDone={(value) => { setRow(row.id, { title: value }); setEditing(null); }} />
        ) : (
            <span className={cn("truncate", !row.title && "text-(--cellar-muted)")}>{row.title || strings.untitled}</span>
        );

    if (layout === "board") {
        const column = db.columns.find((c) => c.key === db.groupBy)!;
        return (
            <div className="flex h-full gap-3 overflow-x-auto px-8 pt-5 pb-6">
                {column.options!.map((option) => (
                    <BoardColumn
                        key={option.name}
                        label={<Tag color={option.color}>{option.name}</Tag>}
                        count={db.rows.filter((r) => r[db.groupBy] === option.name).length}
                        newLabel={strings.newRow}
                        onDrop={(id) => setRow(id, { [db.groupBy]: option.name })}
                        onAdd={() => addRow({ [db.groupBy]: option.name })}
                    >
                        {db.rows.filter((r) => r[db.groupBy] === option.name).map((row) => (
                            <div
                                key={row.id}
                                draggable={editing !== row.id}
                                onDragStart={(e) => e.dataTransfer.setData("text/x-cellar-row", row.id)}
                                onDoubleClick={() => setEditing(row.id)}
                                className="cursor-grab rounded-lg border border-black/8 bg-(--cellar-window) px-3 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-shadow hover:shadow-[0_2px_8px_rgb(0_0_0/0.1)] active:cursor-grabbing motion-safe:animate-in motion-safe:fade-in dark:border-white/8"
                            >
                                <p className="flex text-[13px] font-medium">{title(row)}</p>
                                <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-(--cellar-muted)">
                                    {db.columns.filter((c) => c.key !== db.groupBy && row[c.key]).map((c) => (
                                        <Cell key={c.key} column={c} value={row[c.key]} small />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </BoardColumn>
                ))}
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto px-8 pt-4 pb-6 text-[13px]">
            <table className="w-full min-w-[560px] border-collapse">
                <thead>
                    <tr className="border-b border-(--cellar-line) text-left text-[12px] text-(--cellar-muted)">
                        <th className="w-[38%] py-2 pr-3 font-medium">{strings.name}</th>
                        {db.columns.map((c) => <th key={c.key} className="py-2 pr-3 font-medium">{c.name}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {db.rows.map((row) => (
                        <tr key={row.id} className="group border-b border-(--cellar-line) motion-safe:animate-in motion-safe:fade-in">
                            <td className="max-w-0 py-1.5 pr-3" onDoubleClick={() => setEditing(row.id)}>
                                <span className="flex items-center gap-2">
                                    <SFSymbol name="doc.text" className="size-3.5 shrink-0 opacity-50" />
                                    {title(row)}
                                </span>
                            </td>
                            {db.columns.map((c) => (
                                <td key={c.key} className="py-1.5 pr-3">
                                    {c.options ? (
                                        <SelectCell column={c} value={row[c.key]} onPick={(value) => setRow(row.id, { [c.key]: value })} />
                                    ) : (
                                        <TextCell value={row[c.key]} onDone={(value) => setRow(row.id, { [c.key]: value })} />
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <button type="button" className="mt-1 flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-(--cellar-muted) hover:bg-black/5 hover:text-current dark:hover:bg-white/7" onClick={() => addRow()}>
                <SFSymbol name="plus" className="size-3" /> {strings.newRow}
            </button>
        </div>
    );
}

function BoardColumn({ label, count, newLabel, onDrop, onAdd, children }: {
    label: ReactNode;
    count: number;
    newLabel: string;
    onDrop: (id: string) => void;
    onAdd: () => void;
    children: ReactNode;
}) {
    const [over, setOver] = useState(false);
    return (
        <section
            className={cn("flex min-w-[170px] flex-1 flex-col gap-2 rounded-xl p-2 transition-colors", over ? "bg-(--cellar-accent)/10" : "bg-black/[0.03] dark:bg-white/[0.04]")}
            onDragOver={(e) => {
                if (!e.dataTransfer.types.includes("text/x-cellar-row")) return;
                e.preventDefault();
                setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
                setOver(false);
                const id = e.dataTransfer.getData("text/x-cellar-row");
                if (id) onDrop(id);
            }}
        >
            <header className="flex items-center gap-2 px-1 pt-0.5 text-[12px]">
                {label}
                <span className="text-(--cellar-muted)">{count}</span>
            </header>
            {children}
            <button type="button" className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] text-(--cellar-muted) hover:bg-black/5 hover:text-current dark:hover:bg-white/7" onClick={onAdd}>
                <SFSymbol name="plus" className="size-3" /> {newLabel}
            </button>
        </section>
    );
}

function Tag({ color, children }: { color: Color; children: ReactNode }) {
    return <span className={cn("inline-block rounded-[5px] px-1.5 py-px text-[12px] leading-[18px] whitespace-nowrap", TAG[color])}>{children}</span>;
}

function Cell({ column, value, small }: { column: Column; value: string; small?: boolean }) {
    const option = column.options?.find((o) => o.name === value);
    if (option) return <Tag color={option.color}>{value}</Tag>;
    return <span className={small ? "leading-[20px]" : undefined}>{value}</span>;
}

function SelectCell({ column, value, onPick }: { column: Column; value: string; onPick: (value: string) => void }) {
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
            <button type="button" className="-mx-1 min-h-6 min-w-16 rounded-md px-1 py-0.5 text-left hover:bg-black/5 dark:hover:bg-white/7" onClick={() => setOpen((o) => !o)}>
                {value ? <Cell column={column} value={value} /> : <span className="text-(--cellar-muted)">—</span>}
            </button>
            {open && (
                <div className="absolute top-full left-0 z-20 mt-1 flex w-44 flex-col gap-0.5 rounded-lg border border-black/10 bg-(--cellar-window) p-1 shadow-[0_10px_30px_rgb(0_0_0/0.18)] dark:border-white/10">
                    {column.options!.map((o) => (
                        <button
                            key={o.name}
                            type="button"
                            className={cn("rounded-md px-1.5 py-1 text-left hover:bg-black/5 dark:hover:bg-white/7", o.name === value && "bg-black/5 dark:bg-white/7")}
                            onClick={() => {
                                onPick(o.name);
                                setOpen(false);
                            }}
                        >
                            <Tag color={o.color}>{o.name}</Tag>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function TextCell({ value, onDone }: { value: string; onDone: (value: string) => void }) {
    const [editing, setEditing] = useState(false);
    if (editing) return <TitleField value={value} onDone={(v) => { onDone(v); setEditing(false); }} />;
    return (
        <button type="button" className="-mx-1 block min-h-6 w-full truncate rounded-md px-1 py-0.5 text-left hover:bg-black/5 dark:hover:bg-white/7" onClick={() => setEditing(true)}>
            {value || <span className="text-(--cellar-muted)">—</span>}
        </button>
    );
}

/** An inline field: Return or leaving it saves, Escape keeps the old value. */
function TitleField({ value, onDone }: { value: string; onDone: (value: string) => void }) {
    const [text, setText] = useState(value);
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        ref.current?.focus({ preventScroll: true });
        ref.current?.select();
    }, []);
    return (
        <input
            ref={ref}
            value={text}
            className="-mx-1 w-full min-w-0 rounded-[4px] bg-transparent px-1 outline-2 outline-(--cellar-accent)"
            onChange={(e) => setText(e.target.value)}
            onBlur={() => onDone(text.trim())}
            onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") onDone(value);
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
        />
    );
}
