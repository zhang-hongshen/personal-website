import { useEffect, useRef, useState, type ReactNode } from "react";

import { useText, type L, type Text } from "~/components/demo-text";
import { MAC, Segmented } from "~/components/mac-ui";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { TYPES, memoryOf, remaining, sizeOf, type Entry } from "./data";
import { TypeBadge } from "./browser";

// The value editor (KeyDetailView): each type in its own table or text view, edited in place.
// Changes go straight into the entry; `onChange` redraws.

const MEMBERS: L = ["members", "个成员", "個成員"];
const UNIT: Record<string, L> = {
    string: ["characters", "个字符", "個字元"], hash: ["fields", "个字段", "個欄位"], list: ["items", "项", "項"],
    set: MEMBERS, zset: MEMBERS, stream: ["entries", "个条目", "個項目"],
};

export function keySubtitle(entry: Entry, s: Text) {
    const n = sizeOf(entry.data);
    return `${s(TYPES[entry.data.type].name)} · ${n.toLocaleString("en-US")} ${s(UNIT[entry.data.type])} · ${memoryOf(entry).toLocaleString("en-US")} B`;
}

export function TTLBar({ entry, now }: { entry: Entry; now: number | null }) {
    const s = useText();
    return (
        <div className={cn("flex items-center gap-2 border-b px-4 py-2 text-[12px]", MAC.line)}>
            <TypeBadge type={entry.data.type} />
            <SFSymbol name="timer" className={cn("size-3.5", MAC.muted)} />
            {entry.expiresAt === null ? (
                <span className={MAC.muted}>{s(["No expiry", "永不过期", "永不過期"])}</span>
            ) : (
                <span className="tabular-nums">{s(["Expires in", "剩余", "剩餘"])} {now === null ? "…" : remaining(entry.expiresAt, now, s)}</span>
            )}
        </div>
    );
}

const FIELD: L = ["Field", "字段", "欄位"];
const VALUE: L = ["Value", "值", "值"];
const MEMBER: L = ["Member", "成员", "成員"];
const SCORE: L = ["Score", "分数", "分數"];

export function ValueEditor({ entry, onChange }: { entry: Entry; onChange: () => void }) {
    const d = entry.data;
    switch (d.type) {
        case "string": return <StringEditor key={d.value} value={d.value} onSave={(v) => { d.value = v; onChange(); }} />;
        case "hash":
            return (
                <Grid
                    headers={[FIELD, VALUE]}
                    rows={d.value.map(([f, v]) => [f, v])}
                    editable={[false, true]}
                    onEdit={(i, _, v) => { d.value[i] = [d.value[i][0], v]; onChange(); }}
                    onDelete={(i) => { d.value.splice(i, 1); onChange(); }}
                    add={{ fields: [FIELD, VALUE], onAdd: ([f, v]) => { const at = d.value.findIndex(([x]) => x === f); if (at >= 0) d.value[at] = [f, v]; else d.value.push([f, v]); onChange(); } }}
                />
            );
        case "list":
            return (
                <Grid
                    headers={[["Index", "索引", "索引"], VALUE]}
                    rows={d.value.map((v, i) => [String(i), v])}
                    editable={[false, true]}
                    onEdit={(i, _, v) => { d.value[i] = v; onChange(); }}
                    onDelete={(i) => { d.value.splice(i, 1); onChange(); }}
                    add={{ fields: [VALUE], label: ["Push", "推入", "推入"], onAdd: ([v]) => { d.value.push(v); onChange(); } }}
                />
            );
        case "set":
            return (
                <Grid
                    headers={[MEMBER]}
                    rows={d.value.map((v) => [v])}
                    onDelete={(i) => { d.value.splice(i, 1); onChange(); }}
                    add={{ fields: [MEMBER], onAdd: ([v]) => { if (!d.value.includes(v)) d.value.push(v); onChange(); } }}
                />
            );
        case "zset":
            return (
                <Grid
                    headers={[["Rank", "排名", "排名"], MEMBER, SCORE]}
                    rows={d.value.map(([m, s], i) => [String(i + 1), m, String(s)])}
                    editable={[false, false, true]}
                    numeric={[true, false, true]}
                    onEdit={(i, _, v) => { if (Number.isNaN(Number(v))) return; d.value[i] = [d.value[i][0], Number(v)]; d.value.sort((a, b) => b[1] - a[1]); onChange(); }}
                    onDelete={(i) => { d.value.splice(i, 1); onChange(); }}
                    add={{ fields: [MEMBER, SCORE], onAdd: ([m, s]) => { if (Number.isNaN(Number(s))) return; d.value = [...d.value.filter(([x]) => x !== m), [m, Number(s)] as [string, number]].sort((a, b) => b[1] - a[1]); onChange(); } }}
                />
            );
        case "stream":
            return (
                <Grid
                    headers={["ID", ["Fields", "字段", "欄位"]]}
                    rows={d.value.map((e) => [e.id, e.fields.map(([f, v]) => `${f}=${v}`).join("  ")])}
                    onDelete={(i) => { d.value.splice(i, 1); onChange(); }}
                    add={{ fields: [["field=value …", "字段=值 …", "欄位=值 …"]], label: ["Add Entry", "添加条目", "加入項目"], onAdd: ([text]) => {
                        const fields = text.split(/\s+/).filter(Boolean).map((p) => p.split("=") as [string, string]).filter((p) => p.length === 2);
                        if (fields.length) { d.value.push({ id: `${Date.now()}-0`, fields }); onChange(); }
                    } }}
                />
            );
    }
}

