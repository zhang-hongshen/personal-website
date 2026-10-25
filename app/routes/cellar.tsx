import { useTranslation } from "react-i18next";

import { CellarDemo } from "~/components/cellar-demo";
import { Glyph } from "~/components/glyph";
import {
    ComingSoonButton, Eyebrow, FeatureGrid, Hero, Points, ProductMeta, Section, SectionLead, SectionTitle, Split, Statement, Tree,
    type Feature,
} from "~/components/sections";
import { getProduct, type AccentHandle } from "~/lib/products";

export const handle: AccentHandle = { accent: getProduct("cellar").accent };

const FEATURES: Feature[] = [
    { icon: <Glyph><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></Glyph>, title: "cellar.pages_and_blocks", body: "cellar.headings_lists_to_dos_code" },
    { icon: <Glyph><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></Glyph>, title: "cellar.databases", body: "cellar.custom_properties_relations_rollups_and" },
    { icon: <Glyph><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></Glyph>, title: "cellar.saved_views", body: "cellar.table_board_and_list_views" },
    { icon: <Glyph><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Glyph>, title: "cellar.quick_search", body: "cellar.k_finds_any_page_or" },
    { icon: <Glyph><path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14" /></Glyph>, title: "cellar.import", body: "cellar.bring_in_markdown_obsidian_vaults" },
    { icon: <Glyph><path d="M12 21V9m0 0-5 5m5-5 5 5M5 3h14" /></Glyph>, title: "cellar.export", body: "cellar.pages_to_markdown_html_or" },
];

const POINTS = [
    { title: "cellar.stored_locally", body: "cellar.every_page_and_row_is" },
    { title: "cellar.no_network", body: "cellar.cellar_never_connects_to_the" },
    { title: "cellar.undo_everything", body: "cellar.edits_deletes_and_whole_imports" },
    { title: "cellar.yours_to_take", body: "cellar.export_to_open_formats_whenever" },
];

const TREE = `Reading list          database   42 rows
├── Table             by Status
├── Board             grouped by Genre
└── List              finished this year
Projects              page
├── Roadmap           mind map
├── Architecture      mermaid
└── Tasks             database   18 rows
    └── Author        relation → People`;

export default function Cellar() {
    const { t } = useTranslation();
    return (
        <main className="pb-12">
            <ProductMeta id="cellar" />
            <Hero
                id="cellar"
                tint="#ee9a3a 18%"
                tagline={t("cellar.notes_and_databases_that_stay")}
                action={<ComingSoonButton label={t("cellar.coming_soon")} />}
                note={t("cellar.requirements")}
            >
                <CellarDemo className="mt-16" />
            </Hero>

            <Section>
                <SectionTitle>{t("cellar.everything_is_a_block")}</SectionTitle>
                <SectionLead>{t("cellar.write_notes_build_databases_and")}</SectionLead>
                <FeatureGrid features={FEATURES} />
            </Section>

            <Section className="pt-6">
                <Split>
                    <div>
                        <Eyebrow>{t("cellar.databases")}</Eyebrow>
                        <h3>{t("cellar.structure_when_you_need_it")}</h3>
                        <p>{t("cellar.turn_any_page_into_a")}</p>
                    </div>
                    <Tree>{TREE}</Tree>
                </Split>
            </Section>

            <Statement className="pb-8" eyebrow="cellar.privacy" title="cellar.local_first_by_design" />
            <Section className="pt-6">
                <Points points={POINTS} />
            </Section>
        </main>
    );
}
