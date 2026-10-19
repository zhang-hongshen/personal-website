import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "~/locales/en.json";
import zhCN from "~/locales/zh-CN.json";
import zhTW from "~/locales/zh-TW.json";

// Each language has one file, locales/<code>.json. To add a language, add the
// file, import it above and add an entry here; `match` lists browser language
// prefixes it serves.
export const LANGUAGES = [
    { code: "zh-CN", name: "简体中文", match: ["zh-cn", "zh-sg", "zh-hans", "zh"] },
    { code: "zh-TW", name: "繁體中文", match: ["zh-tw", "zh-hk", "zh-mo", "zh-hant"] },
    { code: "en", name: "English", match: ["en"] },
];
export const FALLBACK = "en";
export const LANGUAGE_KEY = "selectedLanguage";

// Self-contained so root.tsx can also inline it into <head> (via toString) and hide
// the page before first paint when the visitor's language isn't the prerendered one.
export function detectLanguage(languages: typeof LANGUAGES, fallback: string, key: string): string {
    try {
        const stored = localStorage.getItem(key);
        if (languages.some((l) => l.code === stored)) return stored as string;
    } catch (e) { /* storage unavailable */ }
    const preferred = (navigator.languages || [navigator.language || ""]).map((l) => l.toLowerCase());
    for (const pref of preferred) {
        // Most specific prefix wins, so zh-TW is not caught by plain "zh".
        const hits: [number, string][] = [];
        for (const l of languages) for (const m of l.match) if (pref.indexOf(m) === 0) hits.push([m.length, l.code]);
        if (hits.length) return hits.sort((a, b) => b[0] - a[0])[0][1];
    }
    return fallback;
}

export function setLanguage(code: string) {
    try { localStorage.setItem(LANGUAGE_KEY, code); } catch (e) { /* ignore */ }
    return i18n.changeLanguage(code);
}

// Pages are prerendered in English; root.tsx switches to the visitor's language after hydration.
i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        "zh-CN": { translation: zhCN },
        "zh-TW": { translation: zhTW },
    },
    lng: FALLBACK,
    fallbackLng: FALLBACK,
    initAsync: false,
    interpolation: { escapeValue: false, prefix: "{", suffix: "}" },
});

export default i18n;
