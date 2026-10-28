import type { Config } from "@react-router/dev/config";

// Static site: every page is rendered to HTML at build time (build/client), which
// Cloudflare Pages serves as-is. No server code runs.
export default {
    ssr: false,
    prerender: [
        "/",
        "/products/modelcraft",
        "/products/arthub",
        "/products/keel",
        "/products/tunestudio",
        "/products/container",
        "/products/cellar",
        "/products/quaero",
        "/products/pinch",
        "/products/screenshot",
        "/products/ferry",
        "/resume",
        "/404",
    ],
} satisfies Config;
