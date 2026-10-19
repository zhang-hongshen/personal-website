import { useEffect, useState } from "react";

// "system" (default, follows the OS), "light" or "dark"; the nav button cycles light → dark → system.
export const THEME_CYCLE = ["light", "dark", "system"] as const;
export type Theme = (typeof THEME_CYCLE)[number];
export const THEME_KEY = "theme";

// Inlined into <head> so the chosen theme applies before the first paint.
export function applyStoredTheme(key: string) {
    try {
        const stored = localStorage.getItem(key);
        if (stored === "light" || stored === "dark") document.documentElement.dataset.theme = stored;
    } catch (e) { /* storage unavailable */ }
}

function readTheme(): Theme {
    try {
        const stored = localStorage.getItem(THEME_KEY);
        if ((THEME_CYCLE as readonly string[]).includes(stored ?? "")) return stored as Theme;
    } catch (e) { /* storage unavailable */ }
    return "system";
}

export function useTheme() {
    // Prerendered as "system"; the stored choice is read once the page is running.
    const [theme, setThemeState] = useState<Theme>("system");
    useEffect(() => setThemeState(readTheme()), []);

    function setTheme(next: Theme) {
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
        if (next === "system") delete document.documentElement.dataset.theme;
        else document.documentElement.dataset.theme = next;
        setThemeState(next);
    }

    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length];
    return { theme, next, cycle: () => setTheme(next) };
}
