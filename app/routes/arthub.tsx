import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ArthubDemo, type ArthubStop } from "~/components/arthub-demo";
import {
    DownloadButton, Eyebrow, Hero, Points, ProductMeta, Section, Split, Statement, Tree,
} from "~/components/sections";
import { FeatureTour, type TourStop } from "~/components/tour";
import { getProduct, type AccentHandle } from "~/lib/products";

export const handle: AccentHandle = { accent: getProduct("arthub").accent };

const STOPS: TourStop<ArthubStop>[] = [
    { id: "movies", title: "arthub.demo_movies_title", body: "arthub.demo_movies_body" },
    { id: "shows", title: "arthub.demo_shows_title", body: "arthub.demo_shows_body" },
    { id: "music", title: "arthub.demo_music_title", body: "arthub.demo_music_body" },
    { id: "library", title: "arthub.add_a_folder_arthub_does", body: "arthub.demo_library_body" },
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
    const [stop, setStop] = useState<ArthubStop>("movies");
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
                <FeatureTour className="mt-16" stops={STOPS} stop={stop} onStop={setStop}>
                    <ArthubDemo tour={{ stop, onStop: setStop }} />
                </FeatureTour>
            </Hero>

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
