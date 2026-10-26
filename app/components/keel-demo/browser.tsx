import { useState, type ReactNode } from "react";

import { useText } from "~/components/demo-text";
import { MAC, Popover, SearchField, ToolButton } from "~/components/mac-ui";
import { CAPSULE } from "~/components/mac-window";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { TYPES, glob, remaining, type Entry, type KeyType } from "./data";

// The key browser (KeyBrowserView): a pattern filter, a type filter, and the keys as a namespace tree
// or a flat list. The tree splits names on ":".

export function TypeBadge({ type, className }: { type: KeyType; className?: string }) {
    const s = useText();
    return (
        <span className={cn("inline-block w-10 shrink-0 rounded-[4px] py-px text-center font-mono text-[9.5px] font-bold text-white", className)} style={{ background: TYPES[type].color }} aria-label={s(TYPES[type].name)}>
            {TYPES[type].short}
        </span>
    );
}

type Folder = { name: string; path: string; folders: Folder[]; keys: string[]; count: number };

function tree(keys: string[]): Folder {
    const root: Folder = { name: "", path: "", folders: [], keys: [], count: 0 };
    for (const key of keys) {
        const parts = key.split(":");
        let at = root;
        at.count++;
        for (const part of parts.slice(0, -1)) {
            const path = at.path ? `${at.path}:${part}` : part;
            let next = at.folders.find((f) => f.name === part);
            if (!next) at.folders.push((next = { name: part, path, folders: [], keys: [], count: 0 }));
            next.count++;
            at = next;
        }
        at.keys.push(key);
    }
    return root;
}

export function KeyBrowser({ db, selected, now, type, asTree, onType, onAsTree, onSelect }: {
    db: Record<string, Entry>;
    /** The type filter and the view, as folders or a flat list, beside the search field. */
    type: KeyType | "all";
    asTree: boolean;
    onType: (type: KeyType | "all") => void;
    onAsTree: (asTree: boolean) => void;
    selected: string | null;
    /** The current time once the page runs, for TTLs; null while prerendering. */
    now: number | null;
    onSelect: (key: string) => void;
}) {
    const s = useText();
    const [pattern, setPattern] = useState("");
    const [collapsed, setCollapsed] = useState<string[]>([]);
    const [picking, setPicking] = useState(false);

    const keys = Object.keys(db)
        .filter((k) => (type === "all" || db[k].data.type === type) && (!pattern.trim() || glob(pattern.includes("*") || pattern.includes("?") ? pattern.trim() : `*${pattern.trim()}*`, k)))
        .sort();

    const row = (key: string, label: string, depth: number) => {
        const e = db[key];
        const isSelected = key === selected;
        return (
            <button
                key={key}
                type="button"
                aria-current={isSelected || undefined}
                className={cn("mx-2 flex h-7 shrink-0 items-center gap-2 rounded-md pr-2 text-left", isSelected ? MAC.selected : MAC.hover)}
                style={{ paddingLeft: 8 + depth * 14 }}
                onClick={() => onSelect(key)}
            >
                <TypeBadge type={e.data.type} />
                <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{label}</span>
                {e.expiresAt !== null && now !== null && (
                    <span className={cn("shrink-0 text-[11px] tabular-nums", isSelected ? "text-white/80" : MAC.muted)}>{remaining(e.expiresAt, now, s)}</span>
                )}
            </button>
        );
    };

    const folder = (f: Folder, depth: number): ReactNode[] => {
        const open = !collapsed.includes(f.path);
        return [
            <button
                key={`folder:${f.path}`}
                type="button"
                aria-expanded={open}
                className={cn("mx-2 flex h-7 shrink-0 items-center gap-1.5 rounded-md pr-2 text-left", MAC.hover)}
                style={{ paddingLeft: 4 + depth * 14 }}
                onClick={() => setCollapsed((c) => (open ? [...c, f.path] : c.filter((p) => p !== f.path)))}
            >
                <SFSymbol name="chevron.right" className={cn("size-2.5 shrink-0 transition-transform", MAC.muted, open && "rotate-90")} />
                <SFSymbol name="folder" className={cn("size-3.5 shrink-0", MAC.accent)} />
                <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{f.name}</span>
                <span className={cn("text-[11px] tabular-nums", MAC.muted)}>{f.count}</span>
            </button>,
            ...(open ? [...f.folders.flatMap((sub) => folder(sub, depth + 1)), ...f.keys.map((k) => row(k, k.slice(f.path.length + 1), depth + 1))] : []),
        ];
    };

    const root = tree(keys);
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-1.5 px-3 pb-2">
                <SearchField value={pattern} placeholder={s(["Filter keys, e.g. user:*", "筛选 Key，例如 user:*", "篩選 Key，例如 user:*"])} onChange={setPattern} className="min-w-0 flex-1" />
                <div className={cn(CAPSULE, "relative gap-0.5 px-0.5")}>
                    <ToolButton grouped icon="line.3.horizontal.decrease.circle" label={s(["Type", "类型", "類型"])} active={type !== "all" || picking} onClick={() => setPicking((p) => !p)} />
                    <ToolButton grouped icon={asTree ? "list.bullet.indent" : "list.bullet"} label={asTree ? s(["View as List", "以列表显示", "以列表顯示"]) : s(["View as Folders", "以文件夹显示", "以資料夾顯示"])} onClick={() => onAsTree(!asTree)} className="size-3.5" />
                    <Popover open={picking} onClose={() => setPicking(false)} className="w-40">
                        {(["all", ...Object.keys(TYPES)] as (KeyType | "all")[]).map((t) => (
                            <button key={t} type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-[#007aff] hover:text-white" onClick={() => { onType(t); setPicking(false); }}>
                                <SFSymbol name="checkmark" className={cn("size-2.5", t !== type && "invisible")} />
                                {t === "all" ? s(["All Types", "全部类型", "全部類型"]) : s(TYPES[t].name)}
                            </button>
                        ))}
                    </Popover>
                </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto pb-3">
                {asTree ? [...root.folders.flatMap((f) => folder(f, 0)), ...root.keys.map((k) => row(k, k, 0))] : keys.map((k) => row(k, k, 0))}
                {!keys.length && <p className={cn("px-5 py-6 text-center text-[12px]", MAC.muted)}>{Object.keys(db).length ? s(["No keys match.", "没有匹配的 Key。", "沒有符合的 Key。"]) : s(["This database is empty.", "这个数据库是空的。", "這個資料庫是空的。"])}</p>}
            </div>
            <p className={cn("border-t px-4 py-1.5 text-[11px]", MAC.line, MAC.muted)}>
                {s([`${keys.length} of ${Object.keys(db).length} keys`, `${keys.length} / ${Object.keys(db).length} 个 Key`, `${keys.length} / ${Object.keys(db).length} 個 Key`])}
            </p>
        </div>
    );
}
