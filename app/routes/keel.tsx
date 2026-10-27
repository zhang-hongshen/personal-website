import { useState } from "react";
import { useTranslation } from "react-i18next";

import { KeelDemo, type KeelStop } from "~/components/keel-demo";
import {
    ComingSoonButton, Hero, Points, ProductMeta, Section, Statement,
} from "~/components/sections";
import { FeatureTour, type TourStop } from "~/components/tour";
import { getProduct, type AccentHandle } from "~/lib/products";

export const handle: AccentHandle = { accent: getProduct("keel").accent };

const STOPS: TourStop<KeelStop>[] = [
    { id: "browse", title: "keel.demo_browse_title", body: "keel.demo_browse_body" },
    { id: "insights", title: "keel.demo_insights_title", body: "keel.demo_insights_body" },
    { id: "console", title: "keel.demo_console_title", body: "keel.demo_console_body" },
];

const POINTS = [
    { title: "keel.confirm_first", body: "keel.deletes_flushdb_and_other_dangerous" },
    { title: "keel.preview_then_delete", body: "keel.delete_by_pattern_shows_the" },
    { title: "keel.transactional_edits", body: "keel.changes_to_a_value_are" },
    { title: "keel.large_values_handled", body: "keel.strings_over_1_mb_load" },
];

export default function Keel() {
    const { t } = useTranslation();
    const [stop, setStop] = useState<KeelStop>("browse");
    return (
        <main className="pb-12">
            <ProductMeta id="keel" />
            <Hero
                id="keel"
                tint="#d6293e 18%"
                tagline={t("keel.a_native_redis_client")}
                action={<ComingSoonButton label={t("keel.coming_soon")} />}
                note={t("keel.requirements")}
            >
                <FeatureTour className="mt-16" stops={STOPS} stop={stop} onStop={setStop}>
                    <KeelDemo tour={{ stop, onStop: setStop }} />
                </FeatureTour>
            </Hero>

            <Statement eyebrow="keel.connections" title="keel.tls_acl_and_ssh_tunnels" body="keel.connect_with_a_username_pick" />

            <Statement className="pb-8" eyebrow="keel.safety" title="keel.careful_by_default" />
            <Section className="pt-6">
                <Points points={POINTS} />
            </Section>
        </main>
    );
}
