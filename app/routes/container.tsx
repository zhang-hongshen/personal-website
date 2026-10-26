import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ContainerDemo, type ContainerStop } from "~/components/container-demo";
import {
    ComingSoonButton, Eyebrow, Hero, Points, ProductMeta, Section, Split, Statement,
} from "~/components/sections";
import { FeatureTour, type TourStop } from "~/components/tour";
import { getProduct, type AccentHandle } from "~/lib/products";
import { cn } from "~/lib/utils";

export const handle: AccentHandle = { accent: getProduct("container").accent };

const STOPS: TourStop<ContainerStop>[] = [
    { id: "containers", title: "container.demo_containers_title", body: "container.demo_containers_body" },
    { id: "images", title: "container.demo_images_title", body: "container.demo_images_body" },
    { id: "networks", title: "container.demo_networks_title", body: "container.demo_networks_body" },
    { id: "volumes", title: "container.demo_volumes_title", body: "container.demo_volumes_body" },
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
    const [stop, setStop] = useState<ContainerStop>("containers");
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
                <FeatureTour className="mt-16" stops={STOPS} stop={stop} onStop={setStop}>
                    <ContainerDemo tour={{ stop, onStop: setStop }} />
                </FeatureTour>
            </Hero>

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
