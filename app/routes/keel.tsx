import { useTranslation } from "react-i18next";

import { Glyph } from "~/components/glyph";
import { KeelDemo } from "~/components/keel-demo";
import {
    ComingSoonButton, Eyebrow, FeatureGrid, Hero, Points, ProductMeta, Section, SectionLead, SectionTitle, Split, Statement, Tree,
    type Feature,
} from "~/components/sections";
import { getProduct, type AccentHandle } from "~/lib/products";

export const handle: AccentHandle = { accent: getProduct("keel").accent };

const FEATURES: Feature[] = [
    { icon: <Glyph><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" /></Glyph>, title: "keel.key_browser", body: "keel.built_on_scan_never_keys" },
    { icon: <Glyph><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></Glyph>, title: "keel.value_editor", body: "keel.strings_hashes_lists_sets_and" },
    { icon: <Glyph><path d="M3 6h18M3 12h12M3 18h6" /></Glyph>, title: "keel.streams", body: "keel.page_through_add_trim_entries" },
    { icon: <Glyph><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></Glyph>, title: "keel.command_console", body: "keel.its_own_connection_blocking_commands" },
    { icon: <Glyph><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></Glyph>, title: "keel.memory_analysis", body: "keel.see_memory_by_type_expiry" },
    { icon: <Glyph><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></Glyph>, title: "keel.server_info", body: "keel.memory_clients_hit_rate_and" },
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
                <KeelDemo className="mt-16" />
                <p className="mt-5 text-center text-[13px] text-faint">{t("keel.demo_hint")}</p>
            </Hero>

            <Section>
                <SectionTitle>{t("keel.everything_redis_in_one_place")}</SectionTitle>
                <SectionLead>{t("keel.works_with_redis_and_every")}</SectionLead>
                <FeatureGrid features={FEATURES} />
            </Section>

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
