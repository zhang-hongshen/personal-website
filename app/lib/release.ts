import { useEffect, useState } from "react";

// Points a download button straight at the latest .dmg on GitHub Releases.
// Without the API (offline, rate-limited) it keeps linking to the releases page.
export function useLatestRelease(repo: string) {
    const releases = `https://github.com/${repo}/releases/latest`;
    const [href, setHref] = useState(releases);

    useEffect(() => {
        let cancelled = false;
        const key = "release:" + repo;
        (async () => {
            let release: { url: string | null } | null = null;
            try { release = JSON.parse(sessionStorage.getItem(key) ?? "null"); } catch (e) { /* ignore */ }
            if (!release) {
                try {
                    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
                    if (!res.ok) return;
                    const data = await res.json();
                    const dmg = (data.assets || []).find((a: { name: string }) => a.name.toLowerCase().endsWith(".dmg"));
                    release = { url: dmg ? dmg.browser_download_url : null };
                    try { sessionStorage.setItem(key, JSON.stringify(release)); } catch (e) { /* ignore */ }
                } catch (e) {
                    return;
                }
            }
            if (!cancelled && release.url) setHref(release.url);
        })();
        return () => { cancelled = true; };
    }, [repo]);

    return href;
}
