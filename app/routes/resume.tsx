import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Glyph } from "~/components/glyph";
import { ProductIcon } from "~/components/product-icon";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

// Lucide-style strokes.
const icon = (shapes: ReactNode) => ({ className }: { className?: string }) => (
    <Glyph strokeWidth={2} className={className}>{shapes}</Glyph>
);
const Mail = icon(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></>);
const GitHub = icon(<><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></>);
const Briefcase = icon(<><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>);
const Cap = icon(<><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></>);
const Rocket = icon(<><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></>);
const Code = icon(<><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>);
const Layers = icon(<><path d="m12 2 10 5-10 5L2 7z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></>);
const Award = icon(<><circle cx="12" cy="8" r="6" /><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11" /></>);
const Globe = icon(<><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>);
const Calendar = icon(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>);
const Pin = icon(<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>);
const Arrow = icon(<path d="M7 17 17 7M7 7h10v10" />);
const Cert = icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 15l2 2 4-4" /></>);
const Chart = icon(<><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></>);
const News = icon(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 7h10M7 12h10M7 17h6" /></>);

/** A logo from the brand sprite (public/assets/icons/brands.svg). */
function Brand({ id, className, label }: { id: string; className?: string; label?: string }) {
    return (
        <svg className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
            <use href={`/assets/icons/brands.svg#${id}`} />
        </svg>
    );
}

/** A technology tag, with its logo when the sprite has one. */
type Tech = string | [brand: string, name: string];
function Stack({ items, size, className }: { items: Tech[]; size?: "sm"; className?: string }) {
    return (
        <div className={cn("flex flex-wrap gap-1.5", className)}>
            {items.map((item) => {
                const [brand, name] = typeof item === "string" ? [null, item] : item;
                return (
                    <Badge key={name} size={size}>
                        {brand && <Brand id={brand} className="size-[13px] flex-none text-foreground" />}
                        {name}
                    </Badge>
                );
            })}
        </div>
    );
}

function SectionHead({ icon: Icon, children }: { icon: ReturnType<typeof icon>; children: ReactNode }) {
    return (
        <div className="mb-6 flex items-center gap-3">
            <span className="grid size-9 flex-none place-items-center rounded-[11px] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-primary">
                <Icon className="size-[18px]" />
            </span>
            <h2 className="text-xl font-bold">{children}</h2>
        </div>
    );
}

function When({ icon: Icon = Calendar, className, children }: { icon?: ReturnType<typeof icon>; className?: string; children: ReactNode }) {
    return (
        <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-faint tabular-nums", className)}>
            <Icon className="size-3.5" />
            {children}
        </span>
    );
}

/** One timeline entry; `hue` tints its mark, bullets and highlighted numbers. */
function Entry({ hue, mark, logo = true, title, href, when, role, bullets, stack }: {
    hue: string;
    mark: ReactNode;
    logo?: boolean;
    title: ReactNode;
    href?: string;
    when?: string;
    role?: ReactNode;
    bullets?: string;
    stack?: Tech[];
}) {
    const { t } = useTranslation();
    const items = bullets ? (t(bullets, { returnObjects: true }) as string[]) : [];
    return (
        <article
            className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-4 break-inside-avoid not-last:after:absolute not-last:after:top-[52px] not-last:after:-bottom-6 not-last:after:left-[21px] not-last:after:w-0.5 not-last:after:rounded-sm not-last:after:bg-border"
            style={{ "--hue": hue } as React.CSSProperties}
        >
            <div
                className={cn(
                    "grid size-11 place-items-center rounded-xl border text-[15px] font-bold",
                    logo
                        ? "border-border bg-card shadow-soft [&>svg]:size-6"
                        : "border-[color-mix(in_srgb,var(--hue)_24%,transparent)] bg-[color-mix(in_srgb,var(--hue)_12%,var(--surface))] text-[var(--hue)] [&>svg]:size-5",
                )}
            >
                {mark}
            </div>
            <div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-[17px] font-bold tracking-[-0.01em]">
                        {href ? (
                            <a className="text-inherit" href={href}>
                                {title}
                                <Arrow className="ml-0.5 inline size-3.5 align-[-1px] text-faint" />
                            </a>
                        ) : title}
                    </h3>
                    {when && <When>{when}</When>}
                </div>
                {role && <p className="mt-0.5 text-[14.5px] text-muted-foreground">{role}</p>}
                {items.length > 0 && (
                    <ul className="rich mt-3 grid list-none gap-2.5 p-0">
                        {items.map((html, i) => (
                            <li
                                key={i}
                                className="relative pl-[18px] text-[15px] leading-[1.65] text-muted-foreground before:absolute before:top-[0.68em] before:left-0.5 before:size-1.5 before:rounded-full before:bg-[color-mix(in_srgb,var(--hue,var(--accent))_70%,transparent)]"
                                dangerouslySetInnerHTML={{ __html: html }}
                            />
                        ))}
                    </ul>
                )}
                {stack && <Stack items={stack} size="sm" className="mt-3" />}
            </div>
        </article>
    );
}

const SKILLS: { title: string; items: Tech[] }[] = [
    { title: "about.languages_frontend", items: [["java", "Java"], ["python", "Python"], ["typescript", "TypeScript"], ["react", "React"]] },
    { title: "about.backend_data", items: [["springboot", "Spring Boot"], ["spring", "Spring Cloud"], ["mysql", "MySQL"], ["redis", "Redis"], ["kafka", "Kafka"], ["rocketmq", "RocketMQ"], ["aws", "AWS"]] },
    { title: "about.machine_learning", items: [["pytorch", "PyTorch"], ["scikitlearn", "Scikit-learn"], ["huggingface", "Transformers"], ["numpy", "NumPy"], ["pandas", "Pandas"], "CNN / RNN / LSTM", "Transformer"] },
    { title: "about.llm_agents", items: ["RAG", "LoRA", "Prompt-tuning", "ReAct", "Plan-and-Execute", "MCP", "Agent Skills"] },
];

export default function Resume() {
    const { t, i18n } = useTranslation();
    const honors = t("about.honors", { returnObjects: true }) as { name: string; date: string }[];
    const certificate = i18n.exists("about.certificate") ? t("about.certificate") : "";
    const sep = <span className="mx-1.5 opacity-50">·</span>;
    const chip =
        "inline-flex h-[34px] items-center gap-[7px] rounded-full border border-border bg-card px-3.5 text-[13.5px] font-medium text-muted-foreground shadow-soft transition-[color,border-color] hover:border-border-strong hover:text-foreground hover:no-underline print:shadow-none [&>svg]:size-[15px] [&>svg]:flex-none";

    return (
        <main className="pt-14 pb-[72px] print:p-0">
            <title>{t("about.meta.title")}</title>
            <div className="wrap">
                <header className="mb-10 flex flex-wrap items-center gap-x-7 gap-y-6 border-b border-border pb-10 print:mb-5 print:pb-5">
                    <div className="min-w-0 flex-[1_1_320px]">
                        <p className="mb-4 text-[clamp(20px,2.6vw,24px)] font-semibold tracking-[-0.01em] text-foreground">
                            {t("about.software_engineer_backend_ai_agents")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <a className={chip} href="mailto:zhanghongshen716@gmail.com"><Mail />zhanghongshen716@gmail.com</a>
                            <a className={chip} href="https://github.com/zhang-hongshen"><GitHub />zhang-hongshen</a>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-14 min-[960px]:grid-cols-[minmax(0,1fr)_320px] min-[960px]:gap-16 print:grid-cols-[minmax(0,1fr)_240px] print:gap-7">
                    <div className="flex flex-col gap-12">
                        <section>
                            <SectionHead icon={Briefcase}>{t("about.work_experience")}</SectionHead>
                            <div className="grid gap-7">
                                <Entry hue="#0086d0" mark={<img src="/assets/logos/china-mobile.svg" alt="China Mobile" width={26} height={26} />} title={t("about.china_mobile")} />
                                <Entry
                                    hue="#3c8cff"
                                    mark={<Brand id="bytedance" label="ByteDance" />}
                                    title={t("about.bytedance")}
                                    role={<>{t("about.backend_engineer")}{sep}{t("about.china")}</>}
                                    bullets="about.bullets.bytedance"
                                />
                            </div>
                        </section>

                        <section>
                            <SectionHead icon={Rocket}>{t("about.internship")}</SectionHead>
                            <div className="grid gap-7">
                                <Entry
                                    hue="#ff9900"
                                    mark={<Brand id="amazon" label="Amazon" className="text-foreground" />}
                                    title={t("about.amazon")}
                                    role={<>{t("about.software_development_engineer_intern")}{sep}{t("about.china")}</>}
                                    bullets="about.bullets.amazon"
                                />
                            </div>
                        </section>

                        <section>
                            <SectionHead icon={Code}>{t("about.projects")}</SectionHead>
                            <div className="grid gap-7">
                                <Entry
                                    hue="#c8672e"
                                    mark={<ProductIcon id="modelcraft" width={34} height={34} />}
                                    title="ModelCraft"
                                    href="https://github.com/zhang-hongshen/ModelCraft"
                                    when={t("about.jan_2024_present")}
                                    bullets="about.bullets.modelcraft"
                                    stack={[["swift", "Swift"], "SwiftUI", "SwiftData", "MLX"]}
                                />
                                <Entry
                                    hue="#10b981"
                                    logo={false}
                                    mark={<Chart />}
                                    title={t("about.sentiment_analysis_for_financial_news")}
                                    when={t("about.mar_2025")}
                                    bullets="about.bullets.sentiment"
                                    stack={[["python", "Python"], ["pytorch", "PyTorch"], ["huggingface", "Transformers"]]}
                                />
                                <Entry
                                    hue="#ef4444"
                                    logo={false}
                                    mark={<News />}
                                    title={t("about.rednote_like_social_app")}
                                    href="https://github.com/zhang-hongshen/leadnews"
                                    when={t("about.dec_2024_jan_2025")}
                                    bullets="about.bullets.rednote"
                                    stack={[["springboot", "Spring Boot"], ["spring", "Spring Cloud"], "Nacos", ["mysql", "MySQL"], ["redis", "Redis"], ["kafka", "Kafka"], ["elasticsearch", "Elasticsearch"], ["minio", "MinIO"], "Freemarker"]}
                                />
                            </div>
                        </section>
                    </div>

                    <aside className="flex flex-col gap-12">
                        <section>
                            <SectionHead icon={Cap}>{t("about.education")}</SectionHead>
                            <div className="flex flex-col gap-5">
                                {[
                                    { school: "about.nanyang_technological_university", degree: "about.m_sc_in_machine_learning", when: "about.jan_2025_may_2026", where: "about.singapore" },
                                    { school: "about.southwest_jiaotong_university", degree: "about.b_eng_in_computer_science", when: "about.sep_2018_jun_2022", where: "about.china" },
                                ].map((s) => (
                                    <div key={s.school} className="break-inside-avoid">
                                        <h3 className="text-[15.5px] font-bold">{t(s.school)}</h3>
                                        <p className="mt-0.5 text-sm text-muted-foreground">{t(s.degree)}</p>
                                        <When className="mt-1">{t(s.when)}</When>
                                        <When icon={Pin} className="mt-1 ml-2.5">{t(s.where)}</When>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <SectionHead icon={Layers}>{t("about.skills")}</SectionHead>
                            <div className="flex flex-col gap-4">
                                {SKILLS.map((g) => (
                                    <div key={g.title}>
                                        <h4 className="mb-2 text-xs font-semibold tracking-[0.04em] text-faint uppercase">{t(g.title)}</h4>
                                        <Stack items={g.items} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <SectionHead icon={Award}>{t("about.honors_title")}</SectionHead>
                            <ul className="m-0 grid list-none gap-3.5 p-0">
                                {honors.map((h) => (
                                    <li key={h.name} className="grid grid-cols-[20px_minmax(0,1fr)] gap-2.5 text-sm leading-normal text-muted-foreground break-inside-avoid">
                                        <Award className="mt-px size-[18px] text-[#f59e0b]" />
                                        <div>
                                            <span>{h.name}</span>
                                            <span className="mt-0.5 block text-xs font-medium whitespace-nowrap text-faint tabular-nums">{h.date}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <SectionHead icon={Globe}>{t("about.languages_certificates")}</SectionHead>
                            <div className="grid grid-cols-3 gap-2">
                                {[["7.0", "IELTS"], ["321", "GRE"], ["527", "CET-6"]].map(([score, name]) => (
                                    <div key={name} className="rounded-[14px] border border-border bg-card px-2 py-3 text-center">
                                        <b className="block text-xl font-extrabold tracking-[-0.02em] text-foreground">{score}</b>
                                        <span className="text-xs text-faint">{name}</span>
                                    </div>
                                ))}
                            </div>
                            {certificate && (
                                <p className="mt-3 flex items-start gap-2 text-[13.5px] text-muted-foreground">
                                    <Cert className="mt-0.5 size-4 flex-none text-primary" />
                                    <span>{certificate}</span>
                                </p>
                            )}
                        </section>
                    </aside>
                </div>

                <p className="mt-14 text-center text-[13px] text-faint">{t("about.last_updated_19_sep_2026")}</p>
            </div>
        </main>
    );
}
