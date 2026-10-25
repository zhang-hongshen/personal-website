import type { ReactNode } from "react";

import { MAC } from "~/components/mac-ui";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { bytes, shortRef, type Container, type Image, type Network, type Volume } from "./data";

// Images (ContainerImagesView), Networks and Volumes, plus the image inspector.

export type Pull = { ref: string; done: number; total: number };

export function ImagesView({ images, pulls, query, grid, selected, onSelect }: {
    images: Image[];
    /** Tiles instead of rows; the toolbar's List / Grid control sets it. */
    grid: boolean;
    pulls: Pull[];
    query: string;
    selected: string | null;
    onSelect: (ref: string) => void;
}) {
    const match = (ref: string) => ref.toLowerCase().includes(query.trim().toLowerCase());
    const shown = images.filter((i) => match(i.ref)).sort((a, b) => a.ref.localeCompare(b.ref));
    const name = (ref: string) => {
        const [repo, tag] = shortRef(ref).split(":");
        return (
            <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-semibold">{repo}</span>
                <span className={cn("shrink-0 rounded-[4px] border px-1 font-mono text-[10px]", MAC.line, MAC.muted)}>{tag}</span>
            </span>
        );
    };
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
                {pulls.filter((p) => match(p.ref)).map((p) => (
                    <div key={p.ref} className={cn("mb-1 flex items-center gap-3 rounded-lg border px-3 py-2", MAC.line)}>
                        <ImageIcon />
                        <div className="min-w-0 flex-1">
                            {name(p.ref)}
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/8 dark:bg-white/10"><div className="h-full rounded-full bg-[#007aff] transition-[width]" style={{ width: `${(p.done / p.total) * 100}%` }} /></div>
                            <p className={cn("mt-1 text-[11px] tabular-nums", MAC.muted)}>{bytes(p.done)} of {bytes(p.total)}</p>
                        </div>
                    </div>
                ))}
                <div className={grid ? "grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2" : "flex flex-col"}>
                    {shown.map((i) => (
                        <button
                            key={i.ref}
                            type="button"
                            aria-current={i.ref === selected || undefined}
                            className={cn(
                                "flex items-center gap-3 rounded-lg text-left motion-safe:animate-in motion-safe:fade-in",
                                grid ? "flex-col justify-center border px-2 py-4 text-center" : "px-3 py-2",
                                grid && MAC.line,
                                i.ref === selected ? MAC.selected : MAC.hover,
                            )}
                            onClick={() => onSelect(i.ref)}
                        >
                            <ImageIcon large={grid} />
                            <span className={cn("min-w-0", grid ? "flex flex-col items-center gap-1" : "flex-1")}>
                                {name(i.ref)}
                                {!grid && <span className={cn("block text-[11px]", i.ref === selected ? "text-white/75" : MAC.muted)}>{bytes(i.size)}</span>}
                            </span>
                        </button>
                    ))}
                </div>
                {!shown.length && !pulls.length && <p className={cn("py-8 text-center text-[12px]", MAC.muted)}>No images match.</p>}
            </div>
        </div>
    );
}

function ImageIcon({ large }: { large?: boolean }) {
    return (
        <span className={cn("flex shrink-0 items-center justify-center rounded-[10px] bg-[#007aff]/12 text-[#007aff] dark:text-[#4da3ff]", large ? "size-12" : "size-8")}>
            <SFSymbol name="square.stack.3d.up" className={large ? "size-6" : "size-4"} />
        </span>
    );
}

export function ImageDetail({ image, used }: { image: Image; used: number }) {
    const [repo, tag] = shortRef(image.ref).split(":");
    const rows: [string, string][] = [
        ["Size", bytes(image.size)], ["Layers", String(image.layers)], ["Platform", "linux/arm64"], ["Created", image.created],
        ["Digest", image.digest], ["Command", image.cmd], ["Ports", image.ports.length ? image.ports.map((p) => `${p}/tcp`).join(", ") : "None"],
        ["Containers", String(used)],
    ];
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <div className="flex items-center gap-3">
                <ImageIcon large />
                <div className="min-w-0">
                    <p className="truncate text-[17px] font-semibold">{repo}</p>
                    <p className={cn("font-mono text-[11px]", MAC.muted)}>{tag}</p>
                </div>
            </div>
            <hr className={MAC.line} />
            {rows.map(([k, v]) => (
                <div key={k} className="flex gap-3 text-[12px]">
                    <span className={cn("w-20 shrink-0", MAC.muted)}>{k}</span>
                    <span className="min-w-0 flex-1 font-mono break-all select-text">{v}</span>
                </div>
            ))}
            {image.env.length > 0 && (
                <div className="flex flex-col gap-1">
                    <p className="text-[12px] font-semibold">Environment</p>
                    {image.env.map((e) => <p key={e} className={cn("rounded-md border px-2 py-1 font-mono text-[11px]", MAC.line)}>{e}</p>)}
                </div>
            )}
        </div>
    );
}

export function TableView<T>({ items, columns, selected, keyOf, onSelect, empty }: {
    items: T[];
    columns: { title: string; cell: (item: T) => ReactNode; numeric?: boolean }[];
    selected: string | null;
    keyOf: (item: T) => string;
    onSelect: (key: string) => void;
    empty: string;
}) {
    return (
        <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
            <table className="w-full border-collapse text-[12px]">
                <thead className={cn("sticky top-0", MAC.window)}>
                    <tr className={cn("border-b text-left", MAC.line)}>{columns.map((c) => <th key={c.title} className={cn("px-2 py-1.5 font-semibold", c.numeric && "text-right")}>{c.title}</th>)}</tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={keyOf(item)} className={cn("cursor-default motion-safe:animate-in motion-safe:fade-in", keyOf(item) === selected ? MAC.selected : MAC.stripe)} onClick={() => onSelect(keyOf(item))}>
                            {columns.map((c) => <td key={c.title} className={cn("px-2 py-1.5", c.numeric && "text-right tabular-nums")}>{c.cell(item)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
            {!items.length && <p className={cn("py-8 text-center text-[12px]", MAC.muted)}>{empty}</p>}
        </div>
    );
}

export const networkColumns = (containers: Container[]) => [
    { title: "Name", cell: (n: Network) => <span className="flex items-center gap-1.5">{n.name}{n.builtIn && <span className={cn("rounded-full border px-1.5 text-[10px]", MAC.line)}>Default</span>}</span> },
    { title: "Mode", cell: (n: Network) => n.mode },
    { title: "Subnet", cell: (n: Network) => <span className="font-mono">{n.subnet ?? "Automatic"}</span> },
    { title: "Containers", numeric: true, cell: (n: Network) => containers.filter((c) => c.networks.includes(n.name)).length },
];

export const volumeColumns = (containers: Container[]) => [
    { title: "Name", cell: (v: Volume) => <span className="flex items-center gap-1.5">{v.name}{containers.some((c) => c.mounts.some((m) => m.source === v.name)) && <span className={cn("rounded-full border px-1.5 text-[10px]", MAC.line)}>In Use</span>}</span> },
    { title: "Size", numeric: true, cell: (v: Volume) => bytes(v.size) },
    { title: "On Disk", numeric: true, cell: (v: Volume) => bytes(v.used) },
    { title: "Containers", numeric: true, cell: (v: Volume) => containers.filter((c) => c.mounts.some((m) => m.source === v.name)).length },
];
