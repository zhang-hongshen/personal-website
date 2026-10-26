import { useEffect, useRef, useState, type ReactNode } from "react";

import { locale, useLang, useText } from "~/components/demo-text";
import { MAC, Segmented, Spinner } from "~/components/mac-ui";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import { STATUS, bytes, type Container, type Node, type Status } from "./data";
import { find, run, type Shell } from "./shell";

// The container inspector (ContainerDetailView): Info, Stats, Logs, Files and Terminal tabs.

type Tab = "info" | "stats" | "logs" | "files" | "terminal";

export function StatusBadge({ status }: { status: Status }) {
    const s = useText();
    const { title, color } = STATUS[status];
    return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-[7px] py-[3px] text-[11px] font-medium" style={{ color, background: `${color}1f` }}>
            {(status === "starting" || status === "stopping") && <Spinner className="size-2.5" />}
            {s(title)}
        </span>
    );
}

export function ContainerInspector({ container, onChange }: { container: Container; onChange: () => void }) {
    const s = useText();
    const [tab, setTab] = useState<Tab>("info");
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="px-3 pt-3 pb-2">
                <Segmented
                    className="w-full"
                    value={tab}
                    onChange={setTab}
                    options={[
                        { value: "info", label: s(["Info", "信息", "資訊"]) },
                        { value: "stats", label: s(["Stats", "统计", "統計"]) },
                        { value: "logs", label: s(["Logs", "日志", "日誌"]) },
                        { value: "files", label: s(["Files", "文件", "檔案"]) },
                        { value: "terminal", label: s(["Terminal", "终端", "終端機"]) },
                    ]}
                />
            </div>
            {tab === "info" && <Info container={container} />}
            {tab === "stats" && <Stats container={container} />}
            {tab === "logs" && <Logs container={container} />}
            {tab === "files" && <Files root={container.fs} />}
            {tab === "terminal" && <Terminal key={container.id} container={container} onChange={onChange} />}
        </div>
    );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex gap-3 text-[12px]">
            <span className={cn("w-16 shrink-0", MAC.muted)}>{label}</span>
            <span className="min-w-0 flex-1 break-all select-text">{children}</span>
        </div>
    );
}

