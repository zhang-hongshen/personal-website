import { useCallback, useEffect, useState } from "react";

import { Inspector, MAC, MacSidebar, MacWindow, Popover, SearchField, Segmented, ShowSidebarButton, SidebarRow, TitleBar, ToolButton, Unavailable, useSidebar } from "~/components/mac-ui";
import { CAPSULE } from "~/components/mac-window";
import { SFSymbol, type SymbolName } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { IMAGES, PULLABLE, bytes, initial, newContainer, repoName, runningLog, shortRef, startLogs, type Container, type Image, type Network, type Volume } from "./data";
import { ContainerInspector, StatusBadge } from "./inspector";
import { ImageDetail, ImagesView, TableView, networkColumns, volumeColumns, type Pull } from "./views";

// A Container window that works like the app: containers you can create from local images, start,
// pause, stop and delete, with live stats, logs, files and a shell; images you can pull; networks and
// volumes. Nothing runs for real: it all lives in the page, and a reload starts over.

type Section = "containers" | "images" | "networks" | "volumes";
const SECTIONS: { id: Section; title: string; icon: SymbolName }[] = [
    { id: "containers", title: "Containers", icon: "shippingbox" },
    { id: "images", title: "Images", icon: "square.stack.3d.up" },
    { id: "networks", title: "Networks", icon: "network" },
    { id: "volumes", title: "Volumes", icon: "externaldrive" },
];

/** The demo's clock starts at a fixed time, so prerendered HTML is the same on every build. */
const START = new Date("2026-10-25T10:00:00Z");
const PRESET_NETWORK: Network = { name: "frontend", mode: "NAT", subnet: "192.168.80.0/24" };
const PRESET_VOLUME: Volume = { name: "uploads", size: 20 * 1024 ** 3, used: 0 };

