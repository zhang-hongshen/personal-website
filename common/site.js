// Shared navigation, translations, theme switching and download links for every page.
// Each page sets <html data-root="..."> (relative path to the site root) and
// <html data-page="home|product|about">.
(function () {
    const html = document.documentElement;
    const root = html.dataset.root || "";
    const page = html.dataset.page || "";
    // Pages load site.js as site.js?v=<version>; the same query busts the cache for locales.
    const version = document.currentScript ? new URL(document.currentScript.src).search : "";

    // ---------- Languages ----------
    // Each language has one file, locales/<code>.json. To add a language, add the
    // file and an entry here; `match` lists browser language prefixes it serves.
    const LANGUAGES = [
        { code: "zh-CN", name: "简体中文", match: ["zh-cn", "zh-sg", "zh-hans", "zh"] },
        { code: "zh-TW", name: "繁體中文", match: ["zh-tw", "zh-hk", "zh-mo", "zh-hant"] },
        { code: "en", name: "English", match: ["en"] },
    ];
    const FALLBACK = "en";
    const dictionaries = {};

    function getLanguage() {
        try {
            const stored = localStorage.getItem("selectedLanguage");
            if (LANGUAGES.some((l) => l.code === stored)) return stored;
        } catch (e) { /* storage unavailable */ }
        const preferred = (navigator.languages || [navigator.language || ""]).map((l) => l.toLowerCase());
        for (const pref of preferred) {
            // Most specific prefix wins, so zh-TW is not caught by plain "zh".
            const hits = LANGUAGES.flatMap((l) => l.match.filter((m) => pref.startsWith(m)).map((m) => [m.length, l.code]));
            if (hits.length) return hits.sort((a, b) => b[0] - a[0])[0][1];
        }
        return FALLBACK;
    }

    function loadDictionary(code) {
        if (!dictionaries[code]) {
            dictionaries[code] = fetch(`${root}locales/${code}.json${version}`)
                .then((res) => (res.ok ? res.json() : {}))
                .catch(() => ({}));
        }
        return dictionaries[code];
    }

    const lookup = (dict, key) => key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), dict);
    let current = { code: FALLBACK, dict: {}, fallback: {} };
    function t(key) {
        const value = lookup(current.dict, key);
        return value !== undefined ? value : lookup(current.fallback, key);
    }
    const format = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

    // data-i18n="key"            → textContent
    // data-i18n-html="key"       → innerHTML (strings with inline markup)
    // data-i18n-attr="attr:key"  → attribute value
    // data-i18n-list="key"       → renders an array through the element's <template>;
    //                              [data-field] / [data-field-html] pick item fields ("." = the item)
    // data-i18n-optional         → hidden when its key has no value in any language
    // <html data-i18n-title>     → document.title
    function translate(scope = document) {
        scope.querySelectorAll("[data-i18n]").forEach((el) => {
            const v = t(el.dataset.i18n);
            if (typeof v === "string") el.textContent = v;
        });
        scope.querySelectorAll("[data-i18n-html]").forEach((el) => {
            const v = t(el.dataset.i18nHtml);
            if (typeof v === "string") el.innerHTML = v;
        });
        scope.querySelectorAll("[data-i18n-attr]").forEach((el) => {
            const [attr, key] = el.dataset.i18nAttr.split(":");
            const v = t(key);
            if (typeof v === "string") el.setAttribute(attr, v);
        });
        scope.querySelectorAll("[data-i18n-list]").forEach((el) => {
            const items = t(el.dataset.i18nList);
            const template = el.querySelector(":scope > template");
            if (!Array.isArray(items) || !template) return;
            el.querySelectorAll(":scope > :not(template)").forEach((n) => n.remove());
            for (const item of items) {
                const node = template.content.cloneNode(true);
                const field = (name) => (name === "." ? item : item[name]);
                node.querySelectorAll("[data-field]").forEach((f) => (f.textContent = field(f.dataset.field) ?? ""));
                node.querySelectorAll("[data-field-html]").forEach((f) => (f.innerHTML = field(f.dataset.fieldHtml) ?? ""));
                el.append(node);
            }
        });
        scope.querySelectorAll("[data-i18n-optional]").forEach((el) => {
            const keyed = el.querySelector("[data-i18n]") || el;
            el.hidden = t(keyed.dataset.i18n) === undefined;
        });
        if (html.dataset.i18nTitle) {
            const title = t(html.dataset.i18nTitle);
            if (typeof title === "string") document.title = title;
        }
    }

    async function applyLanguage(code) {
        const lang = LANGUAGES.find((l) => l.code === code) || LANGUAGES.find((l) => l.code === FALLBACK);
        const [dict, fallback] = await Promise.all([loadDictionary(lang.code), loadDictionary(FALLBACK)]);
        current = { code: lang.code, dict, fallback };
        html.lang = lang.code;
        html.dataset.lang = lang.code;
        if (document.readyState === "loading") {
            await new Promise((r) => document.addEventListener("DOMContentLoaded", r, { once: true }));
        }
        translate();
        document.querySelectorAll(".lang-label").forEach((el) => (el.textContent = lang.name));
        document.querySelectorAll("[data-set-lang]").forEach((b) =>
            b.setAttribute("aria-checked", String(b.dataset.setLang === lang.code)));
        updateThemeButton();
        html.classList.remove("i18n-pending");
        document.dispatchEvent(new CustomEvent("langchange", { detail: lang.code }));
    }

    window.switchLanguage = function (code) {
        try { localStorage.setItem("selectedLanguage", code); } catch (e) { /* ignore */ }
        return applyLanguage(code);
    };
    window.getSelectedLanguage = getLanguage;

    // ---------- Theme ----------
    // "system" (default, follows the OS), "light" or "dark"; the nav button cycles light → dark → system.
    const THEME_CYCLE = ["light", "dark", "system"];

    function getTheme() {
        try {
            const stored = localStorage.getItem("theme");
            if (THEME_CYCLE.includes(stored)) return stored;
        } catch (e) { /* storage unavailable */ }
        return "system";
    }

    function updateThemeButton() {
        const theme = getTheme();
        const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length];
        const template = t("common.theme.label");
        document.querySelectorAll(".theme-btn").forEach((b) => {
            b.innerHTML = ICONS[theme];
            if (typeof template === "string") {
                const label = format(template, { current: t(`common.theme.${theme}`), next: t(`common.theme.${next}`) });
                b.title = label;
                b.setAttribute("aria-label", label);
            }
        });
    }

    function applyTheme(theme) {
        if (theme === "system") html.removeAttribute("data-theme");
        else html.dataset.theme = theme;
        updateThemeButton();
        updateAppIcons();
        document.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
    }

    function setTheme(theme) {
        try { localStorage.setItem("theme", theme); } catch (e) { /* ignore */ }
        applyTheme(theme);
    }
    window.getSelectedTheme = getTheme;

    // ---------- Products ----------
    // Icons come in a light and a dark variant; any <img> or <link rel="icon">
    // with data-app-icon="<id>" follows the theme.
    const PRODUCTS = [
        {
            id: "modelcraft", name: "ModelCraft",
            icon: { light: "assets/modelcraft/icon-light.png", dark: "assets/modelcraft/icon-dark.png" },
        },
        {
            id: "arthub", name: "Arthub",
            icon: { light: "assets/arthub/icon-light.svg", dark: "assets/arthub/icon-dark.svg" },
        },
        {
            id: "keel", name: "Keel",
            icon: { light: "assets/keel/icon-light.png", dark: "assets/keel/icon-dark.png" },
        },
    ];

    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    function effectiveTheme() {
        return html.dataset.theme || (darkQuery.matches ? "dark" : "light");
    }

    function updateAppIcons() {
        const mode = effectiveTheme();
        document.querySelectorAll("[data-app-icon]").forEach((el) => {
            const product = PRODUCTS.find((p) => p.id === el.dataset.appIcon);
            if (!product) return;
            const url = root + product.icon[mode];
            if (el.tagName === "LINK") { if (el.getAttribute("href") !== url) el.setAttribute("href", url); }
            else if (el.getAttribute("src") !== url) el.setAttribute("src", url);
        });
    }
    darkQuery.addEventListener("change", updateAppIcons);

    // ---------- Navigation ----------
    const svg = (body, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
    const ICONS = {
        system: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
        light: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>'),
        dark: svg('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
        globe: svg('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
        chevron: svg('<polyline points="6 9 12 15 18 9"/>', "chev"),
        check: svg('<polyline points="20 6 9 17 4 12"/>', "check"),
    };

    // A button that opens a menu: hover or click on desktop, tap on touch screens.
    function bindMenu(container) {
        const toggle = container.querySelector(":scope > button");
        const setOpen = (open) => {
            container.classList.toggle("open", open);
            toggle.setAttribute("aria-expanded", String(open));
        };
        toggle.addEventListener("click", (e) => {
            e.stopPropagation();
            setOpen(!container.classList.contains("open"));
        });
        document.addEventListener("click", (e) => { if (!container.contains(e.target)) setOpen(false); });
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
        return setOpen;
    }

    function renderNav() {
        const tab = (id, href, key, fallback) =>
            `<a href="${root}${href || "./"}" class="${id === page ? "active" : ""}" data-i18n="${key}">${fallback}</a>`;
        const items = PRODUCTS.map((p) =>
            `<a role="menuitem" href="${root}products/${p.id}/" class="${location.pathname.includes(`/products/${p.id}/`) ? "current" : ""}">` +
            `<img data-app-icon="${p.id}" src="${root}${p.icon[effectiveTheme()]}" alt="" width="36" height="36">` +
            `<strong>${p.name}</strong></a>`
        ).join("");
        const languages = LANGUAGES.map((l) =>
            `<button type="button" role="menuitemradio" data-set-lang="${l.code}" lang="${l.code}" aria-checked="false">` +
            `<span>${l.name}</span>${ICONS.check}</button>`
        ).join("");
        const nav = document.createElement("nav");
        nav.className = "navbar";
        nav.innerHTML = `
            <div class="wrap">
                <div class="navbar-tabs">
                    ${tab("home", "", "common.nav.home", "Home")}
                    <div class="nav-dropdown">
                        <button type="button" class="${page === "product" ? "active" : ""}" aria-haspopup="true" aria-expanded="false">
                            <span data-i18n="common.nav.products">Products</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <div class="nav-menu" role="menu">${items}</div>
                    </div>
                </div>
                <div class="nav-controls">
                    <div class="navbar-tabs">${tab("about", "resume/", "common.nav.about", "About me")}</div>
                    <div class="lang-menu">
                        <button type="button" class="icon-btn lang-btn" aria-haspopup="true" aria-expanded="false" data-i18n-attr="aria-label:common.nav.language">
                            ${ICONS.globe}<span class="lang-label"></span>${ICONS.chevron}
                        </button>
                        <div class="nav-menu" role="menu">${languages}</div>
                    </div>
                    <button type="button" class="icon-btn theme-btn"></button>
                </div>
            </div>`;
        document.body.prepend(nav);

        bindMenu(nav.querySelector(".nav-dropdown"));
        const setLangOpen = bindMenu(nav.querySelector(".lang-menu"));
        nav.querySelectorAll("[data-set-lang]").forEach((b) =>
            b.addEventListener("click", () => {
                window.switchLanguage(b.dataset.setLang);
                setLangOpen(false);
            }));
        nav.querySelector(".theme-btn").addEventListener("click", () => {
            const theme = getTheme();
            setTheme(THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length]);
        });
    }

    // ---------- Product ring ----------
    // <div class="product-ring" data-product-ring="modelcraft"> draws that product in the
    // middle with every other product on an orbit around it, linked by flowing lines.
    // Empty dashed slots between them leave room for products still to come.
    function renderRings() {
        document.querySelectorAll("[data-product-ring]").forEach((el) => {
            const hub = PRODUCTS.find((p) => p.id === el.dataset.productRing) || PRODUCTS[0];
            const others = PRODUCTS.filter((p) => p !== hub);
            const step = 360 / others.length;
            const start = -90 + step / 2; // two products sit left and right
            const at = (deg) => {
                const a = (deg * Math.PI) / 180;
                return [50 + 36 * Math.cos(a), 50 + 36 * Math.sin(a)].map((v) => +v.toFixed(2));
            };
            const nodes = others.map((p, i) => ({ p, xy: at(start + i * step) }));
            const slots = others.map((_, i) => at(start + (i + 0.5) * step));
            const icon = (p) => `<img data-app-icon="${p.id}" src="${root}${p.icon[effectiveTheme()]}" alt="">`;

            el.innerHTML = `
                <svg viewBox="0 0 100 100" aria-hidden="true">
                    <circle class="ring-orbit" cx="50" cy="50" r="36"/>
                    ${nodes.map(({ xy: [x, y] }, i) => `
                        <line class="ring-link" x1="50" y1="50" x2="${x}" y2="${y}"/>
                        <line class="ring-flow" x1="50" y1="50" x2="${x}" y2="${y}" pathLength="100" style="animation-delay:${-i * 0.9}s"/>`).join("")}
                </svg>
                ${slots.map(([x, y]) => `<span class="ring-slot" style="--x:${x}%;--y:${y}%" aria-hidden="true"></span>`).join("")}
                <a class="ring-hub" href="${root}products/${hub.id}/" aria-label="${hub.name}">${icon(hub)}</a>
                ${nodes.map(({ p, xy: [x, y] }) => `
                    <a class="ring-node" href="${root}products/${p.id}/" style="--x:${x}%;--y:${y}%">
                        ${icon(p)}
                        <span><strong>${p.name}</strong><small data-i18n="common.ring.${p.id}"></small></span>
                    </a>`).join("")}`;
        });
    }

    // ---------- Downloads ----------
    // Point download buttons straight at the latest .dmg on GitHub Releases.
    // Without the API (offline, rate-limited) they keep linking to the releases page.
    async function resolveDownloads() {
        const buttons = document.querySelectorAll("[data-release]");
        const repos = [...new Set([...buttons].map((b) => b.dataset.release))];
        for (const repo of repos) {
            let release = null;
            const key = "release:" + repo;
            try { release = JSON.parse(sessionStorage.getItem(key)); } catch (e) { /* ignore */ }
            if (!release) {
                try {
                    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
                    if (!res.ok) continue;
                    const data = await res.json();
                    const dmg = (data.assets || []).find((a) => a.name.toLowerCase().endsWith(".dmg"));
                    release = { url: dmg ? dmg.browser_download_url : null };
                    try { sessionStorage.setItem(key, JSON.stringify(release)); } catch (e) { /* ignore */ }
                } catch (e) {
                    continue;
                }
            }
            document.querySelectorAll(`[data-release="${repo}"]`).forEach((btn) => {
                if (release.url) btn.href = release.url;
            });
        }
    }

    // ---------- Start ----------
    // Runs in <head>: the theme is set before the first paint, and the page stays
    // hidden until its text is translated (at most ~1.5 s, in case a file fails to load).
    applyTheme(getTheme());
    html.classList.add("i18n-pending");
    setTimeout(() => html.classList.remove("i18n-pending"), 1500);
    const ready = applyLanguage(getLanguage());
    document.addEventListener("DOMContentLoaded", () => {
        renderNav();
        renderRings();
        updateThemeButton();
        updateAppIcons();
        ready.then(() => applyLanguage(current.code));
        resolveDownloads();
    });
})();
