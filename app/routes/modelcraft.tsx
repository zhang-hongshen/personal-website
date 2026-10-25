import { useTranslation } from "react-i18next";

import { Glyph } from "~/components/glyph";
import { ModelCraftDemo } from "~/components/modelcraft-demo";
import {
    DownloadButton, Eyebrow, FeatureGrid, Hero, ProductMeta, Section, SectionLead, SectionTitle, Shot, Split, Statement,
    type Feature,
} from "~/components/sections";
import { getProduct, type AccentHandle } from "~/lib/products";
import modelStoreLight from "~/assets/modelcraft/model_store_light.webp";
import modelStoreDark from "~/assets/modelcraft/model_store_dark.webp";
import connectorsLight from "~/assets/modelcraft/connectors_light.webp";
import connectorsDark from "~/assets/modelcraft/connectors_dark.webp";
import scheduledTasksLight from "~/assets/modelcraft/scheduled_tasks_light.webp";
import scheduledTasksDark from "~/assets/modelcraft/scheduled_tasks_dark.webp";

export const handle: AccentHandle = { accent: getProduct("modelcraft").accent };

const FEATURES: Feature[] = [
    { icon: <Glyph><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Glyph>, title: "modelcraft.on_device_models", body: "modelcraft.download_a_model_and_start" },
    { icon: <Glyph><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.940-7.94l-3.76 3.76z" /></Glyph>, title: "modelcraft.gets_things_done", body: "modelcraft.organizes_files_looks_things_up" },
    { icon: <Glyph><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" /></Glyph>, title: "modelcraft.images_video_music", body: "modelcraft.generated_on_device_right_in" },
    { icon: <Glyph><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></Glyph>, title: "modelcraft.projects", body: "modelcraft.conversations_and_files_kept_together" },
    { icon: <Glyph><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" /></Glyph>, title: "modelcraft.multimodal_voice", body: "modelcraft.text_images_documents_and_audio" },
    { icon: <Glyph><path d="M3 3v18h18" /><path d="M7 16v-3M12 16V8M17 16v-6" /></Glyph>, title: "modelcraft.long_conversations", body: "modelcraft.long_conversations_stay_fast_with" },
];

export default function ModelCraft() {
    const { t } = useTranslation();
    return (
        <main className="pb-12">
            <ProductMeta id="modelcraft" />
            <Hero
                id="modelcraft"
                tint="#e8955a 20%"
                tagline={t("modelcraft.ai_that_runs_entirely_on")}
                action={<DownloadButton repo="zhang-hongshen/ModelCraft" />}
                note={t("modelcraft.apple_silicon_m1_or_later")}
            >
                <ModelCraftDemo className="mt-16" />
            </Hero>

            <Section>
                <SectionTitle>{t("modelcraft.capable_and_completely_private")}</SectionTitle>
                <SectionLead>{t("modelcraft.models_run_on_device_no")}</SectionLead>
                <FeatureGrid features={FEATURES} />
            </Section>

            <Section className="pt-6">
                <Split reverse>
                    <div>
                        <Eyebrow>{t("modelcraft.model_store")}</Eyebrow>
                        <h3>{t("modelcraft.pick_a_model_download_in")}</h3>
                        <p>{t("modelcraft.browse_popular_open_models_downloads")}</p>
                    </div>
                    <Shot light={modelStoreLight} dark={modelStoreDark} alt="ModelCraft Model Store" width={2400} height={1374} />
                </Split>
            </Section>

            <Section className="pt-0">
                <Split>
                    <div>
                        <Eyebrow>{t("modelcraft.integrations")}</Eyebrow>
                        <h3>{t("modelcraft.works_your_other_apps_for")}</h3>
                        <p>{t("modelcraft.modelcraft_connects_to_arthub_and")}</p>
                        <ul>
                            <li>{t("modelcraft.example_arthub")}</li>
                            <li>{t("modelcraft.example_keel")}</li>
                            <li>{t("modelcraft.example_tunestudio")}</li>
                            <li>{t("modelcraft.example_cellar")}</li>
                        </ul>
                    </div>
                    <Shot light={connectorsLight} dark={connectorsDark} alt="ModelCraft Connectors" width={2400} height={1374} />
                </Split>
            </Section>

            <Section className="pt-0">
                <Split reverse>
                    <div>
                        <Eyebrow>{t("modelcraft.scheduled_tasks")}</Eyebrow>
                        <h3>{t("modelcraft.runs_on_its_own_schedule")}</h3>
                        <p>{t("modelcraft.give_it_a_prompt_and_a_time")}</p>
                    </div>
                    <Shot light={scheduledTasksLight} dark={scheduledTasksDark} alt="ModelCraft Scheduled Tasks" width={2400} height={1374} />
                </Split>
            </Section>

            <Statement eyebrow="modelcraft.privacy" title="modelcraft.data_stays_on_the_device" body="modelcraft.conversations_are_processed_on_device" />
        </main>
    );
}
