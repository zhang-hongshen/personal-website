import { useTranslation } from "react-i18next";

// The demos carry their own words in each language next to the code that shows them, as
// [English, 简体中文, 繁體中文]. Pages are prerendered in English and switch to the visitor's
// language after hydration, so anything a demo keeps in state stores the tuple, not the string.

export type Lang = "en" | "zh-CN" | "zh-TW";

/** One string in each language. */
export type L = [en: string, cn: string, tw: string];

export function langOf(language: string): Lang {
    return language === "zh-CN" || language === "zh-TW" ? language : "en";
}

/** Picks the string for `lang`; a plain string is the same in every language. */
export function pick(lang: Lang) {
    const i = lang === "en" ? 0 : lang === "zh-CN" ? 1 : 2;
    return (l: L | string) => (typeof l === "string" ? l : l[i]);
}

export type Text = ReturnType<typeof pick>;

/** The locale for dates and numbers in `lang`. */
export function locale(lang: Lang) {
    return lang === "en" ? "en-US" : lang;
}

export function useLang(): Lang {
    return langOf(useTranslation().i18n.language);
}

/** The picker for the visitor's language: `s(["Tare", "去皮", "扣重"])`. */
export function useText(): Text {
    return pick(useLang());
}