function Info({ container: c }: { container: Container }) {
    const lang = useLang();
    const s = useText();
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            <div className="flex items-baseline gap-2">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px] font-semibold">{c.name}</p>
                    <p className={cn("truncate text-[11px] select-text", MAC.muted)}>{c.id}</p>
                </div>
                <StatusBadge status={c.status} />
            </div>
            <hr className={MAC.line} />
            <div className="flex flex-col gap-1.5">
                <Row label={s(["Image", "镜像", "映像檔"])}>{c.image}</Row>
                <Row label="CPU">{c.cpus} {s(["cores", "核", "核心"])}</Row>
                <Row label={s(["Memory", "内存", "記憶體"])}>{bytes(c.memory)}</Row>
                <Row label={s(["Created", "创建时间", "建立時間"])}>{new Date(c.created).toLocaleString(locale(lang), { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })}</Row>
            </div>
            <hr className={MAC.line} />
            <Row label={s(["Networks", "网络", "網路"])}>{c.networks.join(", ")}</Row>
            {c.ports.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <p className="text-[12px] font-semibold">{s(["Ports", "端口", "連接埠"])}</p>
                    {c.ports.map((p) => (
                        <div key={p.container} className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-[12px]", MAC.line)}>
                            <span>{p.container}/tcp</span>
                            <span className={MAC.muted}>→</span>
                            <span>{p.host ? `127.0.0.1:${p.host}` : <span className={MAC.muted}>{s(["Not published", "未发布", "未發佈"])}</span>}</span>
                            {p.host && <SFSymbol name="safari" className={cn("ml-auto size-3.5", c.status === "running" ? MAC.accent : MAC.muted)} aria-label={`localhost:${p.host}`} />}
                        </div>
                    ))}
                </div>
            )}
            {c.mounts.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <p className="text-[12px] font-semibold">{s(["Mounts", "挂载", "掛載"])}</p>
                    {c.mounts.map((m) => (
                        <div key={m.path} className={cn("rounded-lg border px-2.5 py-1.5 font-mono text-[12px]", MAC.line)}>
                            <p className="flex items-center gap-1.5"><SFSymbol name={m.source.startsWith("~") ? "folder" : "externaldrive"} className={cn("size-3", MAC.accent)} />{m.source}</p>
                            <p className={MAC.muted}>{m.path}{m.readOnly ? ` · ${s(["read-only", "只读", "唯讀"])}` : ""}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Chart({ title, values, max, unit, color }: { title: string; values: number[]; max: number; unit: (v: number) => string; color: string }) {
    const points = values.length ? values : [0];
    const top = Math.max(max, ...points) * 1.1;
    const path = points.map((v, i) => `${i ? "L" : "M"}${(i / Math.max(1, points.length - 1)) * 300} ${100 - (v / top) * 100}`).join(" ");
    return (
        <div className={cn("rounded-xl border p-3", MAC.line)}>
            <p className="flex justify-between text-[12px]"><span className="font-semibold">{title}</span><span className="tabular-nums">{unit(points[points.length - 1])}</span></p>
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="mt-2 h-24 w-full" aria-hidden>
                <path d={`${path} L300 100 L0 100 Z`} fill={color} fillOpacity="0.12" />
                <path d={path} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    );
}

function Stats({ container: c }: { container: Container }) {
    const s = useText();
    if (c.status !== "running" && c.status !== "paused") return <p className={cn("m-auto px-6 text-center text-[12px]", MAC.muted)}>{s(["Start the container to see its CPU and memory.", "启动容器后可查看 CPU 和内存。", "啟動容器後可查看 CPU 和記憶體。"])}</p>;
    return (
        <div className="flex flex-col gap-3 overflow-y-auto px-3 pb-3">
            <Chart title="CPU" values={c.cpu} max={100} unit={(v) => `${v.toFixed(1)}%`} color="#007aff" />
            <Chart title={s(["Memory", "内存", "記憶體"])} values={c.mem} max={c.memory / 1024 ** 2} unit={(v) => `${Math.round(v)} MB / ${bytes(c.memory)}`} color="#34c759" />
        </div>
    );
}

function Logs({ container: c }: { container: Container }) {
    const s = useText();
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight }); }, [c.logs.length]);
    return (
        <div ref={ref} className="mx-3 mb-3 min-h-0 flex-1 overflow-auto rounded-lg bg-[#1e1e1e] p-2.5 font-mono text-[11px] leading-[1.5] text-[#e5e5e5] select-text">
            {c.logs.length ? c.logs.map((l, i) => <p key={i} className="whitespace-pre-wrap break-all">{l}</p>) : <p className="text-white/50">{s(["No logs yet.", "还没有日志。", "還沒有日誌。"])}</p>}
        </div>
    );
}

function Files({ root }: { root: Node }) {
    const s = useText();
    const [path, setPath] = useState("/");
    const [open, setOpen] = useState<string | null>(null);
    const node = find(root, path);
    const file = open ? find(root, open) : null;
    if (file && !file.dir) {
        return (
            <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
                <button type="button" className={cn("mb-2 flex items-center gap-1 self-start text-[12px]", MAC.accent)} onClick={() => setOpen(null)}>
                    <SFSymbol name="chevron.left" className="size-2.5" />{path}
                </button>
                <p className="mb-1 font-mono text-[12px] font-semibold">{open}</p>
                <pre className={cn("min-h-0 flex-1 overflow-auto rounded-lg border p-2.5 font-mono text-[11px] leading-[1.5] whitespace-pre-wrap select-text", MAC.line)}>{file.file || s(["(empty)", "（空）", "（空）"])}</pre>
            </div>
        );
    }
    const crumbs = path.split("/").filter(Boolean);
    return (
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
            <p className="mb-2 flex flex-wrap items-center gap-1 font-mono text-[12px]">
                <button type="button" className={MAC.accent} onClick={() => setPath("/")}>/</button>
                {crumbs.map((c, i) => (
                    <span key={i} className="flex items-center gap-1">
                        <button type="button" className={MAC.accent} onClick={() => setPath(`/${crumbs.slice(0, i + 1).join("/")}`)}>{c}</button>
                        {i < crumbs.length - 1 && <span className={MAC.muted}>/</span>}
                    </span>
                ))}
            </p>
            <div className={cn("min-h-0 flex-1 overflow-y-auto rounded-lg border", MAC.line)}>
                {(node?.dir ?? []).map((n) => (
                    <button
                        key={n.name}
                        type="button"
                        className={cn("flex w-full items-center gap-2 px-2.5 py-1.5 text-left font-mono text-[12px]", MAC.stripe, MAC.hover)}
                        onClick={() => { const next = `${path === "/" ? "" : path}/${n.name}`; if (n.dir) setPath(next); else setOpen(next); }}
                    >
                        <SFSymbol name={n.dir ? "folder" : "doc"} className={cn("size-3.5 shrink-0", n.dir ? MAC.accent : MAC.muted)} />
                        <span className="flex-1 truncate">{n.name}</span>
                        {!n.dir && <span className={cn("text-[11px]", MAC.muted)}>{n.file?.length ?? 0} B</span>}
                    </button>
                ))}
                {node?.dir?.length === 0 && <p className={cn("p-3 text-center text-[12px]", MAC.muted)}>{s(["Empty folder", "空文件夹", "空資料夾"])}</p>}
            </div>
        </div>
    );
}

