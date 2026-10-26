import { useState } from "react";
import { useTranslation } from "react-i18next";

import { KeelDemo, type KeelStop } from "~/components/keel-demo";
import {
    ComingSoonButton, Eyebrow, Hero, Points, ProductMeta, Section, Split, Statement, Tree,
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

const TREE = `user:1001
├── profile        hash    2.1 KB
├── sessions       zset    840 B
└── cart           list    TTL 29:41
cache:feed:home    string  1.2 MB
events             stream  12,408 entries

> HGETALL user:1001:profile
1) "name"
2) "Ada"
3) "plan"
4) "pro"`;

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

            <Section className="pt-6">
                <Split>
                    <div>
                        <Eyebrow>{t("keel.connections")}</Eyebrow>
                        <h3>{t("keel.tls_acl_and_ssh_tunnels")}</h3>
                        <p>{t("keel.connect_with_a_username_pick")}</p>
                    </div>
                    <Tree>{TREE}</Tree>
                </Split>
            </Section>

            <Statement className="pb-8" eyebrow="keel.safety" title="keel.careful_by_default" />
            <Section className="pt-6">
                <Points points={POINTS} />
            </Section>
        </main>
    );
}
