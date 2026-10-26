import { useTranslation } from "react-i18next";

import { Glyph } from "~/components/glyph";
import { TuneStudioDemo } from "~/components/tunestudio-demo";
import {
    ComingSoonButton, Eyebrow, FeatureGrid, Hero, Points, ProductMeta, Section, SectionLead, SectionTitle, Split, Statement,
    type Feature,
} from "~/components/sections";
import { getProduct, type AccentHandle } from "~/lib/products";

export const handle: AccentHandle = { accent: getProduct("tunestudio").accent };

const FEATURES: Feature[] = [
    { icon: <Glyph><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" /></Glyph>, title: "tunestudio.open_any_recording", body: "tunestudio.wav_mp3_and_m4a" },
    { icon: <Glyph><path d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0" /></Glyph>, title: "tunestudio.see_your_singing", body: "tunestudio.a_pitch_curve_over_a" },
    { icon: <Glyph><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" /></Glyph>, title: "tunestudio.auto_tune_in_one_click", body: "tunestudio.natural_balanced_or_robotic" },
    { icon: <Glyph><path d="M12 2v20M5 9l7-7 7 7M5 15l7 7 7-7" /></Glyph>, title: "tunestudio.fine_tune_by_hand", body: "tunestudio.drag_notes_up_or_down" },
    { icon: <Glyph><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-15-6.7L3 13" /></Glyph>, title: "tunestudio.non_destructive", body: "tunestudio.your_original_file_is_never" },
    { icon: <Glyph><path d="M12 15V3m0 12-5-5m5 5 5-5M5 21h14" /></Glyph>, title: "tunestudio.export", body: "tunestudio.wav_for_best_quality_or" },
];

const STYLES = [
    { name: "tunestudio.natural", body: "tunestudio.gently_nudges_notes_toward_pitch" },
    { name: "tunestudio.balanced", body: "tunestudio.puts_every_held_note_on" },
    { name: "tunestudio.robotic", body: "tunestudio.snaps_notes_flat_onto_pitch" },
];

const STEPS = [
    { title: "tunestudio.open", body: "tunestudio.choose_a_recording_of_a" },
    { title: "tunestudio.tune", body: "tunestudio.click_auto_tune_in_the" },
    { title: "tunestudio.listen", body: "tunestudio.press_space_to_play_not" },
    { title: "tunestudio.export", body: "tunestudio.save_the_result_as_a" },
];

// A sung line (dashed) and the tuned result snapped onto the notes, over a piano roll.
function PianoRoll() {
    return (
        <div className="roll overflow-hidden rounded-2xl border border-border bg-card" aria-hidden="true">
            <svg className="block h-auto w-full" viewBox="0 0 600 300">
                <rect className="row" x="0" y="30" width="600" height="30" />
                <rect className="row" x="0" y="90" width="600" height="30" />
                <rect className="row" x="0" y="180" width="600" height="30" />
                <rect className="row" x="0" y="240" width="600" height="30" />
                <line className="grid-line" x1="150" y1="0" x2="150" y2="300" />
                <line className="grid-line" x1="300" y1="0" x2="300" y2="300" />
                <line className="grid-line" x1="450" y1="0" x2="450" y2="300" />
                <rect className="note" x="40" y="150" width="120" height="30" rx="6" />
                <rect className="note edited" x="180" y="90" width="150" height="30" rx="6" />
                <rect className="note" x="350" y="120" width="90" height="30" rx="6" />
                <rect className="note" x="460" y="180" width="110" height="30" rx="6" />
                <path className="raw" d="M40 172 C70 158 100 176 130 160 S150 150 165 140 C185 110 210 112 240 118 S300 100 330 112 C345 128 365 140 390 132 S430 140 445 150 C460 175 490 186 520 200 S560 190 570 196" />
                <path className="tuned" d="M40 165 C70 164 100 166 160 165 C170 150 175 110 185 105 L330 105 C340 120 345 135 355 135 L440 135 C450 150 455 190 465 195 L570 195" />
                <line className="playhead" x1="250" y1="0" x2="250" y2="300" />
            </svg>
        </div>
    );
}

export default function TuneStudio() {
    const { t } = useTranslation();
    return (
        <main className="pb-12">
            <ProductMeta id="tunestudio" />
            <Hero
                id="tunestudio"
                tint="#6a5cf0 18%"
                tagline={t("tunestudio.put_your_singing_on_pitch")}
                action={<ComingSoonButton label={t("tunestudio.coming_soon")} />}
                note={t("tunestudio.requirements")}
            >
                <TuneStudioDemo className="mt-16" />
                <p className="mt-5 text-center text-[13px] text-faint">{t("tunestudio.demo_hint")}</p>
            </Hero>

            <Section>
                <SectionTitle>{t("tunestudio.one_click_or_every_note")}</SectionTitle>
                <SectionLead>{t("tunestudio.made_for_beginners_with_room")}</SectionLead>
                <FeatureGrid features={FEATURES} />
            </Section>

            <Section className="pt-6">
                <Split>
                    <div>
                        <Eyebrow>{t("tunestudio.auto_tune")}</Eyebrow>
                        <h3>{t("tunestudio.three_styles_one_click")}</h3>
                        <ul className="list-none !pl-0 [&>li]:!my-3">
                            {STYLES.map((s) => (
                                <li key={s.name}>
                                    <strong className="text-foreground">{t(s.name)}</strong> — {t(s.body)}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <PianoRoll />
                </Split>
            </Section>

            <Statement className="pb-8" eyebrow="tunestudio.simple_by_default" title="tunestudio.open_tune_listen_export" />
            <Section className="pt-6">
                <Points points={STEPS} steps />
            </Section>
        </main>
    );
}