function StringEditor({ value, onSave }: { value: string; onSave: (value: string) => void }) {
    const s = useText();
    const json = (() => { try { return typeof JSON.parse(value) === "object" ? JSON.stringify(JSON.parse(value), null, 2) : null; } catch { return null; } })();
    const [view, setView] = useState<"text" | "json">(json ? "json" : "text");
    const [text, setText] = useState(value);
    const dirty = text !== value;
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
            <div className="flex items-center gap-2">
                <Segmented options={[{ value: "text", label: s(["Text", "文本", "文字"]) }, { value: "json", label: "JSON" }]} value={view} onChange={(v) => { setView(v); setText(value); }} />
                <span className="ml-auto" />
                {dirty && <button type="button" className={cn("h-7 rounded-md px-3", MAC.field)} onClick={() => setText(value)}>{s(["Revert", "还原", "還原"])}</button>}
                <button type="button" disabled={!dirty} className={cn("h-7 rounded-md px-3 font-medium disabled:opacity-40", MAC.accentBg)} onClick={() => onSave(text)}>{s(["Save", "保存", "儲存"])}</button>
            </div>
            {view === "json" && json !== null && !dirty ? (
                <pre className={cn("min-h-0 flex-1 overflow-auto rounded-lg border p-3 font-mono text-[12px] leading-[1.55] select-text", MAC.line)} onDoubleClick={() => setView("text")}>
                    <JSONText text={json} />
                </pre>
            ) : (
                <textarea
                    aria-label={s(VALUE)}
                    value={text}
                    spellCheck={false}
                    className={cn("min-h-0 flex-1 resize-none rounded-lg border bg-transparent p-3 font-mono text-[12px] leading-[1.55] outline-none focus:border-[#007aff]", MAC.line)}
                    onChange={(e) => setText(e.target.value)}
                />
            )}
            {view === "json" && json === null && <p className={cn("text-[11px]", MAC.muted)}>{s(["This value isn't JSON.", "这个值不是 JSON。", "這個值不是 JSON。"])}</p>}
        </div>
    );
}

