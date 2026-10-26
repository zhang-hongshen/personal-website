import { useTranslation } from "react-i18next";

import { Glyph } from "~/components/glyph";
import { QuaeroDemo } from "~/components/quaero-demo";
import {
    ComingSoonButton, Eyebrow, FeatureGrid, Hero, Points, ProductMeta, Section, SectionLead, SectionTitle, Split, Statement, Tree,
    type Feature,
} from "~/components/sections";
import { getProduct, type AccentHandle } from "~/lib/products";

export const handle: AccentHandle = { accent: getProduct("quaero").accent };

const FEATURES: Feature[] = [
    { icon: <Glyph><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></Glyph>, title: "quaero.connections", body: "quaero.save_connections_to_sql_and" },
    { icon: <Glyph><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></Glyph>, title: "quaero.schema_browser", body: "quaero.databases_tables_views_and_collections" },
    { icon: <Glyph><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></Glyph>, title: "quaero.table_content", body: "quaero.browse_rows_and_edit_cells" },
    { icon: <Glyph><path d="M22 3H2l8 9.5V19l4 2v-8.5z" /></Glyph>, title: "quaero.filters", body: "quaero.combine_conditions_with_match_all" },
    { icon: <Glyph><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></Glyph>, title: "quaero.console", body: "quaero.run_sql_or_send_rest_requests" },
    { icon: <Glyph><path d="M12 21V9m0 0-5 5m5-5 5 5M5 3h14" /></Glyph>, title: "quaero.export", body: "quaero.save_rows_as_csv_or" },
    { icon: <Glyph><circle cx="5" cy="6" r="1.5" /><circle cx="12" cy="6" r="1.5" /><circle cx="19" cy="6" r="1.5" /><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /><circle cx="5" cy="18" r="1.5" /><circle cx="12" cy="18" r="1.5" /><circle cx="19" cy="18" r="1.5" /></Glyph>, title: "quaero.vector_databases", body: "quaero.browse_qdrant_and_milvus_collections" },
    { icon: <Glyph><rect x="2" y="9" width="20" height="6" rx="1" /><path d="M6 9v6M10 9v6M14 9v6M18 9v6" /></Glyph>, title: "quaero.vectors_you_can_read", body: "quaero.embeddings_show_as_a_color" },
    { icon: <Glyph><circle cx="12" cy="12" r="2" /><circle cx="12" cy="12" r="6" strokeDasharray="2 2.5" /><circle cx="12" cy="12" r="10" strokeDasharray="2 3" /></Glyph>, title: "quaero.find_similar_rows", body: "quaero.right_click_a_vector_to" },
];

const POINTS = [
    { title: "quaero.passwords_in_keychain", body: "quaero.passwords_are_kept_in_the" },
    { title: "quaero.tls_when_you_want_it", body: "quaero.require_encryption_or_verify_the" },
    { title: "quaero.no_dependencies", body: "quaero.the_mysql_and_postgresql_protocols" },
    { title: "quaero.null_is_null", body: "quaero.sql_null_shows_as_a" },
];

const TREE = `shop (PostgreSQL)
├── public.customers     table   12,480 rows
├── public.orders        table   98,211 rows
└── public.order_totals  view

> SELECT status, count(*) FROM orders GROUP BY 1;
status     count
paid       91,532
refunded    4,107
pending     2,572
3 rows · 18 ms`;

const VECTOR_TREE = `articles (Qdrant)
├── id        uuid
├── vector    vector(384, Cosine)
└── title     keyword   indexed

> POST /collections/articles/points/query
  {"query": [0.12, -0.08, …], "limit": 3}
id         score   title
a91f2c0e   0.962   Shooting film at night
c4e8a9f2   0.941   Night street photography
b07d33a1   0.903   Pushing Portra 400 two stops
3 points · 9 ms`;

export default function Quaero() {
    const { t } = useTranslation();
    return (
        <main className="pb-12">
            <ProductMeta id="quaero" />
            <Hero
                id="quaero"
                tint="#5b62d6 18%"
                tagline={t("quaero.a_native_client_for_sql_and")}
                action={<ComingSoonButton label={t("quaero.coming_soon")} />}
                note={t("quaero.requirements")}
            >
                <QuaeroDemo className="mt-16" />
                <p className="mt-5 text-center text-[13px] text-faint">{t("quaero.demo_hint")}</p>
            </Hero>

            <Section>
                <SectionTitle>{t("quaero.your_databases_at_a_glance")}</SectionTitle>
                <SectionLead>{t("quaero.connect_browse_query_and_export")}</SectionLead>
                <FeatureGrid features={FEATURES} />
            </Section>

            <Section className="pt-6">
                <Split>
                    <div>
                        <Eyebrow>{t("quaero.sql_console")}</Eyebrow>
                        <h3>{t("quaero.sql_next_to_your_rows")}</h3>
                        <p>{t("quaero.the_console_opens_beside_the")}</p>
                    </div>
                    <Tree>{TREE}</Tree>
                </Split>
            </Section>

            <Section className="pt-0">
                <Split reverse>
                    <div>
                        <Eyebrow>{t("quaero.vector_databases")}</Eyebrow>
                        <h3>{t("quaero.meaning_not_just_matches")}</h3>
                        <p>{t("quaero.connect_to_qdrant_or_milvus")}</p>
                    </div>
                    <Tree>{VECTOR_TREE}</Tree>
                </Split>
            </Section>

            <Statement className="pb-8" eyebrow="quaero.security" title="quaero.careful_with_your_credentials" />
            <Section className="pt-6">
                <Points points={POINTS} />
            </Section>
        </main>
    );
}
