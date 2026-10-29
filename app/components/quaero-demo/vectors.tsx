import { useEffect, useRef, useState } from "react";

import { locale, useLang, useText, type L } from "~/components/demo-text";
import { MAC, ToolButton } from "~/components/mac-ui";
import { cn } from "~/lib/utils";
import type { Kind, Value } from "./data";
import { heat, parseVector, stats } from "./vector";

// How Quaero shows vectors (VectorColumns.md): a fingerprint strip in the cell, the dimension in the
// column header, a context menu with Find Similar Rows, and the vector panel of the inspector.

export type Metric = "<=>" | "<->" | "<#>";
export const METRICS: { op: Metric; label: L }[] = [
    { op: "<=>", label: ["Cosine Distance", "余弦距离", "餘弦距離"] },
    { op: "<->", label: ["Euclidean (L2) Distance", "欧氏 (L2) 距离", "歐氏 (L2) 距離"] },
    { op: "<#>", label: ["Negative Inner Product", "负内积", "負內積"] },
];
const SIMILAR: L = ["Find Similar Rows", "查找相似行", "尋找相似列"];

/** The first 24 components as equal segments, scaled to the vector's largest magnitude. */
export function Fingerprint({ vector, className }: { vector: number[]; className?: string }) {
    const parts = vector.slice(0, 24);
    const scale = Math.max(...vector.map(Math.abs));
    return (
        <span className={cn("inline-flex h-3 w-[72px] shrink-0 overflow-hidden rounded-[2px] ring-[0.5px] ring-current/40", className)} aria-hidden>
            {parts.map((x, i) => <span key={i} className="h-full flex-1" style={{ background: heat(x, scale) }} />)}
        </span>
    );
}

/** A vector cell: the strip, then the raw text, cut to the column's width. */
export function VectorCell({ value }: { value: Value }) {
    const t = useText();
    const v = parseVector(value);
    if (!v) return <>{String(value)}</>;
    const s = stats(v);
    const summary = t([
        `${v.length} dimensions · norm ${s.norm.toFixed(4)} · min ${s.min.value.toFixed(4)} · max ${s.max.value.toFixed(4)}`,
        `${v.length} 维 · 范数 ${s.norm.toFixed(4)} · 最小 ${s.min.value.toFixed(4)} · 最大 ${s.max.value.toFixed(4)}`,
        `${v.length} 維 · 範數 ${s.norm.toFixed(4)} · 最小 ${s.min.value.toFixed(4)} · 最大 ${s.max.value.toFixed(4)}`,
    ]);
    return (
        <span className="flex min-w-0 items-center gap-1.5" title={`${summary}\n${String(value).slice(0, 500)}`}>
            <Fingerprint vector={v} />
            <span className="min-w-0 truncate font-mono text-[11px] opacity-80">{String(value)}</span>
        </span>
    );
}

/** The dimension shown once in a vector column's header, when every shown value has the same one. */
export function dimensionsOf(values: Value[]): number | null {
    const dims = new Set(values.map((v) => parseVector(v)?.length).filter((n) => n !== undefined));
    return dims.size === 1 ? [...dims][0]! : null;
}

/** The context menu of a vector cell, at the pointer. */
export function VectorMenu({ at, kind, indexed, onSimilar, onDetails, onClose }: {
    at: { x: number; y: number };
    kind: Kind;
    /** The metric an index on the column serves, marked "Indexed". */
    indexed: Metric | null;
    onSimilar: (metric?: Metric) => void;
    onDetails: () => void;
    onClose: () => void;
}) {
    const s = useText();
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const close = (e: Event) => !ref.current?.contains(e.target as Node) && onClose();
        document.addEventListener("pointerdown", close);
        window.addEventListener("scroll", onClose, true);
        return () => { document.removeEventListener("pointerdown", close); window.removeEventListener("scroll", onClose, true); };
    }, [onClose]);
    const item = "flex w-full items-center gap-3 rounded-[5px] px-2 py-1 text-left hover:bg-[#007aff] hover:text-white";
    return (
        <div ref={ref} role="menu" className={cn("fixed z-[300] w-60 rounded-lg border p-1 text-[13px] shadow-[0_10px_30px_rgb(0_0_0/0.25)] backdrop-blur-xl", MAC.line, "bg-white/90 dark:bg-[#2a2a2a]/90")} style={{ left: at.x, top: at.y }}>
            {kind === "postgresql" ? (
                <>
                    <p className={cn("px-2 pt-1 pb-0.5 text-[11px] font-semibold", MAC.muted)}>{s(SIMILAR)}</p>
                    {METRICS.map((m) => (
                        <button key={m.op} type="button" role="menuitem" className={item} onClick={() => onSimilar(m.op)}>
                            <span className="flex-1">{s(m.label)}</span>
                            {indexed === m.op && <span className="text-[11px] opacity-70">{s(["Indexed", "已索引", "已索引"])}</span>}
                        </button>
                    ))}
                </>
            ) : (
                <button type="button" role="menuitem" className={item} onClick={() => onSimilar()}>{s(SIMILAR)}</button>
            )}
            <hr className={cn("my-1", MAC.line)} />
            <button type="button" role="menuitem" className={item} onClick={onDetails}>{s(["Show Vector Details", "显示向量详情", "顯示向量詳細資訊"])}</button>
        </div>
    );
}

