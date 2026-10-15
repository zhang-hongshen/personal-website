// Shared navigation, language and theme switching, and download links for every page.
// Each page sets <html data-root="..."> (relative path to the site root) and
// <html data-page="home|product|resume">.
(function () {
    // To add a language: add it here, add its content as data-l="<short>" spans,
    // a data-title-<short> attribute on <html>, and a hide rule in site.css.
    const LANGUAGES = [
        { code: "zh-CN", short: "zh", name: "简体中文", english: "Chinese (Simplified)" },
        { code: "en", short: "en", name: "English", english: "English" },
    ];
    const root = document.documentElement.dataset.root || "";
    const page = document.documentElement.dataset.page || "";

    function getLanguage() {
        try {
            const stored = localStorage.getItem("selectedLanguage");
            if (LANGUAGES.some((l) => l.code === stored)) return stored;
        } catch (e) { /* storage unavailable */ }
        const preferred = (navigator.languages || [navigator.language || ""]).map((l) => l.toLowerCase());
        for (const pref of preferred) {
            const match = LANGUAGES.find((l) => pref === l.code.toLowerCase() || pref.startsWith(l.short));
            if (match) return match.code;
        }
        return "en";
    }

    function applyLanguage(code) {
        const lang = LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
        const html = document.documentElement;
        html.dataset.lang = lang.code;
        html.lang = lang.code;
        const title = html.getAttribute(`data-title-${lang.short}`);
        if (title) document.title = title;
        document.querySelectorAll(".lang-label").forEach((el) => (el.textContent = lang.name));
        document.querySelectorAll("[data-set-lang]").forEach((b) =>
            b.setAttribute("aria-checked", String(b.dataset.setLang === lang.code)));
        document.dispatchEvent(new CustomEvent("langchange", { detail: lang.code }));
    }

    window.switchLanguage = function (code) {
        try { localStorage.setItem("selectedLanguage", code); } catch (e) { /* ignore */ }
        applyLanguage(code);
    };
    window.getSelectedLanguage = getLanguage;

    // Theme: "system" (default, follows the OS), "light" or "dark".
    // The nav button cycles light → dark → system.
    const THEME_CYCLE = ["light", "dark", "system"];
    const THEME_LABELS = {
        system: { en: "Theme: System", zh: "主题：跟随系统" },
        light: { en: "Theme: Light", zh: "主题：浅色" },
        dark: { en: "Theme: Dark", zh: "主题：深色" },
    };

    function getTheme() {
        try {
            const stored = localStorage.getItem("theme");
            if (THEME_CYCLE.includes(stored)) return stored;
        } catch (e) { /* storage unavailable */ }
        return "system";
    }

    function applyTheme(theme) {
        const html = document.documentElement;
        if (theme === "system") html.removeAttribute("data-theme");
        else html.dataset.theme = theme;
        document.querySelectorAll(".theme-btn").forEach((b) => {
            b.innerHTML = ICONS[theme];
            const short = (html.dataset.lang || "en").startsWith("zh") ? "zh" : "en";
            const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length];
            const nextName = THEME_LABELS[next][short].split(/[:：]/)[1].trim();
            const label = short === "zh"
                ? `${THEME_LABELS[theme].zh}（点击切换为${nextName}）`
                : `${THEME_LABELS[theme].en} (click for ${nextName})`;
            b.title = label;
            b.setAttribute("aria-label", label);
        });
        document.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
    }

    function setTheme(theme) {
        try { localStorage.setItem("theme", theme); } catch (e) { /* ignore */ }
        applyTheme(theme);
    }
    window.getSelectedTheme = getTheme;

    const PRODUCTS = [
        ["modelcraft", "ModelCraft", "assets/modelcraft/icon.png", "On-device AI assistant", "设备端 AI 助手"],
        ["arthub", "Arthub", "assets/arthub/icon.png", "Your media library", "你的影音库"],
    ];

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
        const tab = (id, href, en, zh) =>
            `<a href="${root}${href || "./"}" class="${id === page ? "active" : ""}">` +
            `<span data-l="en">${en}</span><span data-l="zh">${zh}</span></a>`;
        const items = PRODUCTS.map(([id, name, icon, en, zh]) =>
            `<a role="menuitem" href="${root}products/${id}/" class="${location.pathname.includes(`/products/${id}/`) ? "current" : ""}">` +
            `<img src="${root}${icon}" alt="" width="36" height="36">` +
            `<span><strong>${name}</strong><small><span data-l="en">${en}</span><span data-l="zh">${zh}</span></small></span></a>`
        ).join("");
        const languages = LANGUAGES.map((l) =>
            `<button type="button" role="menuitemradio" data-set-lang="${l.code}" lang="${l.code}" aria-checked="false">` +
            `<span>${l.name}${l.english !== l.name ? ` <small>${l.english}</small>` : ""}</span>${ICONS.check}</button>`
        ).join("");
        const nav = document.createElement("nav");
        nav.className = "navbar";
        nav.innerHTML = `
            <div class="wrap">
                <div class="navbar-tabs">
                    ${tab("home", "", "Home", "首页")}
                    <div class="nav-dropdown">
                        <button type="button" class="${page === "product" ? "active" : ""}" aria-haspopup="true" aria-expanded="false">
                            <span data-l="en">Products</span><span data-l="zh">产品</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <div class="nav-menu" role="menu">${items}</div>
                    </div>
                    ${tab("resume", "resume/", "Resume", "简历")}
                </div>
                <div class="nav-controls">
                    <div class="lang-menu">
                        <button type="button" class="icon-btn lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="Language / 语言" title="Language / 语言">
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
                applyTheme(getTheme()); // refresh the theme button's label language
                setLangOpen(false);
            }));
        nav.querySelector(".theme-btn").addEventListener("click", () => {
            const current = getTheme();
            setTheme(THEME_CYCLE[(THEME_CYCLE.indexOf(current) + 1) % THEME_CYCLE.length]);
        });
    }

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


    // Runs in <head>, so the theme is set before the first paint (no flash).
    applyLanguage(getLanguage());
    applyTheme(getTheme());
    document.addEventListener("DOMContentLoaded", () => {
        renderNav();
        applyLanguage(getLanguage());
        applyTheme(getTheme());
        resolveDownloads();
    });
})();
