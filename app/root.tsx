import { useLayoutEffect, useRef } from "react";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useMatches } from "react-router";
import { useTranslation } from "react-i18next";

import "./app.css";
import { Navbar } from "~/components/navbar";
import { detectLanguage, FALLBACK, LANGUAGE_KEY, LANGUAGES } from "~/lib/i18n";
import type { AccentHandle } from "~/lib/products";
import { applyStoredTheme, THEME_KEY } from "~/lib/theme";
import type { Route } from "./+types/root";

// Runs in <head> before the first paint: applies the stored theme, and hides the page
// (at most ~1.5 s) when it is about to switch from the prerendered English.
const headScript =
    `(${applyStoredTheme})(${JSON.stringify(THEME_KEY)});` +
    `(function(){var d=document.documentElement;` +
    `if((${detectLanguage})(${JSON.stringify(LANGUAGES)},${JSON.stringify(FALLBACK)},${JSON.stringify(LANGUAGE_KEY)})!==${JSON.stringify(FALLBACK)}){` +
    `d.classList.add("i18n-pending");setTimeout(function(){d.classList.remove("i18n-pending")},1500)}})();`;

export const links: Route.LinksFunction = () => [
    { rel: "icon", href: "/assets/site/icon.svg", type: "image/svg+xml" },
    { rel: "alternate icon", href: "/assets/site/icon-32.png", type: "image/png" },
    { rel: "apple-touch-icon", href: "/assets/site/apple-touch-icon.png" },
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
];

export function Layout({ children }: { children: React.ReactNode }) {
    const { i18n } = useTranslation();
    // The deepest route with an accent in its handle tints the whole page.
    const accent = useMatches()
        .map((m) => (m.handle as AccentHandle | undefined)?.accent)
        .filter(Boolean)
        .pop();
    const style = accent ? ({ "--accent-l": accent.light, "--accent-d": accent.dark } as React.CSSProperties) : undefined;

    return (
        <html lang={i18n.language} style={style} suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <script dangerouslySetInnerHTML={{ __html: headScript }} />
                <Meta />
                <Links />
            </head>
            <body>
                <Navbar />
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    const { i18n } = useTranslation();
    const target = useRef<string | null>(null);
    const rendered = i18n.language;

    // Switch from the prerendered English to the visitor's language, then show the page
    // once that language has rendered (layout effects, so nothing paints in between).
    useLayoutEffect(() => {
        target.current = detectLanguage(LANGUAGES, FALLBACK, LANGUAGE_KEY);
        if (target.current !== i18n.language) i18n.changeLanguage(target.current);
    }, [i18n]);
    useLayoutEffect(() => {
        if (target.current !== null && rendered === target.current) document.documentElement.classList.remove("i18n-pending");
    }, [rendered]);

    return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : "Something went wrong";
    return (
        <main className="wrap py-24 text-center">
            <h1 className="text-4xl font-bold">{message}</h1>
        </main>
    );
}
