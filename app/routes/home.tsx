import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { ProductIcon } from "~/components/product-icon";
import { ProductRing } from "~/components/product-ring";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { PRODUCT_GROUPS } from "~/lib/products";

const TAGLINES: Record<string, { tagline: string; desc: string }> = {
    modelcraft: { tagline: "home.on_device_ai_assistant", desc: "home.a_private_ai_assistant_that" },
    arthub: { tagline: "home.media_library", desc: "home.movies_tv_shows_and_music" },
    keel: { tagline: "home.redis_client", desc: "home.a_native_redis_client_for" },
    tunestudio: { tagline: "home.vocal_pitch_correction", desc: "home.put_your_singing_on_pitch" },
    container: { tagline: "home.linux_containers", desc: "home.run_linux_containers_on_your_mac" },
    cellar: { tagline: "home.notes_and_databases", desc: "home.pages_tables_and_databases_that" },
    quaero: { tagline: "home.database_client", desc: "home.a_native_client_for_sql_and" },
    pinch: { tagline: "home.trackpad_scale", desc: "home.weigh_light_objects_on_your" },
};

export default function Home() {
    const { t } = useTranslation();
    return (
        <main className="pb-12">
            <title>{t("home.meta.title")}</title>
            <meta name="description" content={t("home.meta.description")} />

            <section className="pt-[104px] pb-14 text-center">
                <div className="wrap">
                    <h1 className="text-[clamp(36px,6vw,64px)] leading-[1.1] font-bold tracking-[-0.025em] text-balance">
                        {t("home.made_for_every_day")}
                    </h1>
                </div>
            </section>

            <section className="pb-20">
                {PRODUCT_GROUPS.map(({ category, products }) => (
                    <div key={category} className="wrap mb-14 last:mb-0">
                        <h2 className="mb-5 text-[22px] font-bold tracking-[-0.01em]">{t(`common.category.${category}`)}</h2>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-5">
                            {products.map((p) => {
                                const href = `/products/${p.id}/`;
                                return (
                                    <Card
                                        key={p.id}
                                        className="product-card relative flex flex-col gap-[18px] overflow-hidden p-8 transition-[transform,box-shadow,border-color] duration-250 hover:-translate-y-1 hover:border-border-strong hover:shadow-float"
                                        style={{ "--brand": p.brand } as React.CSSProperties}
                                    >
                                        <Link className="flex items-center gap-[18px] text-inherit hover:no-underline" to={href}>
                                            <ProductIcon id={p.id} className="-m-1 size-[88px]" width={80} height={80} />
                                            <div>
                                                <h3 className="text-2xl font-bold">{p.name}</h3>
                                                <p className="mt-1 text-[15px] text-muted-foreground">{t(TAGLINES[p.id].tagline)}</p>
                                            </div>
                                        </Link>
                                        <p className="text-muted-foreground">{t(TAGLINES[p.id].desc)}</p>
                                        <div className="mt-auto flex flex-wrap items-center gap-3">
                                            <Button asChild variant="outline">
                                                <Link to={href}>{t("home.learn_more")}</Link>
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </section>

            <section className="py-20 text-center">
                <div className="wrap">
                    <p className="mb-3 inline-flex items-center gap-2 text-[13px] font-semibold text-primary">{t("home.better_together")}</p>
                    <h2 className="mb-3.5 text-[clamp(28px,4vw,40px)] font-bold">{t("home.one_conversation_every_app")}</h2>
                    <p className="mx-auto mb-4 max-w-[640px] text-[17px] text-muted-foreground">{t("home.tell_modelcraft_what_you_need")}</p>
                    <Badge>{t("home.coming_soon")}</Badge>
                    <ProductRing hub="modelcraft" className="mt-10" />
                </div>
            </section>
        </main>
    );
}
