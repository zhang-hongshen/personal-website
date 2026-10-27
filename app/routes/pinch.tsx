import { useTranslation } from "react-i18next";

import { Glyph } from "~/components/glyph";
import { PinchDemo } from "~/components/pinch-demo";
import {
    ComingSoonButton, FeatureGrid, Hero, Points, ProductMeta, Section, SectionLead, SectionTitle, Statement,
    type Feature,
} from "~/components/sections";
import { getProduct, type AccentHandle } from "~/lib/products";

export const handle: AccentHandle = { accent: getProduct("pinch").accent };

const FEATURES: Feature[] = [
    { icon: <Glyph><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M8 9v6M12 9v6M16 9v6" /></Glyph>, title: "pinch.lcd_readout", body: "pinch.slanted_seven_segment_digits_a" },
    { icon: <Glyph><path d="M4 12h6m0 0-2.5-2.5M10 12l-2.5 2.5M20 12h-6m0 0 2.5-2.5M14 12l2.5 2.5" /></Glyph>, title: "pinch.tare", body: "pinch.zero_the_reading_with_whatever" },
    { icon: <Glyph><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Glyph>, title: "pinch.hold", body: "pinch.freeze_the_reading_and_keep" },
    { icon: <Glyph><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" /></Glyph>, title: "pinch.counting_mode", body: "pinch.weigh_ten_pieces_once_and" },
    { icon: <Glyph><path d="M6.5 9h11l2.5 12H4z" /><circle cx="12" cy="5.5" r="2.5" /></Glyph>, title: "pinch.calibration", body: "pinch.calibrate_with_one_known_weight" },
    { icon: <Glyph><path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z" /></Glyph>, title: "pinch.five_units", body: "pinch.grams_ounces_carats_troy_ounces" },
];

const STEPS = [
    { title: "pinch.rest_a_finger", body: "pinch.rest_one_finger_lightly_on" },
    { title: "pinch.tare_it", body: "pinch.press_tare_so_your_finger" },
    { title: "pinch.add_the_object", body: "pinch.place_the_object_on_your" },
    { title: "pinch.read_the_weight", body: "pinch.when_the_reading_settles_the" },
];

export default function Pinch() {
    const { t } = useTranslation();
    return (
        <main className="pb-12">
            <ProductMeta id="pinch" />
            <Hero
                id="pinch"
                tint="#ff6b4a 16%"
                tagline={t("pinch.turn_your_trackpad_into_a")}
                action={<ComingSoonButton label={t("pinch.coming_soon")} />}
                note={t("pinch.requirements")}
            >
                <PinchDemo className="mt-16" />
                <p className="mt-5 text-center text-[13px] text-faint">{t("pinch.demo_hint")}</p>
            </Hero>

            <Section>
                <SectionTitle>{t("pinch.a_real_scale_on_your")}</SectionTitle>
                <SectionLead>{t("pinch.the_force_touch_trackpad_already")}</SectionLead>
                <FeatureGrid features={FEATURES} />
            </Section>

            <Statement eyebrow="pinch.counting_mode" title="pinch.count_instead_of_weigh" body="pinch.press_tare_add_ten_identical" />

            <Statement className="pb-8" eyebrow="pinch.how_it_works" title="pinch.four_steps_to_a_reading" />
            <Section className="pt-6">
                <Points points={STEPS} steps />
            </Section>
        </main>
    );
}
