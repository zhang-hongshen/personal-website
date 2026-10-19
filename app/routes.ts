import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("products/modelcraft", "routes/modelcraft.tsx"),
    route("products/arthub", "routes/arthub.tsx"),
    route("products/keel", "routes/keel.tsx"),
    route("products/tunestudio", "routes/tunestudio.tsx"),
    route("products/container", "routes/container.tsx"),
    route("resume", "routes/resume.tsx"),
    // /404 is prerendered and copied to 404.html for Cloudflare Pages (scripts/postbuild.mjs).
    route("404", "routes/not-found.tsx", { id: "not-found" }),
    route("*", "routes/not-found.tsx", { id: "catch-all" }),
] satisfies RouteConfig;
