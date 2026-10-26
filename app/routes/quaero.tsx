import { useState } from "react";
import { useTranslation } from "react-i18next";

import { QuaeroDemo, type QuaeroStop } from "~/components/quaero-demo";
import {
    ComingSoonButton, Eyebrow, Hero, Points, ProductMeta, Section, Split, Statement, Tree,
} from "~/components/sections";
import { FeatureTour, type TourStop } from "~/components/tour";
import { getProduct, type AccentHandle } from "~/lib/products";

export const handle: AccentHandle = { accent: getProduct("quaero").accent };

const STOPS: TourStop<QuaeroStop>[] = [
    { id: "sql", title: "quaero.demo_sql_title", body: "quaero.demo_sql_body" },
    { id: "console", title: "quaero.sql_next_to_your_rows", body: "quaero.demo_console_body" },
    { id: "vector", title: "quaero.demo_vector_title", body: "quaero.demo_vector_body" },
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
    const [stop, setStop] = useState<QuaeroStop>("sql");
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
                <FeatureTour className="mt-16" stops={STOPS} stop={stop} onStop={setStop}>
                    <QuaeroDemo tour={{ stop, onStop: setStop }} />
                </FeatureTour>
            </Hero>

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
