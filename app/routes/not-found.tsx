import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";

export default function NotFound() {
    const { t } = useTranslation();
    return (
        <main className="pb-12">
            <title>{t("common.not_found.title")}</title>
            <section className="pt-[104px] pb-14 text-center">
                <div className="wrap">
                    <h1 className="text-[clamp(36px,6vw,64px)] leading-[1.1] font-bold tracking-[-0.025em] text-balance">
                        {t("common.not_found.title")}
                    </h1>
                    <div className="mt-9 flex justify-center">
                        <Button asChild variant="outline">
                            <Link to="/">{t("common.not_found.back_home")}</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}