export function ContainerDemo({ className }: { className?: string }) {
    const sidebar = useSidebar();
    const [section, setSection] = useState<Section>("containers");
    const [state, setState] = useState(() => initial(START));
    const [images, setImages] = useState<Image[]>(IMAGES);
    const [pulls, setPulls] = useState<Pull[]>([]);
    const [selected, setSelected] = useState<Record<Section, string | null>>({ containers: null, images: null, networks: null, volumes: null });
    const [queries, setQueries] = useState<Record<Section, string>>({ containers: "", images: "", networks: "", volumes: "" });
    // Shown or hidden by its button; null until then, which shows it on wide screens only.
    const [inspector, setInspector] = useState<boolean | null>(null);
    const [menu, setMenu] = useState<"new" | "pull" | "delete" | null>(null);
    const [pullRef, setPullRef] = useState("docker.io/library/node:22-alpine");
    const [grid, setGrid] = useState(false);
    const [, redraw] = useState(0);
    const changed = useCallback(() => redraw((n) => n + 1), []);

    const { containers, networks, volumes } = state;
    const containerId = selected.containers ?? containers[0]?.id ?? null;
    const container = containers.find((c) => c.id === containerId);
    const query = queries[section];

    // Each second: samples for running containers, a log line now and then, and pull progress.
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setState((s) => {
                for (const c of s.containers) {
                    if (c.status !== "running") continue;
                    const base = repoName(c.image) === "postgres" ? 9 : 3;
                    c.cpu = [...c.cpu.slice(-39), Math.max(0.2, base + (Math.random() - 0.4) * base)];
                    const used = c.mem[c.mem.length - 1] ?? c.memory / 1024 ** 2 / (repoName(c.image) === "postgres" ? 6 : 14);
                    c.mem = [...c.mem.slice(-39), Math.max(4, used + (Math.random() - 0.5) * 3)];
                    if (Math.random() < 0.35) { const line = runningLog(c.image, now); if (line) c.logs = [...c.logs.slice(-300), line]; }
                }
                return { ...s };
            });
            setPulls((ps) => {
                if (!ps.length) return ps;
                const next = ps.map((p) => ({ ...p, done: Math.min(p.total, p.done + p.total * (0.12 + Math.random() * 0.1)) }));
                const finished = next.filter((p) => p.done >= p.total);
                if (finished.length) setImages((is) => [...is, ...finished.map((p) => PULLABLE[p.ref]).filter((i) => !is.some((x) => x.ref === i.ref))]);
                return next.filter((p) => p.done < p.total);
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const select = (id: string) => setSelected((s) => ({ ...s, [section]: id }));
    const open = (id: Section) => { setSection(id); setMenu(null); sidebar.done(); };

    /** Moves a container through a transition (Starting, Stopping) to its final state. */
    const transition = (c: Container, through: Container["status"], to: Container["status"], ms: number) => {
        c.status = through;
        changed();
        setTimeout(() => {
            c.status = to;
            if (to === "running" && through === "starting") c.logs = [...c.logs, ...startLogs(c.image, new Date())];
            if (to === "stopped") { c.cpu = []; c.mem = []; c.logs = [...c.logs, `${new Date().toISOString().replace("T", " ").slice(0, 19)} received SIGTERM, shutting down`]; }
            changed();
        }, ms);
    };

    const create = (image: Image) => {
        const base = repoName(image.ref);
        let name = base;
        for (let n = 2; containers.some((c) => c.name === name); n++) name = `${base}-${n}`;
        const c = newContainer(image, name, new Date());
        setState((s) => ({ ...s, containers: [c, ...s.containers] }));
        setSelected((s) => ({ ...s, containers: c.id }));
        setMenu(null);
    };

    const remove = () => {
        setMenu(null);
        if (section === "containers" && container) setState((s) => ({ ...s, containers: s.containers.filter((c) => c !== container) }));
        if (section === "images" && selected.images) { setImages((is) => is.filter((i) => i.ref !== selected.images)); setSelected((s) => ({ ...s, images: null })); }
        if (section === "networks" && selected.networks) setState((s) => ({ ...s, networks: s.networks.filter((n) => n.name !== selected.networks || n.builtIn) }));
        if (section === "volumes" && selected.volumes) setState((s) => ({ ...s, volumes: s.volumes.filter((v) => v.name !== selected.volumes) }));
        if (section !== "containers") setSelected((s) => ({ ...s, [section]: null }));
    };

    const pull = () => {
        const ref = pullRef.trim();
        if (!PULLABLE[ref] || images.some((i) => i.ref === ref) || pulls.some((p) => p.ref === ref)) return;
        setPulls((ps) => [...ps, { ref, done: 0, total: PULLABLE[ref].size }]);
        setMenu(null);
    };

    const deleteName =
        section === "containers" ? container?.name
            : section === "images" ? selected.images && shortRef(selected.images)
                : section === "networks" ? networks.find((n) => n.name === selected.networks && !n.builtIn)?.name
                    : volumes.find((v) => v.name === selected.volumes && !containers.some((c) => c.mounts.some((m) => m.source === v.name)))?.name;

    const busy = container?.status === "starting" || container?.status === "stopping";
    const shownContainers = containers.filter((c) => `${c.name} ${c.image}`.toLowerCase().includes(query.trim().toLowerCase()));
    const image = images.find((i) => i.ref === selected.images);

    return (
        <MacWindow className={className}>
            <MacSidebar sidebar={sidebar} width={200}>
                <nav className="mt-1 flex flex-col gap-0.5">
                    {SECTIONS.map((s) => <SidebarRow key={s.id} icon={s.icon} label={s.title} selected={s.id === section} onClick={() => open(s.id)} />)}
                </nav>
            </MacSidebar>

            <main className="flex min-w-0 flex-1 flex-col">
                <TitleBar leading={<ShowSidebarButton sidebar={sidebar} />} title={SECTIONS.find((s) => s.id === section)!.title} className="flex-wrap gap-y-2 max-sm:h-auto max-sm:py-2">
                    <div className={cn(CAPSULE, "relative gap-0.5 px-0.5")}>
                        {section === "containers" && (
                            <>
                                <ToolButton grouped icon="plus" label="New Container" active={menu === "new"} onClick={() => setMenu((m) => (m === "new" ? null : "new"))} />
                                <ToolButton grouped icon="play.fill" label="Start" disabled={!container || busy || container.status === "running" || container.status === "paused"} onClick={() => container && transition(container, "starting", "running", 1400)} />
                                <ToolButton grouped icon={container?.status === "paused" ? "play.circle" : "pause.fill"} label={container?.status === "paused" ? "Resume" : "Pause"} disabled={!container || (container.status !== "running" && container.status !== "paused")} onClick={() => { if (container) { container.status = container.status === "paused" ? "running" : "paused"; changed(); } }} />
                                <ToolButton grouped icon="stop.fill" label="Stop" disabled={!container || busy || (container.status !== "running" && container.status !== "paused")} onClick={() => container && transition(container, "stopping", "stopped", 1100)} />
                            </>
                        )}
                        {section === "images" && <ToolButton grouped icon="square.and.arrow.down" label="Pull Image" active={menu === "pull"} onClick={() => setMenu((m) => (m === "pull" ? null : "pull"))} />}
                        {section === "networks" && <ToolButton grouped icon="plus" label="New Network" disabled={networks.some((n) => n.name === PRESET_NETWORK.name)} onClick={() => { setState((s) => ({ ...s, networks: [...s.networks, PRESET_NETWORK] })); setSelected((s) => ({ ...s, networks: PRESET_NETWORK.name })); }} />}
                        {section === "volumes" && <ToolButton grouped icon="plus" label="New Volume" disabled={volumes.some((v) => v.name === PRESET_VOLUME.name)} onClick={() => { setState((s) => ({ ...s, volumes: [...s.volumes, PRESET_VOLUME] })); setSelected((s) => ({ ...s, volumes: PRESET_VOLUME.name })); }} />}
                        <ToolButton grouped icon="trash" label="Delete" disabled={!deleteName || busy} active={menu === "delete"} onClick={() => setMenu((m) => (m === "delete" ? null : "delete"))} />

                        <Popover open={menu === "new"} onClose={() => setMenu(null)} className="left-0 right-auto w-64">
                            <p className={cn("px-2 pt-1 pb-1.5 text-[11px] font-semibold", MAC.muted)}>New Container from Image</p>
                            {images.map((i) => (
                                <button key={i.ref} type="button" className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[#007aff] hover:text-white" onClick={() => create(i)}>
                                    <span className="truncate font-mono">{shortRef(i.ref)}</span>
                                    <span className="shrink-0 text-[11px] opacity-70">{i.ports.length ? i.ports.map((p) => `:${p}`).join(" ") : ""}</span>
                                </button>
                            ))}
                        </Popover>
                        <Popover open={menu === "pull"} onClose={() => setMenu(null)} className="left-0 right-auto w-72 p-3">
                            <p className="font-semibold">Pull Image</p>
                            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); pull(); }}>
                                <input aria-label="Image reference" value={pullRef} className={cn("h-7 min-w-0 flex-1 px-2 font-mono", MAC.field)} onChange={(e) => setPullRef(e.target.value)} />
                                <button type="submit" className={cn("h-7 shrink-0 rounded-md px-3 font-medium", MAC.accentBg)}>Pull</button>
                            </form>
                            <p className={cn("mt-2 text-[11px]", MAC.muted)}>Available here:</p>
                            {Object.keys(PULLABLE).map((r) => (
                                <button key={r} type="button" className={cn("block w-full truncate rounded-md px-1.5 py-0.5 text-left font-mono text-[11px]", MAC.hover, images.some((i) => i.ref === r) && "line-through opacity-50")} onClick={() => setPullRef(r)}>{r}</button>
                            ))}
                        </Popover>
                        <Popover open={menu === "delete"} onClose={() => setMenu(null)} className="w-64 p-3">
                            <p className="font-semibold">Delete “{deleteName}”?</p>
                            <p className={cn("mt-1", MAC.muted)}>
                                {section === "containers" ? "The container stops and its root filesystem is removed. Mounted folders and volumes are kept." : section === "volumes" ? "All data in the volume is removed. This action cannot be undone." : "This action cannot be undone."}
                            </p>
                            <div className="mt-3 flex justify-end gap-2">
                                <button type="button" className={cn("h-7 rounded-md px-3", MAC.field)} onClick={() => setMenu(null)}>Cancel</button>
                                <button type="button" className="h-7 rounded-md bg-[#ff3b30] px-3 font-medium text-white" onClick={remove}>Delete</button>
                            </div>
                        </Popover>
                    </div>
                    {section === "images" && (
                        <Segmented options={[{ value: "list", label: "List" }, { value: "grid", label: "Grid" }]} value={grid ? "grid" : "list"} onChange={(v) => setGrid(v === "grid")} />
                    )}
                    {(section === "containers" || section === "images") && (
                        <>
                            <SearchField value={query} placeholder={section === "containers" ? "Search Containers" : "Search Images"} onChange={(v) => setQueries((q) => ({ ...q, [section]: v }))} className="w-40 max-sm:order-last max-sm:w-full" />
                            <ToolButton icon="sidebar.right" label={inspector === false ? "Show Inspector" : "Hide Inspector"} onClick={() => setInspector((i) => !(i ?? matchMedia("(min-width: 768px)").matches))} className="h-3.5 w-[18px]" />
                        </>
                    )}
                </TitleBar>

                {section === "containers" && (
                    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
                        {shownContainers.map((c) => {
                            const isSelected = c.id === containerId;
                            const last = c.status === "running" ? [c.cpu[c.cpu.length - 1], c.mem[c.mem.length - 1]] : null;
                            return (
                                <button key={c.id} type="button" aria-current={isSelected || undefined} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left motion-safe:animate-in motion-safe:fade-in", isSelected ? MAC.selected : MAC.hover)} onClick={() => select(c.id)}>
                                    <SFSymbol name="shippingbox" className="size-5 shrink-0" style={{ color: isSelected ? undefined : c.status === "running" ? "#34c759" : c.status === "paused" ? "#ffcc00" : "#8e8e93" }} />
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2">
                                            <span className="truncate font-semibold">{c.name}</span>
                                            <span className="ml-auto">{isSelected ? <span className="rounded-full bg-white/20 px-[7px] py-[3px] text-[11px] font-medium">{c.status === "new" ? "Created" : c.status[0].toUpperCase() + c.status.slice(1)}</span> : <StatusBadge status={c.status} />}</span>
                                        </span>
                                        <span className={cn("mt-0.5 flex gap-2 text-[11px]", isSelected ? "text-white/75" : MAC.muted)}>
                                            <span className="truncate">{shortRef(c.image)}</span>
                                            {last && last[0] !== undefined && <span className="ml-auto tabular-nums">{last[0].toFixed(1)}% · {Math.round(last[1])} MB</span>}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                        {!containers.length && <Unavailable icon="shippingbox" title="No Containers">Create one from an image with +.</Unavailable>}
                    </div>
                )}
                {section === "images" && <ImagesView images={images} pulls={pulls} query={query} grid={grid} selected={selected.images} onSelect={select} />}
                {section === "networks" && <TableView items={networks} columns={networkColumns(containers)} selected={selected.networks} keyOf={(n) => n.name} onSelect={select} empty="No networks." />}
                {section === "volumes" && <TableView items={volumes} columns={volumeColumns(containers)} selected={selected.volumes} keyOf={(v) => v.name} onSelect={select} empty="No volumes." />}
            </main>

            <Inspector open={inspector !== false && (section === "containers" || section === "images")} width={340} className={inspector === null ? "max-md:hidden" : undefined}>
                {section === "containers" && (container ? <ContainerInspector key={container.id} container={container} onChange={changed} /> : <Unavailable icon="shippingbox" title="No Container Selected" />)}
                {section === "images" && (image ? <ImageDetail image={image} used={containers.filter((c) => c.image === image.ref).length} /> : <Unavailable icon="square.stack.3d.up" title="No Image Selected">{bytes(images.reduce((n, i) => n + i.size, 0))} in {images.length} images</Unavailable>)}
            </Inspector>
        </MacWindow>
    );
}
