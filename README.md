# Simplr 2026

Vite and React scaffold for a headless WordPress site with Tailwind styling, GSAP page transitions, dynamic content routes, and a baseline SEO/GEO layer.

## Stack

- Vite + React
- React Router data routes
- Tailwind CSS v4 via the Vite plugin
- GSAP for configurable page transitions
- WordPress via WPGraphQL
- React Helmet Async for metadata management

## Main routes

- `/`
- `/work`
- `/work/:slug`
- `/about`
- `/services`
- `/thinking`
- `/thinking/:topic/:slug`
- `/contact`
- `/est-2014`

## Environment

Create `.env` and update the values for your environment.

```bash
VITE_SITE_URL=https://simplr.co.za
VITE_WPGRAPHQL_ENDPOINT=https://cms.simplr.co.za/graphql
VITE_WP_DEV_PROXY_TARGET=
VITE_WP_SITE_NAME=Simplr
VITE_WORK_CONTENT_TYPE=PROJECT
VITE_THINKING_CONTENT_TYPE=POST
VITE_WORK_URI_BASE=/work/
VITE_THINKING_URI_BASE=/thinking/
```

## Local WordPress development

For Local or another local WordPress install, prefer `.env.local` so the settings stay out of git.

```bash
VITE_SITE_URL=http://localhost:5173
VITE_WPGRAPHQL_ENDPOINT=/graphql
VITE_WP_DEV_PROXY_TARGET=http://simplr-dashboard.local
VITE_WP_SITE_NAME=Simplr
VITE_WORK_CONTENT_TYPE=PROJECT
VITE_THINKING_CONTENT_TYPE=POST
VITE_WORK_URI_BASE=/work/
VITE_THINKING_URI_BASE=/thinking/
```

This lets Vite proxy `/graphql` to your local WordPress install during `npm run dev`, which avoids browser CORS problems. For live environments, set `VITE_WPGRAPHQL_ENDPOINT` back to the full GraphQL URL and leave `VITE_WP_DEV_PROXY_TARGET` empty.

## WordPress assumptions

- `About`, `Services`, `Contact`, and `Est. 2014` are WordPress pages matching the route URIs.
- `Thinking` resolves from WordPress posts by default.
- `Work` resolves from a custom post type exposed through WPGraphQL. Change `VITE_WORK_CONTENT_TYPE` if your enum is different.
- Single routes assume WordPress URIs map to `/work/:slug/` and `/thinking/:slug/`.

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

`npm run build` generates the following SEO/GEO assets before the Vite build:

- `public/sitemap.xml`
- `public/robots.txt`
- `public/llms.txt`
- `public/llms-full.txt`

## SEO and GEO baseline

- Route-level canonical tags, Open Graph tags, Twitter cards, and meta descriptions
- JSON-LD for `Organization`, `WebSite`, `WebPage`, `CollectionPage`, `Article`, `ContactPage`, and a service item list
- Build-time sitemap and robots generation
- `llms.txt` and `llms-full.txt` generation for machine-readable discovery
- Semantic templates for list pages and article pages

## SEO, GEO, and AI roadmap

- Project checklist and phased plan: [roadmap-seo-geo-ai.md](roadmap-seo-geo-ai.md)

## Transition config

Page transitions are configured in `src/config/site.js` under `siteConfig.transitions`.

Available settings include:

- `enabled`
- `duration`
- `ease`
- `opacity`
- `y`
- `blur`

## Notes

- The scaffold includes fallback content so the front end remains usable before WordPress is connected.
- For fully robust SEO on content-heavy routes, SSR or prerendering is still worth considering later if crawl timing becomes a concern.
