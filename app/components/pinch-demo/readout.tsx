// Pinch's LCD: slanted seven-segment digits with the unlit segments faintly visible.

const SEGMENTS: Record<string, string> = {
    "0": "abcdef", O: "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd",
    "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg", "-": "g", L: "def",
};

const H = 72;
const CELL = H * 0.56;
const SPACING = H * 0.14;

/** The outline of each segment of one cell, slanted like a typical LCD. */
function segmentPaths(): Record<string, string> {
    const slant = 0.1;
    const width = CELL - H * slant;
    const t = H * 0.12;
    const gap = t * 0.15;
    const half = t / 2;
    const [left, right, top, middle, bottom] = [t / 2, width - t / 2, t / 2, H / 2, H - t / 2];
    // Lean the top to the right: x' = x + slant × (height − y).
    const path = (points: [number, number][]) => `M${points.map(([x, y]) => `${(x + slant * (H - y)).toFixed(2)} ${y.toFixed(2)}`).join("L")}Z`;
    const horizontal = (y: number): [number, number][] => {
        const [x0, x1] = [left + gap, right - gap];
        return [[x0, y], [x0 + half, y - half], [x1 - half, y - half], [x1, y], [x1 - half, y + half], [x0 + half, y + half]];
    };
    const vertical = (x: number, y0: number, y1: number): [number, number][] => {
        [y0, y1] = [y0 + gap, y1 - gap];
        return [[x, y0], [x + half, y0 + half], [x + half, y1 - half], [x, y1], [x - half, y1 - half], [x - half, y0 + half]];
    };
    return {
        a: path(horizontal(top)),
        b: path(vertical(right, top, middle)),
        c: path(vertical(right, middle, bottom)),
        d: path(horizontal(bottom)),
        e: path(vertical(left, middle, bottom)),
        f: path(vertical(left, top, middle)),
        g: path(horizontal(middle)),
    };
}
const PATHS = segmentPaths();

/** Digits, "-", "O", "L" and one decimal point, right-aligned in at least `cells` cells. */
export function SevenSegment({ text, cells: minimum = 5, className }: { text: string; cells?: number; className?: string }) {
    const cells: { segments: string; point: boolean }[] = [];
    for (const ch of text) {
        if (ch === "." || ch === ",") {
            if (!cells.length) cells.push({ segments: "", point: false });
            cells[cells.length - 1].point = true;
        } else cells.push({ segments: SEGMENTS[ch] ?? "", point: false });
    }
    while (cells.length < minimum) cells.unshift({ segments: "", point: false });
    const width = cells.length * CELL + (cells.length - 1) * SPACING;
    return (
        <svg viewBox={`0 0 ${width} ${H}`} className={className} fill="currentColor" aria-hidden>
            {cells.map((cell, i) => (
                <g key={i} transform={`translate(${i * (CELL + SPACING)} 0)`}>
                    {Object.entries(PATHS).map(([name, d]) => (
                        <path key={name} d={d} opacity={cell.segments.includes(name) ? 1 : 0.07} />
                    ))}
                    {cell.point && <rect x={CELL - H * 0.11 + SPACING * 0.75} y={H - H * 0.11} width={H * 0.11} height={H * 0.11} />}
                </g>
            ))}
        </svg>
    );
}