function Terminal({ container, onChange }: { container: Container; onChange: () => void }) {
    const s = useText();
    const [shell] = useState<Shell>({ cwd: "/root" });
    const [lines, setLines] = useState<string[]>([]);
    const [text, setText] = useState("");
    const [history, setHistory] = useState<string[]>([]);
    const [cursor, setCursor] = useState<number | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const input = useRef<HTMLInputElement>(null);
    const running = container.status === "running";
    const prompt = `${container.name}:${shell.cwd.replace(/^\/root/, "~") || "/"}#`;

    useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight }); }, [lines.length]);

    if (!running) return <p className={cn("m-auto px-6 text-center text-[12px]", MAC.muted)}>{s(["Start the container to open a shell in it.", "启动容器后可在其中打开 Shell。", "啟動容器後可在其中開啟 Shell。"])}</p>;
    return (
        <div ref={ref} className="mx-3 mb-3 min-h-0 flex-1 cursor-text overflow-auto rounded-lg bg-[#1e1e1e] p-2.5 font-mono text-[11.5px] leading-[1.5] text-[#e5e5e5]" onClick={() => input.current?.focus({ preventScroll: true })}>
            {lines.length === 0 && <p className="text-white/50">{s(["Type help to see the commands.", "输入 help 查看可用命令。", "輸入 help 查看可用指令。"])}</p>}
            {lines.map((l, i) => <pre key={i} className="whitespace-pre-wrap break-all select-text">{l}</pre>)}
            <label className="flex gap-1.5">
                <span className="shrink-0 text-[#30d158]">{prompt}</span>
                <input
                    ref={input}
                    value={text}
                    aria-label="Shell"
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    className="min-w-0 flex-1 bg-transparent caret-[#e5e5e5] outline-none"
                    onChange={(e) => { setText(e.target.value); setCursor(null); }}
                    onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return;
                        if (e.key === "Enter") {
                            const line = text;
                            setText("");
                            setCursor(null);
                            if (line.trim()) setHistory((h) => [...h, line]);
                            const out = run(container, shell, line);
                            if (out === null) setLines([]);
                            else setLines((ls) => [...ls, `${prompt} ${line}`, ...(out ? [out] : [])]);
                            onChange();
                        }
                        if ((e.key === "ArrowUp" || e.key === "ArrowDown") && history.length) {
                            e.preventDefault();
                            const at = cursor === null ? (e.key === "ArrowUp" ? history.length - 1 : null) : cursor + (e.key === "ArrowUp" ? -1 : 1);
                            if (at === null || at >= history.length) { setCursor(null); setText(""); return; }
                            setCursor(Math.max(0, at));
                            setText(history[Math.max(0, at)]);
                        }
                        if (e.key === "l" && e.ctrlKey) { e.preventDefault(); setLines([]); }
                    }}
                />
            </label>
        </div>
    );
}
