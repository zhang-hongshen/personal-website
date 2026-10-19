import { Link } from "react-router";

import { PRODUCTS } from "~/lib/products";
import { cn } from "~/lib/utils";
import { ProductIcon } from "./product-icon";

// Draws the hub product in the middle with every other product on an orbit around it,
// linked by flowing lines. Empty dashed slots between them leave room for products still
// to come. Products with ring: false don't work with the hub yet and stay off the orbit.
export function ProductRing({ hub: hubId, className }: { hub: string; className?: string }) {
    const hub = PRODUCTS.find((p) => p.id === hubId) ?? PRODUCTS[0];
    const others = PRODUCTS.filter((p) => p !== hub && p.ring !== false);
    const step = 360 / others.length;
    const top = others.findIndex((p) => p.ringTop);
    const start = top >= 0 ? -90 - top * step : -90 + step / 2;
    const at = (deg: number) => {
        const a = (deg * Math.PI) / 180;
        return [50 + 36 * Math.cos(a), 50 + 36 * Math.sin(a)].map((v) => +v.toFixed(2)) as [number, number];
    };
    const nodes = others.map((p, i) => ({ p, xy: at(start + i * step) }));
    const slots = others.map((_, i) => at(start + (i + 0.5) * step));
    const pos = ([x, y]: [number, number]) => ({ "--x": `${x}%`, "--y": `${y}%` }) as React.CSSProperties;

    return (
        <div className={cn("product-ring", className)}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle className="ring-orbit" cx="50" cy="50" r="36" />
                {nodes.map(({ p, xy: [x, y] }, i) => (
                    <g key={p.id}>
                        <line className="ring-link" x1="50" y1="50" x2={x} y2={y} />
                        <line className="ring-flow" x1="50" y1="50" x2={x} y2={y} pathLength={100} style={{ animationDelay: `${-i * 0.9}s` }} />
                    </g>
                ))}
            </svg>
            {slots.map((xy, i) => (
                <span key={i} className="ring-slot" style={pos(xy)} aria-hidden="true" />
            ))}
            <Link className="ring-hub" to={`/products/${hub.id}/`} aria-label={hub.name}>
                <ProductIcon id={hub.id} />
            </Link>
            {nodes.map(({ p, xy }) => (
                <Link key={p.id} className="ring-node" to={`/products/${p.id}/`} style={pos(xy)} aria-label={p.name}>
                    <ProductIcon id={p.id} />
                </Link>
            ))}
        </div>
    );
}
