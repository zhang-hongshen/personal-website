import { useState, type ReactNode } from "react";

import { MAC, SearchField } from "~/components/mac-ui";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { TYPES, glob, remaining, type Entry, type KeyType } from "./data";

// The key browser (KeyBrowserView): a pattern filter, a type filter, and the keys as a namespace tree
// or a flat list. The tree splits names on ":".

export function TypeBadge({ type, className }: { type: KeyType; className?: string }) {
    return (
        <span className={cn("inline-block w-10 shrink-0 rounded-[4px] py-px text-center font-mono text-[9.5px] font-bold text-white", className)} style={{ background: TYPES[type].color }} aria-label={TYPES[type].name}>
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

export function KeyBrowser({ db, selected, now, type, asTree, onSelect }: {
    db: Record<string, Entry>;
    /** The toolbar's type filter and view, as folders or a flat list. */
    type: KeyType | "all";
    asTree: boolean;
    selected: string | null;
    /** The current time once the page runs, for TTLs; null while prerendering. */
    now: number | null;
    onSelect: (key: string) => void;
}) {
    const [pattern, setPattern] = useState("");
    const [collapsed, setCollapsed] = useState<string[]>([]);

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
                    <span className={cn("shrink-0 text-[11px] tabular-nums", isSelected ? "text-white/80" : MAC.muted)}>{remaining(e.expiresAt, now)}</span>
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
                <SearchField value={pattern} placeholder="Filter keys, e.g. user:*" onChange={setPattern} className="w-full" />
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto pb-3">
                {asTree ? [...root.folders.flatMap((f) => folder(f, 0)), ...root.keys.map((k) => row(k, k, 0))] : keys.map((k) => row(k, k, 0))}
                {!keys.length && <p className={cn("px-5 py-6 text-center text-[12px]", MAC.muted)}>{Object.keys(db).length ? "No keys match." : "This database is empty."}</p>}
            </div>
            <p className={cn("border-t px-4 py-1.5 text-[11px]", MAC.line, MAC.muted)}>{keys.length} of {Object.keys(db).length} keys</p>
        </div>
    );
}