/** JSON with keys, strings and numbers colored like Xcode's defaults. */
function JSONText({ text }: { text: string }) {
    const out: ReactNode[] = [];
    let at = 0;
    for (const m of text.matchAll(/("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?|true|false|null)/g)) {
        out.push(text.slice(at, m.index));
        const color = m[2] ? "text-[#0b4f79] dark:text-[#6bdfff]" : m[1] ? "text-[#c41a16] dark:text-[#fc6a5d]" : "text-[#1c00cf] dark:text-[#d0bf69]";
        out.push(<span key={m.index} className={color}>{m[1] ?? m[3]}</span>, m[2] ?? "");
        at = m.index + m[0].length;
    }
    out.push(text.slice(at));
    return out;
}

/** A table of a value's parts, with double-click editing, a delete button per row, and a row for adding. */
function Grid({ headers, rows, editable = [], numeric = [], onEdit, onDelete, add }: {
    headers: (L | string)[];
    rows: string[][];
    editable?: boolean[];
    numeric?: boolean[];
    onEdit?: (row: number, col: number, value: string) => void;
    onDelete: (row: number) => void;
    add: { fields: L[]; label?: L; onAdd: (values: string[]) => void };
}) {
    const s = useText();
    const [editing, setEditing] = useState<{ row: number; col: number } | null>(null);
    const [draft, setDraft] = useState<string[]>(() => add.fields.map(() => ""));
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full border-collapse text-[12px]">
                    <thead className={cn("sticky top-0 z-10", MAC.window)}>
                        <tr className={cn("border-b text-left", MAC.line)}>
                            {headers.map((h, i) => <th key={i} className={cn("px-3 py-1.5 font-semibold", numeric[i] && "w-20 text-right")}>{s(h)}</th>)}
                            <th className="w-8" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={`${i}:${r[0]}`} className={cn("group motion-safe:animate-in motion-safe:fade-in", MAC.stripe)}>
                                {r.map((v, j) => (
                                    <td key={j} className={cn("max-w-0 px-3 py-1 font-mono", numeric[j] && "text-right tabular-nums", j === 0 && headers.length > 1 && !numeric[0] && "w-[36%]")} onDoubleClick={() => editable[j] && setEditing({ row: i, col: j })}>
                                        {editing?.row === i && editing.col === j ? (
                                            <InlineField initial={v} onDone={(value) => { if (value !== null && value !== v) onEdit?.(i, j, value); setEditing(null); }} />
                                        ) : (
                                            <span className="block truncate" title={v}>{v}</span>
                                        )}
                                    </td>
                                ))}
                                <td className="px-1">
                                    <button type="button" aria-label={s(["Delete", "删除", "刪除"])} title={s(["Delete", "删除", "刪除"])} className={cn("flex size-6 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-black/6 dark:hover:bg-white/10", MAC.muted)} onClick={() => onDelete(i)}>
                                        <SFSymbol name="trash" className="size-3" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <form
                className={cn("flex items-center gap-2 border-t px-3 py-2", MAC.line)}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (draft.some((v) => !v.trim())) return;
                    add.onAdd(draft.map((v) => v.trim()));
                    setDraft(add.fields.map(() => ""));
                }}
            >
                {add.fields.map((f, i) => (
                    <input key={f[0]} aria-label={s(f)} placeholder={s(f)} value={draft[i]} className={cn("h-7 min-w-0 flex-1 px-2 font-mono text-[12px]", MAC.field)} onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? e.target.value : x)))} />
                ))}
                <button type="submit" className={cn("flex h-7 shrink-0 items-center gap-1 rounded-md px-3 text-[12px] font-medium", MAC.accentBg)}>
                    <SFSymbol name="plus" className="size-2.5" />
                    {s(add.label ?? ["Add", "添加", "加入"])}
                </button>
            </form>
        </div>
    );
}

function InlineField({ initial, onDone }: { initial: string; onDone: (value: string | null) => void }) {
    const s = useText();
    const [text, setText] = useState(initial);
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
    return (
        <input
            ref={ref}
            value={text}
            aria-label={s(VALUE)}
            className="w-full rounded-[3px] bg-white px-1 text-[#1d1d1f] outline-2 outline-[#007aff] dark:bg-[#2a2a2a] dark:text-[#ececec]"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onDone(text); if (e.key === "Escape") onDone(null); }}
            onBlur={() => onDone(text)}
        />
    );
}
