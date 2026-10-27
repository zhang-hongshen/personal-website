import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { getProduct } from "~/lib/products";
import { useLatestRelease } from "~/lib/release";
import { cn } from "~/lib/utils";
import { Glyph } from "./glyph";
import { ProductIcon } from "./product-icon";
import { SFSymbol, type SymbolName } from "./sf-symbol";

// Building blocks shared by the product pages.

export function Section({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <section className={cn("py-20", className)}>
            <div className="wrap">{children}</div>
        </section>
    );
}

export function Eyebrow({ children }: { children: ReactNode }) {
    return <p className="mb-3 inline-flex items-center gap-2 text-[13px] font-semibold text-primary">{children}</p>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
    return <h2 className="mb-3.5 text-[clamp(28px,4vw,40px)] font-bold">{children}</h2>;
}

export function SectionLead({ className, children }: { className?: string; children: ReactNode }) {
    return <p className={cn("mb-11 max-w-[640px] text-[17px] text-muted-foreground", className)}>{children}</p>;
}

/** Page title and description for a product page. */
export function ProductMeta({ id }: { id: string }) {
    const { t } = useTranslation();
    return (
        <>
            <title>{t(`${id}.meta.title`)}</title>
            <meta name="description" content={t(`${id}.meta.description`)} />
        </>
    );
}

const DownloadIcon = () => (
    <Glyph strokeWidth={2}>
        <path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14" />
    </Glyph>
);
const ClockIcon = () => (
    <Glyph strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
    </Glyph>
);

export function DownloadButton({ repo }: { repo: string }) {
    const { t } = useTranslation();
    const href = useLatestRelease(repo);
    return (
        <Button asChild>
            <a href={href}>
                <DownloadIcon />
                {t("modelcraft.download_for_macos")}
            </a>
        </Button>
    );
}

export function ComingSoonButton({ label }: { label: string }) {
    return (
        <Button asChild>
            <span aria-disabled="true">
                <ClockIcon />
                {label}
            </span>
        </Button>
    );
}

/** Icon, name, tagline, call to action and requirements at the top of a product page. */
export function Hero({ id, tint, tagline, action, note, children }: {
    id: string;
    /** Glow behind the hero, as "<color> <percent>". */
    tint: string;
    tagline: ReactNode;
    action: ReactNode;
    note: ReactNode;
    children?: ReactNode;
}) {
    const { name } = getProduct(id);
    return (
        <section
            className="pt-24 pb-16 text-center"
            style={{ background: `radial-gradient(800px 380px at 50% 0%, color-mix(in srgb, ${tint}, transparent), transparent 65%)` }}
        >
            <div className="wrap">
                <ProductIcon id={id} className="mx-auto mb-5 size-40" width={160} height={160} />
                <h1 className="text-[clamp(44px,8vw,76px)] font-extrabold tracking-[-0.04em]">{name}</h1>
                <p className="mx-auto mt-4 mb-9 max-w-[680px] text-[clamp(18px,2.6vw,22px)] text-muted-foreground">{tagline}</p>
                <div className="flex flex-wrap items-center justify-center gap-3">{action}</div>
                <p className="mx-auto mt-3.5 max-w-[520px] text-[13px] text-faint">{note}</p>
                {children}
            </div>
        </section>
    );
}

export type Feature = { icon: ReactNode; title: string; body: string };

export function FeatureGrid({ features }: { features: Feature[] }) {
    const { t } = useTranslation();
    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
            {features.map((f) => (
                <Card key={f.title} className="p-[26px] transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong">
                    <div className="mb-[18px] flex text-primary">{f.icon}</div>
                    <h3 className="mb-1.5 text-[17px] font-semibold tracking-[-0.01em]">{t(f.title)}</h3>
                    <p className="text-[15px] text-muted-foreground">{t(f.body)}</p>
                </Card>
            ))}
        </div>
    );
}

