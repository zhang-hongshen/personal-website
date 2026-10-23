import { useTranslation } from "react-i18next";

import { Glyph } from "~/components/glyph";
import {
    ComingSoonButton, Eyebrow, FeatureGrid, Hero, Points, ProductMeta, Section, SectionLead, SectionTitle, Split, Statement, Tree,
    type Feature,
} from "~/components/sections";
import { getProduct, type AccentHandle } from "~/lib/products";

export const handle: AccentHandle = { accent: getProduct("quaero").accent };

const FEATURES: Feature[] = [
    { icon: <Glyph><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></Glyph>, title: "quaero.connections", body: "quaero.save_connections_to_mysql_postgresql" },
    { icon: <Glyph><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></Glyph>, title: "quaero.schema_browser", body: "quaero.databases_tables_and_views_with" },
    { icon: <Glyph><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></Glyph>, title: "quaero.table_content", body: "quaero.browse_rows_and_edit_cells" },
    { icon: <Glyph><path d="M22 3H2l8 9.5V19l4 2v-8.5z" /></Glyph>, title: "quaero.filters", body: "quaero.combine_conditions_with_match_all" },
    { icon: <Glyph><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></Glyph>, title: "quaero.sql_console", body: "quaero.run_several_statements_at_once" },
    { icon: <Glyph><path d="M12 21V9m0 0-5 5m5-5 5 5M5 3h14" /></Glyph>, title: "quaero.export", body: "quaero.save_rows_as_csv_or" },
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

export default function Quaero() {
    const { t } = useTranslation();
    return (
        <main className="pb-12">
            <ProductMeta id="quaero" />
            <Hero
                id="quaero"
                tint="#5b62d6 18%"
                tagline={t("quaero.a_native_sql_client")}
                action={<ComingSoonButton label={t("quaero.coming_soon")} />}
                note={t("quaero.requirements")}
            />

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

            <Statement className="pb-8" eyebrow="quaero.security" title="quaero.careful_with_your_credentials" />
            <Section className="pt-6">
                <Points points={POINTS} />
            </Section>
        </main>
    );
}
