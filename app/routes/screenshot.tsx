import { useTranslation } from "react-i18next";

import { Glyph } from "~/components/glyph";
import { ScreenshotDemo } from "~/components/screenshot-demo";
import {
    DownloadButton, Eyebrow, FeatureGrid, Hero, Points, ProductMeta, Section, SectionLead, SectionTitle, Split, Statement, Tree,
    type Feature,
} from "~/components/sections";
import { getProduct, type AccentHandle } from "~/lib/products";

export const handle: AccentHandle = { accent: getProduct("screenshot").accent };

const FEATURES: Feature[] = [
    { icon: <Glyph><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><circle cx="12" cy="12" r="2.5" /></Glyph>, title: "screenshot.capture", body: "screenshot.click_a_window_or_drag" },
    { icon: <Glyph><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Glyph>, title: "screenshot.markup_in_place", body: "screenshot.the_overlay_turns_into_an" },
    { icon: <Glyph><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M12 7v10m0 0-3-3m3 3 3-3" /></Glyph>, title: "screenshot.scrolling_capture", body: "screenshot.scroll_the_way_you_always" },
    { icon: <Glyph><rect x="3" y="3" width="18" height="18" rx="2" /><rect x="12" y="12" width="7" height="7" rx="1" /></Glyph>, title: "screenshot.preview_and_edit", body: "screenshot.a_thumbnail_floats_in_the" },
    { icon: <Glyph><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="18" height="8" rx="1" /></Glyph>, title: "screenshot.combine", body: "screenshot.drag_several_screenshots_together_edges" },
    { icon: <Glyph><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Glyph>, title: "screenshot.memory_only", body: "screenshot.no_history_no_cloud_sync" },
];

const POINTS = [
    { title: "screenshot.any_direction", body: "screenshot.vertical_or_horizontal_one_scroll" },
    { title: "screenshot.any_input", body: "screenshot.scroll_wheel_trackpad_dragging_the" },
    { title: "screenshot.auto_scroll", body: "screenshot.on_a_window_auto_scrolls" },
    { title: "screenshot.never_moves_the_pointer", body: "screenshot.you_stay_in_control_frames" },
];

const TREE = `Mail window, scrolling capture
├── Toolbar             kept on top
├── Sidebar             312 → 1,840 pt
├── Message list        640 → 6,120 pt
├── Message             640 → 2,410 pt
└── Status bar          kept at the bottom

Result                  1 picture, 2,240 × 12,480 px`;

export default function Screenshot() {
    const { t } = useTranslation();
    return (
        <main className="pb-12">
            <ProductMeta id="screenshot" />
            <Hero
                id="screenshot"
                tint="#4a5cf0 18%"
                tagline={t("screenshot.screenshots_that_keep_scrolling")}
                action={<DownloadButton repo="zhang-hongshen/Screenshot" />}
                note={t("screenshot.requirements")}
            >
                <ScreenshotDemo className="mt-16" />
                <p className="mt-5 text-center text-[13px] text-faint">{t("screenshot.demo_hint")}</p>
            </Hero>

            <Section>
                <SectionTitle>{t("screenshot.everything_from_the_menu_bar")}</SectionTitle>
                <SectionLead>{t("screenshot.screenshot_lives_in_the_menu")}</SectionLead>
                <FeatureGrid features={FEATURES} />
            </Section>

            <Section className="pt-6">
                <Split>
                    <div>
                        <Eyebrow>{t("screenshot.scrolling_capture")}</Eyebrow>
                        <h3>{t("screenshot.like_an_endless_screen")}</h3>
                        <p>{t("screenshot.the_result_looks_like_the")}</p>
                    </div>
                    <Tree>{TREE}</Tree>
                </Split>
            </Section>

            <Statement className="pb-8" eyebrow="screenshot.scrolling" title="screenshot.scroll_however_you_like" />
            <Section className="pt-6">
                <Points points={POINTS} />
            </Section>
        </main>
    );
}