/** Text beside a picture; `reverse` puts the picture first on wide screens. */
export function Split({ reverse, children }: { reverse?: boolean; children: ReactNode }) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 items-center gap-12 min-[900px]:grid-cols-[5fr_7fr]",
                reverse && "min-[900px]:[&>:first-child]:order-2",
                "[&_h3]:mb-3.5 [&_h3]:text-[clamp(24px,3vw,30px)] [&_h3]:font-bold [&_p]:text-base [&_p]:text-muted-foreground [&_ul]:pl-5 [&_ul]:text-muted-foreground [&_li]:my-2",
            )}
        >
            {children}
        </div>
    );
}

/** Screenshot with a light and a dark variant (already framed, on a transparent background). */
export function Shot({ light, dark, alt, width, height, className, eager }: {
    light: string; dark: string; alt: string; width: number; height: number; className?: string; eager?: boolean;
}) {
    return (
        <div className={className}>
            <img className="only-light h-auto w-full" src={light} alt={alt} width={width} height={height} loading={eager ? undefined : "lazy"} />
            <img className="only-dark h-auto w-full" src={dark} alt={alt} width={width} height={height} loading="lazy" />
        </div>
    );
}

/** A folder or file in a FileTree; `note` is a translation key shown at the end of the row. */
export type FileNode = { name: string; icon?: SymbolName; note?: string; children?: FileNode[] };

/** Folders and files laid out like a Finder list view, every folder open. */
export function FileTree({ nodes }: { nodes: FileNode[] }) {
    const { t } = useTranslation();
    const rows: { node: FileNode; depth: number }[] = [];
    const walk = (list: FileNode[], depth: number) => list.forEach((node) => {
        rows.push({ node, depth });
        if (node.children) walk(node.children, depth + 1);
    });
    walk(nodes, 0);
    return (
        <div className="overflow-x-auto rounded-card border border-border bg-card p-3 shadow-card">
            {rows.map(({ node, depth }, i) => (
                <div
                    key={i}
                    className="flex h-8 items-center gap-2 rounded-md px-2 text-[14px] whitespace-nowrap odd:bg-muted/50"
                    style={{ paddingLeft: 8 + depth * 22 }}
                >
                    {node.children
                        ? <SFSymbol name="chevron.down" className="size-2.5 shrink-0 text-faint" />
                        : <span className="w-2.5 shrink-0" />}
                    <SFSymbol
                        name={node.children ? "folder" : node.icon ?? "doc"}
                        className={cn("size-4 shrink-0", node.children ? "text-[#1a8cff]" : "text-muted-foreground")}
                    />
                    <span className="truncate">{node.name}</span>
                    {node.note && <span className="ml-auto pl-6 text-[13px] text-faint">{t(node.note)}</span>}
                </div>
            ))}
        </div>
    );
}

/** Centered eyebrow and heading (and optional line) for a single message. */
export function Statement({ eyebrow, title, body, className }: { eyebrow: string; title: string; body?: string; className?: string }) {
    const { t } = useTranslation();
    return (
        <Section className={cn("text-center", className)}>
            <Eyebrow>{t(eyebrow)}</Eyebrow>
            <h2 className="text-[clamp(30px,5vw,48px)] font-bold tracking-[-0.03em]">{t(title)}</h2>
            {body && <p className="mx-auto mt-4 max-w-[560px] text-lg text-muted-foreground">{t(body)}</p>}
        </Section>
    );
}

/** Short titled points (numbered when `steps`), four or three to a row. */
export function Points({ points, steps, columns = 4 }: { points: { title: string; body: string }[]; steps?: boolean; columns?: 3 | 4 }) {
    const { t } = useTranslation();
    return (
        <div
            className={cn(
                "grid grid-cols-1 gap-x-10 gap-y-7",
                columns === 4 ? "min-[560px]:grid-cols-2 min-[960px]:grid-cols-4" : "min-[560px]:grid-cols-3",
            )}
        >
            {points.map((p, i) => (
                <div key={p.title}>
                    {steps && <span className="mb-1.5 block text-[13px] font-semibold text-primary">{i + 1}</span>}
                    <h3 className="mb-1.5 text-[17px] font-semibold">{t(p.title)}</h3>
                    <p className="text-[15px] text-muted-foreground">{t(p.body)}</p>
                </div>
            ))}
        </div>
    );
}
