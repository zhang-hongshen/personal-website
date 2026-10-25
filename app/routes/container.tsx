import { useTranslation } from "react-i18next";

import { ContainerDemo } from "~/components/container-demo";
import { Glyph } from "~/components/glyph";
import {
    ComingSoonButton, Eyebrow, FeatureGrid, Hero, Points, ProductMeta, Section, SectionLead, SectionTitle, Split, Statement,
    type Feature,
} from "~/components/sections";
import { getProduct, type AccentHandle } from "~/lib/products";
import { cn } from "~/lib/utils";

export const handle: AccentHandle = { accent: getProduct("container").accent };

const FEATURES: Feature[] = [
    { icon: <Glyph><path d="M12 15V3m0 12-5-5m5 5 5-5M5 21h14" /></Glyph>, title: "container.images", body: "container.pull_list_search_and_delete" },
    { icon: <Glyph><path d="m12 2 9 5v10l-9 5-9-5V7z" /><path d="m3 7 9 5 9-5M12 12v10" /></Glyph>, title: "container.containers", body: "container.create_start_stop_inspect" },
    { icon: <Glyph><path d="M5 12h14M13 6l6 6-6 6" /></Glyph>, title: "container.published_ports", body: "container.ports_the_image_exposes" },
    { icon: <Glyph><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Glyph>, title: "container.host_folders", body: "container.mount_folders_from_your_mac" },
    { icon: <Glyph><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M12 7v5M12 12l-6 5.5M12 12l6 5.5" /></Glyph>, title: "container.networks", body: "container.join_containers_to_networks" },
    { icon: <Glyph><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z" /></Glyph>, title: "container.isolated_by_design", body: "container.each_container_stays_apart" },
];

const SETUP = [
    { name: "container.ports", body: "container.choose_host_ports_or_leave" },
    { name: "container.folders", body: "container.pick_a_folder_read_only" },
    { name: "container.resources", body: "container.set_cpu_cores_and_memory" },
];

const CONTAINERS = [
    { name: "nginx", image: "nginx:latest", running: true },
    { name: "postgres", image: "postgres:17", running: true },
    { name: "redis", image: "redis:8", running: false },
    { name: "ubuntu", image: "ubuntu:24.04", running: false },
];

const STEPS = [
    { title: "container.pull", body: "container.type_an_image_name_like" },
    { title: "container.create", body: "container.ports_and_volumes_are_already" },
    { title: "container.run", body: "container.click_create_and_start_and" },
];

export default function Container() {
    const { t } = useTranslation();
    return (
        <main className="pb-12">
            <ProductMeta id="container" />
            <Hero
                id="container"
                tint="#339eff 18%"
                tagline={t("container.linux_containers_native_on_your_mac")}
                action={<ComingSoonButton label={t("container.coming_soon")} />}
                note={t("container.requirements")}
            >
                <ContainerDemo className="mt-16" />
                <p className="mt-5 text-center text-[13px] text-faint">{t("container.demo_hint")}</p>
            </Hero>

            <Section>
                <SectionTitle>{t("container.containers_made_simple")}</SectionTitle>
                <SectionLead>{t("container.pull_an_image_create_a")}</SectionLead>
                <FeatureGrid features={FEATURES} />
            </Section>

            <Section className="pt-6">
                <Split>
                    <div>
                        <Eyebrow>{t("container.setup")}</Eyebrow>
                        <h3>{t("container.everything_in_one_form")}</h3>
                        <ul className="list-none !pl-0 [&>li]:!my-3">
                            {SETUP.map((s) => (
                                <li key={s.name}>
                                    <strong className="text-foreground">{t(s.name)}</strong> — {t(s.body)}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-border bg-card" aria-hidden="true">
                        {CONTAINERS.map((c) => (
                            <div key={c.name} className="flex items-center gap-3 border-t border-border px-[18px] py-3.5 text-[15px] first:border-t-0">
                                <span className="flex-none font-semibold">{c.name}</span>
                                <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">{c.image}</span>
                                <span
                                    className={cn(
                                        "flex-none rounded-full px-2.5 py-[3px] text-xs font-semibold",
                                        c.running
                                            ? "bg-[color-mix(in_srgb,#1f9d55_14%,transparent)] text-[#1f9d55]"
                                            : "bg-[color-mix(in_srgb,var(--text)_8%,transparent)] text-muted-foreground",
                                    )}
                                >
                                    {t(c.running ? "container.running" : "container.stopped")}
                                </span>
                            </div>
                        ))}
                    </div>
                </Split>
            </Section>

            <Statement className="pb-8" eyebrow="container.simple_by_default" title="container.pull_create_run" />
            <Section className="pt-6">
                <Points points={STEPS} steps columns={3} />
            </Section>
        </main>
    );
}
