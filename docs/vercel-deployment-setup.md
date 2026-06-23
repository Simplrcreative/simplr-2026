# Vercel Deployment Setup

> **Do this before going live.**  
> This document covers the environment variables and build-configuration changes required for the prerendering pipeline to work correctly on Vercel (production + preview/staging).

---

## 1. Environment variables in the Vercel dashboard

Go to your Vercel project → **Settings → Environment Variables**.

### Production

| Variable | Value | Scope |
|---|---|---|
| `VITE_SITE_URL` | `https://simplr.co.za` | Production |

### Preview / Staging

| Variable | Value | Scope |
|---|---|---|
| `VITE_SITE_URL` | `https://simplr-2026.vercel.app` | Preview |

### Optional: GraphQL endpoint

The committed `.env` file points directly to Kinsta (`https://simplrdashboard.kinsta.cloud/graphql`). If you prefer the live app to hit the Vercel `/graphql` proxy (avoids CORS issues), also add:

| Variable | Value | Scope |
|---|---|---|
| `VITE_WPGRAPHQL_ENDPOINT` | `/graphql` | Production + Preview |

If you leave this out, the app will use the direct Kinsta URL. That works fine as long as Kinsta’s CORS allows your domains.

---

## 2. Playwright Chromium for build-time prerendering

The `postbuild` script (`scripts/prerender.mjs`) uses Playwright to render every route into static HTML. Vercel’s build containers are Linux-based and do **not** include Chrome.

### `postinstall` script

Already added to `package.json`:

```json
"postinstall": "PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium"
```

`PLAYWRIGHT_BROWSERS_PATH=0` installs the browser inside `node_modules` so Vercel caches it between builds. The first deploy after this change will download Chromium (~50–100 MB), which adds roughly 30–60 seconds to the build. Subsequent builds reuse the cached browser.

### `@sparticuz/chromium` (Vercel Linux)

On Vercel’s Linux build containers, Playwright’s bundled Chromium fails with missing system libraries (`libnspr4.so`). The postbuild script uses `@sparticuz/chromium` instead, which ships its own binary plus AL2023 shared libs.

**Important:** Do not overwrite `LD_LIBRARY_PATH` after calling `executablePath()` — `@sparticuz/chromium` sets it to `/tmp/al2023/lib` on Vercel. Overwriting it breaks launch with the same `libnspr4.so` error you see from Playwright.

The package is listed in **`dependencies`** so it is always installed during the Vercel build. Playwright’s browser download is skipped on Vercel (`VERCEL=1`); only the Node API is used to drive `@sparticuz/chromium`.

### Build fails if prerender fails

If no browser can launch, or zero routes prerender successfully, **`postbuild` exits with code 1** and the deploy fails. That is intentional: a deploy without prerendered HTML would look exactly like your live `/about/` view-source today (empty `#root`, generic `<title>Simplr</title>`). Check the Vercel build log for `Prerender complete: N/N routes` or `PRERENDER FAILED`.

---

## 3. How the env files work

| File | Committed? | Used by |
|---|---|---|
| `.env` | ✅ Yes | Fallback for builds when no dashboard var is set. Currently holds production defaults. |
| `.env.local` | ❌ No (gitignored via `*.local`) | Local development only. Your machine already has this with `http://localhost:5173`. |
| `.env.example` | ✅ Yes | Template for new devs. Copy to `.env.local` to get started. |
| Vercel dashboard | N/A | Overrides `.env` on Production and Preview builds. |

**Important:**  
Vite loads `.env.local` after `.env`, and the Vercel dashboard injects variables into `process.env`. Our build scripts (`generate-seo-assets.mjs` and `prerender.mjs`) merge files first and then override with `process.env`, so dashboard variables always win.

---

## 4. What the prerender script does

`npm run build` now runs three phases automatically:

1. **`prebuild`** — `scripts/generate-seo-assets.mjs`  
   Fetches dynamic routes from WordPress and writes:
   - `public/sitemap.xml`
   - `public/robots.txt`
   - `public/llms.txt`
   - `public/llms-full.txt`

2. **`build`** — `vite build`  
   Bundles the React app into `dist/` and copies `public/` assets.

3. **`postbuild`** — `scripts/prerender.mjs`  
   - Starts a local static server on a random port
   - Proxies `/graphql` to the WordPress endpoint
   - Uses Playwright to visit every route in `dist/sitemap.xml`
   - Saves fully rendered HTML (with all `<head>` meta tags, OG tags, JSON-LD) into:
     - `dist/index.html` (root)
     - `dist/<route>/index.html` (every other page)

### Vercel serving behavior

Your existing `vercel.json` already does filesystem-first routing:

```json
{ "handle": "filesystem" },
{ "src": "/(.*)", "dest": "/index.html" }
```

This means bots hitting `/work/some-project` get the prerendered `dist/work/some-project/index.html` instantly. Human visitors still get the hydrated SPA experience.

---

## 5. Quick verification after deploying

1. Run a production build locally with the correct env:
   ```bash
   VITE_SITE_URL=https://simplr.co.za npm run build
   ```
2. Check that `dist/sitemap.xml` contains `https://simplr.co.za` URLs, not `localhost`.
3. Check that a prerendered page has the correct title:
   ```bash
   grep -o '<title>[^<]*</title>' dist/work/<slug>/index.html
   ```
4. Deploy to Vercel and use:
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)

---

## 6. Rollback

If prerendering causes problems, revert to pure CSR by removing the `postbuild` script from `package.json`:

```bash
git checkout -- package.json
rm scripts/prerender.mjs
```

Or simply delete the `postbuild` line from `package.json` scripts.
