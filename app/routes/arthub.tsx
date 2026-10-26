import { useTranslation } from "react-i18next";

import { ArthubDemo } from "~/components/arthub-demo";
import { Glyph } from "~/components/glyph";
import {
    DownloadButton, Eyebrow, FeatureGrid, Hero, Points, ProductMeta, Section, SectionLead, SectionTitle, Split, Statement, Tree,
    type Feature,
} from "~/components/sections";
import { getProduct, type AccentHandle } from "~/lib/products";

export const handle: AccentHandle = { accent: getProduct("arthub").accent };

const FEATURES: Feature[] = [
    { icon: <Glyph><rect x="2" y="2" width="20" height="20" rx="2.18" /><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" /></Glyph>, title: "arthub.movies", body: "arthub.posters_cast_ratings_and_trailers" },
    { icon: <Glyph><rect x="2" y="7" width="20" height="15" rx="2" /><path d="m17 2-5 5-5-5" /></Glyph>, title: "arthub.tv_shows", body: "arthub.organized_by_season_and_episode" },
    { icon: <Glyph><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></Glyph>, title: "arthub.music", body: "arthub.albums_artists_and_artwork_with" },
    { icon: <Glyph><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M7 15h4M15 15h2M7 11h2M13 11h4" /></Glyph>, title: "arthub.subtitles", body: "arthub.loaded_automatically_with_the_language" },
    { icon: <Glyph><circle cx="12" cy="12" r="10" /><path d="m10 8 6 4-6 4z" /></Glyph>, title: "arthub.playback", body: "arthub.playback_speed_resume_media_keys" },
    { icon: <Glyph><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Glyph>, title: "arthub.search", body: "arthub.instant_search_across_titles_artists" },
];

const POINTS = [
    { title: "arthub.automatic", body: "arthub.new_and_changed_files_are" },
    { title: "arthub.offline_friendly", body: "arthub.disconnect_a_drive_and_its" },
    { title: "arthub.move_freely", body: "arthub.moves_and_renames_on_the" },
    { title: "arthub.non_destructive", body: "arthub.removing_a_folder_never_touches" },
];

const TREE = `TV Shows/
└── Doctor Who (2005)/
    ├── Season 01/
    │   ├── Doctor Who S01E01.mkv
    │   ├── Doctor Who S01E01.en.srt
    │   └── Doctor Who S01E02-E03.mkv
    └── Specials/
        └── Doctor Who S00E01.mkv

Music/
└── Adele/
    └── 25 (2015)/
        ├── cover.jpg
        ├── 01 Hello.flac
        └── 01 Hello.lrc`;

export default function Arthub() {
    const { t } = useTranslation();
    return (
        <main className="pb-12">
            <ProductMeta id="arthub" />
            <Hero
                id="arthub"
                tint="#e5484d 18%"
                tagline={t("arthub.movies_shows_and_music_beautifully")}
                action={<DownloadButton repo="zhang-hongshen/Arthub" />}
                note={t("arthub.apple_silicon_m1_or_later")}
            >
                <ArthubDemo className="mt-16" />
                <p className="mt-5 text-center text-[13px] text-faint">{t("arthub.demo_hint")}</p>
            </Hero>

            <Section>
                <SectionTitle>{t("arthub.add_a_folder_arthub_does")}</SectionTitle>
                <SectionLead>{t("arthub.files_stay_where_they_are")}</SectionLead>
                <FeatureGrid features={FEATURES} />
            </Section>

            <Section className="pt-6">
                <Split>
                    <div>
                        <Eyebrow>{t("arthub.recognition")}</Eyebrow>
                        <h3>{t("arthub.understands_real_world_file_names")}</h3>
                        <p>{t("arthub.resolution_and_source_tags_are")}</p>
                    </div>
                    <Tree>{TREE}</Tree>
                </Split>
            </Section>

            <Statement className="pb-8" eyebrow="arthub.library" title="arthub.always_in_sync" />
            <Section className="pt-6">
                <Points points={POINTS} />
            </Section>
        </main>
    );
}
