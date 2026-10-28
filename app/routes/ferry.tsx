import { useTranslation } from "react-i18next";

import { FerryDemo } from "~/components/ferry-demo";
import { FerryModel } from "~/components/ferry-model";
import { Glyph } from "~/components/glyph";
import {
    ComingSoonButton, FeatureGrid, Hero, Points, ProductMeta, Section, SectionLead, SectionTitle, Statement,
    type Feature,
} from "~/components/sections";
import { getProduct, type AccentHandle } from "~/lib/products";

export const handle: AccentHandle = { accent: getProduct("ferry").accent };

const FEATURES: Feature[] = [
    { icon: <Glyph><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 9v11" /></Glyph>, title: "ferry.browse_like_finder", body: "ferry.tabs_list_icon_and_column" },
    { icon: <Glyph><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" /></Glyph>, title: "ferry.resumable_transfers", body: "ferry.a_queue_with_retries_and" },
    { icon: <Glyph><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13 7 4 4" /></Glyph>, title: "ferry.edit_in_place", body: "ferry.open_a_remote_file_in" },
    { icon: <Glyph><circle cx="11" cy="11" r="7" /><path d="M11 8v6M8 11h6" /></Glyph>, title: "ferry.inspector", body: "ferry.attributes_thumbnails_and_s3_metadata" },
    { icon: <Glyph><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></Glyph>, title: "ferry.share_links", body: "ferry.presigned_s3_links_valid_for" },
    { icon: <Glyph><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Glyph>, title: "ferry.secrets_in_the_keychain", body: "ferry.passwords_keys_and_passphrases_never" },
];

const PROTOCOLS = [
    { title: "ferry.s3", body: "ferry.aws_and_any_s3_compatible" },
    { title: "ferry.sftp", body: "ferry.password_or_ed25519_and_ecdsa" },
    { title: "ferry.webdav", body: "ferry.nextcloud_and_other_webdav_servers" },
    { title: "ferry.ftp_and_smb", body: "ferry.on_the_way" },
];

export default function Ferry() {
    const { t } = useTranslation();
    return (
        <main className="pb-12">
            <ProductMeta id="ferry" />
            <Hero
                id="ferry"
                tint="#1f5fd6 18%"
                visual={<FerryModel className="mb-2 max-w-[560px]" />}
                tagline={t("ferry.s3_sftp_and_webdav_in")}
                action={<ComingSoonButton label={t("ferry.coming_soon")} />}
                note={t("ferry.requirements")}
            >
                <FerryDemo className="mt-16" />
                <p className="mt-5 text-center text-[13px] text-faint">{t("ferry.demo_hint")}</p>
            </Hero>

            <Section>
                <SectionTitle>{t("ferry.remote_files_feel_local")}</SectionTitle>
                <SectionLead>{t("ferry.ferry_browses_buckets_and_servers")}</SectionLead>
                <FeatureGrid features={FEATURES} />
            </Section>

            <Statement eyebrow="ferry.drag_between_servers" title="ferry.copy_across_connections" body="ferry.paste_or_drag_between_tabs" />

            <Statement className="pb-8" eyebrow="ferry.protocols" title="ferry.one_interface_for_every_protocol" />
            <Section className="pt-6">
                <Points points={PROTOCOLS} />
            </Section>
        </main>
    );
}
