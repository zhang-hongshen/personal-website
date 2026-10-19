# PersonalWebsite

Product pages and resume, built with React Router (framework mode), Tailwind CSS and shadcn/ui.
Every page is prerendered to static HTML at build time, so the site needs no server.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm run typecheck
```

- Pages live in `app/routes/`, registered in `app/routes.ts`. New pages also go in the
  `prerender` list in `react-router.config.ts`.
- Text is in `app/locales/<language>.json` (English, 简体中文, 繁體中文). Pages are prerendered
  in English and switch to the visitor's language in the browser.
- Images and icons are in `public/assets/`.
- shadcn components are in `app/components/ui/`; add more with `npx shadcn@latest add <name>`.

## Build and deploy

```sh
npm run build      # writes build/client
npm run preview    # serves build/client locally
```

Hosted on Cloudflare Pages:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `build/client` |
| Node version | from `.nvmrc` (or `NODE_VERSION` = `24`) |

`public/_redirects` sends `/products/` to the home page, and `404.html` is served for unknown paths.
