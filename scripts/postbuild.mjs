// Cloudflare Pages serves 404.html for unknown paths; React Router prerenders /404 as 404/index.html.
import { copyFileSync, rmSync } from "node:fs";

const out = new URL("../build/client/", import.meta.url);
copyFileSync(new URL("404/index.html", out), new URL("404.html", out));
rmSync(new URL("404", out), { recursive: true });
rmSync(new URL("__spa-fallback.html", out), { force: true });