/** The inspector's vector panel: statistics, a heatmap of every component, and a histogram. */
export function VectorDetail({ column, row, value, onClose }: { column: string; row: number; value: Value; onClose: () => void }) {
    const s = useText();
    const v = parseVector(value);
    const [hover, setHover] = useState<number | null>(null);
    return (
        <>
            <header className="flex h-[52px] shrink-0 items-center gap-2 px-3">
                <h4 className="mr-auto truncate text-[13px] font-semibold">{s(["Vector", "向量", "向量"])}</h4>
            </header>
            {!v ? (
                <p className={cn("m-auto px-6 text-center text-[12px]", MAC.muted)}>
                    {s(["No Vector Selected", "未选择向量", "未選擇向量"])}<br />{s(["Click a vector cell to see it here.", "点按一个向量单元格，在这里查看。", "按一下向量儲存格，在這裡查看。"])}
                </p>
            ) : (
                <VectorBody column={column} row={row} v={v} hover={hover} onHover={setHover} />
            )}
        </>
    );
}

function VectorBody({ column, row, v, hover, onHover }: { column: string; row: number; v: number[]; hover: number | null; onHover: (i: number | null) => void }) {
    const t = useText();
    const lang = useLang();
    const s = stats(v);
    const scale = Math.max(...v.map(Math.abs));
    const bins = 24;
    const lo = s.min.value, hi = s.max.value, width = (hi - lo) / bins || 1;
    const counts = Array.from({ length: bins }, () => 0);
    for (const x of v) counts[Math.min(bins - 1, Math.floor((x - lo) / width))]++;
    const top = Math.max(...counts);
    const fmt = (x: number) => x.toLocaleString(locale(lang), { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    const at = (x: number, i: number) => t([`${fmt(x)} at ${i}`, `${fmt(x)}（第 ${i} 维）`, `${fmt(x)}（第 ${i} 維）`]);
    const rows: [L, string][] = [
        [["Norm", "范数", "範數"], `${fmt(s.norm)}${s.normalized ? t([" · Normalized", " · 已归一化", " · 已正規化"]) : ""}`], [["Mean", "平均值", "平均值"], fmt(s.mean)],
        [["Minimum", "最小值", "最小值"], at(s.min.value, s.min.at)], [["Maximum", "最大值", "最大值"], at(s.max.value, s.max.at)], [["Zeros", "零值", "零值"], String(s.zeros)],
    ];
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3 text-[12px]">
            <div>
                <p className="font-mono text-[13px] font-semibold">{column}</p>
                <p className={MAC.muted}>{t([`Row ${row + 1} · ${v.length} dimensions`, `第 ${row + 1} 行 · ${v.length} 维`, `第 ${row + 1} 列 · ${v.length} 維`])}</p>
            </div>
            <dl className={cn("grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border p-2.5", MAC.line)}>
                {rows.map(([k, val]) => [<dt key={`${k[0]}k`} className={MAC.muted}>{t(k)}</dt>, <dd key={`${k[0]}v`} className="text-right tabular-nums">{val}</dd>])}
            </dl>
            <div>
                <p className="mb-1.5 font-semibold">{t(["Heatmap", "热力图", "熱度圖"])}</p>
                <div className="grid grid-cols-[repeat(32,1fr)] gap-px" onMouseLeave={() => onHover(null)}>
                    {v.map((x, i) => (
                        <span key={i} className={cn("aspect-square rounded-[1px] ring-[0.5px] ring-black/10 dark:ring-white/10", hover === i && "ring-2 ring-current")} style={{ background: heat(x, scale) }} onMouseEnter={() => onHover(i)} />
                    ))}
                </div>
                <p className={cn("mt-1 h-4 tabular-nums", MAC.muted)}>{hover === null
                    ? t(["Hover a square to see its value.", "把指针移到方格上查看数值。", "把指標移到方格上查看數值。"])
                    : t([`Dimension ${hover + 1}: ${fmt(v[hover])}`, `第 ${hover + 1} 维：${fmt(v[hover])}`, `第 ${hover + 1} 維：${fmt(v[hover])}`])}</p>
            </div>
            <div>
                <p className="mb-1.5 font-semibold">{t(["Histogram", "直方图", "直方圖"])}</p>
                <svg viewBox={`0 0 ${bins * 10} 60`} className="h-20 w-full" preserveAspectRatio="none" role="img" aria-label={t(["Distribution of component values", "各分量取值的分布", "各分量取值的分佈"])}>
                    {counts.map((c, i) => {
                        const from = lo + i * width, to = from + width;
                        const color = to <= 0 ? "#0a7aff" : from >= 0 ? "#ff3b30" : "#8e8e93";
                        const h = top ? (c / top) * 58 : 0;
                        return <rect key={i} x={i * 10 + 1} y={60 - h} width={8} height={h} rx={1} fill={color} />;
                    })}
                </svg>
                <p className={cn("flex justify-between tabular-nums", MAC.muted)}><span>{fmt(lo)}</span><span>{fmt(hi)}</span></p>
            </div>
        </div>
    );
}
