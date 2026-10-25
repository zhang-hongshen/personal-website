import { ChevronDown, Globe, Monitor, Moon, Sun } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { LANGUAGES, setLanguage } from "~/lib/i18n";
import { PRODUCT_GROUPS } from "~/lib/products";
import { useTheme } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { ProductIcon } from "./product-icon";

const tab =
    "flex h-9 items-center gap-1 whitespace-nowrap rounded-full px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground hover:no-underline max-sm:px-[9px] max-sm:text-[13.5px] cursor-pointer";
const activeTab = "bg-accent font-semibold text-foreground";
const iconButton =
    "gap-1.5 border-border hover:border-border-strong data-[state=open]:border-border-strong data-[state=open]:bg-accent data-[state=open]:text-foreground";

const THEME_ICONS = { system: Monitor, light: Sun, dark: Moon };

export function Navbar() {
    const { t, i18n } = useTranslation();
    const { pathname } = useLocation();
    const { theme, next, cycle } = useTheme();
    const language = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[LANGUAGES.length - 1];
    const ThemeIcon = THEME_ICONS[theme];
    const themeLabel = t("common.theme.label", { current: t(`common.theme.${theme}`), next: t(`common.theme.${next}`) });

    return (
        <nav className="no-print sticky top-0 z-[100] h-16 border-b border-border bg-glass backdrop-blur-[16px] backdrop-saturate-[180%]">
            <div className="wrap flex h-full items-center justify-between gap-3 max-sm:px-2.5">
                <div className="flex items-center gap-1 max-sm:gap-0">
                    <NavLink to="/" end className={({ isActive }) => cn(tab, isActive && activeTab)}>
                        {t("common.nav.home")}
                    </NavLink>
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger className={cn(tab, "group", pathname.startsWith("/products/") && activeTab)}>
                            {t("common.nav.products")}
                            <ChevronDown className="size-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180" strokeWidth={2.5} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="center"
                            collisionPadding={10}
                            className="max-h-[var(--radix-dropdown-menu-content-available-height)] gap-x-1.5 overflow-y-auto min-[560px]:w-[520px] min-[560px]:columns-2"
                        >
                            {/* Groups flow down two columns, so a small group doesn't leave a hole beside a big one. */}
                            {PRODUCT_GROUPS.map(({ category, products }) => (
                                <DropdownMenuGroup key={category} className="break-inside-avoid">
                                    <DropdownMenuLabel>{t(`common.category.${category}`)}</DropdownMenuLabel>
                                    {products.map((p) => (
                                        <DropdownMenuItem key={p.id} asChild className={cn(pathname.startsWith(`/products/${p.id}`) && "bg-accent")}>
                                            <Link to={`/products/${p.id}/`}>
                                                <ProductIcon id={p.id} className="-m-0.5 size-10 flex-none" width={36} height={36} />
                                                <strong className="font-semibold">{p.name}</strong>
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuGroup>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-1.5 max-sm:gap-1">
                    <NavLink to="/resume/" className={({ isActive }) => cn(tab, isActive && activeTab)}>
                        {t("common.nav.about")}
                    </NavLink>
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" lift={false} className={cn(iconButton, "w-auto px-2.5 max-sm:w-9 max-sm:px-0")} aria-label={t("common.nav.language")}>
                                <Globe />
                                <span className="max-sm:hidden">{language.name}</span>
                                <ChevronDown className="!size-3 opacity-60 max-sm:hidden" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuRadioGroup value={language.code} onValueChange={setLanguage}>
                                {LANGUAGES.map((l) => (
                                    <DropdownMenuRadioItem key={l.code} value={l.code} lang={l.code}>
                                        {l.name}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" lift={false} className={iconButton} onClick={cycle} title={themeLabel} aria-label={themeLabel}>
                        <ThemeIcon />
                    </Button>
                </div>
            </div>
        </nav>
    );
}
