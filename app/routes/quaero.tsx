import { useState } from "react";
import { useTranslation } from "react-i18next";

import { QuaeroDemo, type QuaeroStop } from "~/components/quaero-demo";
import {
    ComingSoonButton, Hero, Points, ProductMeta, Section, Statement,
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

            <Statement className="pb-8" eyebrow="quaero.security" title="quaero.careful_with_your_credentials" />
            <Section className="pt-6">
                <Points points={POINTS} />
            </Section>
        </main>
    );
}
