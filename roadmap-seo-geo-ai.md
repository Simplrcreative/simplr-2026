# SEO, GEO, AEO, and LLMS Roadmap

Status: Active  
Primary domain: https://simplr.co.za  
Indexing: **blocked** (`VITE_ALLOW_INDEXING=false`) until launch

## How to use this

- `[ ]` Not started · `[~]` In progress · `[x]` Done
- **S** = 0.5–1 day · **M** = 1–3 days · **L** = 3+ days
- Re-prioritise weekly by business impact

## Where we are

**Start here:** Phase 0 foundation → Phase 1 schema → Phase 2 LLMS/GEO → launch (Phase 4).

Sprint 1 (meta + schema wiring) is largely **done in code**. Next up: validate in prerendered HTML, then Phase 2 llms.txt rewrite.

---

## Completed baseline

- [x] Production site URL defaults (`simplr.co.za`)
- [x] Trailing-slash URLs across router and links
- [x] Build-time sitemap, robots.txt, llms.txt, llms-full.txt
- [x] Vercel prerender pipeline (Playwright + `@sparticuz/chromium`)
- [x] `VITE_ALLOW_INDEXING` flag — noindex while testing
- [x] Shared SEO helpers (`Seo.jsx`, `src/lib/seo.js`, `src/lib/page-seo.js`)
- [x] Loaders fetch WP page meta for static routes
- [x] Page-specific `<Seo />` on all main templates
- [x] Schema types: CollectionPage (work/thinking), AboutPage, ContactPage, CreativeWork (work singles), Article (thinking singles), Service (service singles)

---

## Phase 0 — Foundation (SEO)

| # | Task | Status | Effort |
|---|------|--------|--------|
| 0.1 | Replace placeholder meta with WP/fallback content on all routes | [x] | M |
| 0.2 | Trailing-slash canonicals site-wide | [x] | S |
| 0.3 | Pass featured/OG images into `<Seo />` where available | [~] | M |
| 0.4 | Fix schema `@type` mismatches (Contact, Work index, etc.) | [x] | S |
| 0.5 | Shared `page-seo.js` helpers for meta + schema | [x] | M |
| 0.6 | Verify prerender HTML on 5 sample URLs (view-source audit) | [ ] | S |

**Exit:** View-source shows correct title, description, canonical, OG, JSON-LD from real content.

---

## Phase 1 — Structured data (SEO + AEO)

| # | Task | Status | Effort |
|---|------|--------|--------|
| 1.1 | Home — WebPage + ItemList/FAQ schema | [x] | S |
| 1.2 | Work index — CollectionPage | [x] | S |
| 1.3 | Work singles — CreativeWork + breadcrumbs | [x] | M |
| 1.4 | Thinking singles — Article (author, date, image) | [x] | M |
| 1.5 | Services index — ServicesPage + ItemList | [~] | M |
| 1.6 | Service singles — Service schema | [x] | M |
| 1.7 | About — AboutPage | [x] | S |
| 1.8 | Contact — ContactPage | [x] | S |
| 1.9 | Validate in Rich Results Test + Schema.org validator | [ ] | S |
| 1.10 | Audit Organization/WebSite values against live brand facts | [ ] | S |

**Exit:** No schema errors; each template has the correct type.

---

## Phase 2 — LLMS & AI discovery (GEO + LLMS)

| # | Task | Status | Effort |
|---|------|--------|--------|
| 2.1 | Rewrite `buildLlms()` to llmstxt.org spec (H1, blockquote, sections) | [ ] | S |
| 2.2 | Rewrite `buildLlmsFull()` — Facts & entities block | [ ] | M |
| 2.3 | Generate llms links from WP at build (curated, not all 73 URLs) | [ ] | M |
| 2.4 | Link llms.txt → llms-full.txt | [ ] | S |
| 2.5 | Answer-first intros on thinking posts (WP editorial guideline) | [ ] | M |
| 2.6 | Case study template: challenge → approach → result fields | [ ] | M |
| 2.7 | GEO QA prompt pack (10–15 brand questions + scoring sheet) | [ ] | S |
| 2.8 | Baseline GEO audit before launch | [ ] | S |

**Exit:** `/llms.txt` reads like a Simplr briefing doc; LLM can answer basic brand questions from it.

---

## Phase 3 — Technical SEO hardening

| # | Task | Status | Effort |
|---|------|--------|--------|
| 3.1 | Sitemap `lastmod` from WP modified dates | [ ] | M |
| 3.2 | CI: fail build if localhost URLs in crawl assets | [ ] | S |
| 3.3 | CI: broken internal link check | [ ] | M |
| 3.4 | Trailing-slash redirect policy (non-trailing → trailing) | [ ] | S |
| 3.5 | OG/Twitter images on all singles (not default social-card) | [~] | M |
| 3.6 | Lighthouse baseline (home, work, thinking — mobile) | [ ] | M |
| 3.7 | Confirm production URLs in prerender canonicals/OG | [ ] | S |

---

## Phase 4 — Launch & post-launch

| # | Task | Status | Effort |
|---|------|--------|--------|
| 4.1 | Set `VITE_ALLOW_INDEXING=true` in Vercel Production | [ ] | S |
| 4.2 | Redeploy; confirm robots.txt allows crawl + sitemap | [ ] | S |
| 4.3 | Submit sitemap — Google Search Console + Bing | [ ] | S |
| 4.4 | Social preview tests (Facebook, LinkedIn) on 5 URLs | [ ] | S |
| 4.5 | Weekly index coverage check (first 30 days) | [ ] | Ongoing |
| 4.6 | Monthly GEO QA re-run | [ ] | Ongoing |
| 4.7 | Search Console CTR review; improve weak titles/descriptions | [ ] | Ongoing |

---

## Recommended sprint order

| Sprint | Focus | Outcome |
|--------|-------|---------|
| **Sprint 1** ✅ | Phase 0 + Phase 1 wiring | Real meta and schema on every template |
| **Sprint 2** | Phase 0.6 + 1.9 + Phase 2.1–2.4 + Phase 3.1–3.4 | llms files + crawl hygiene + validation |
| **Sprint 3** | Phase 2.5–2.8 + Phase 3.5–3.7 | Content templates + performance baseline |
| **Launch** | Phase 4 | Go live, monitor, iterate |

---

## Key files

| File | Role |
|------|------|
| `src/components/Seo.jsx` | Helmet meta + OG/Twitter + JSON-LD |
| `src/lib/seo.js` | Schema builders, robots helpers |
| `src/lib/page-seo.js` | Per-route meta/schema assembly |
| `src/config/site.js` | Route definitions, schema types, fallbacks |
| `scripts/generate-seo-assets.mjs` | sitemap, robots, llms generation |
| `scripts/prerender.mjs` | Static HTML for crawlers |
| `.env` | `VITE_ALLOW_INDEXING`, `VITE_SITE_URL` |

---

## Change log

- 2026-06-04: Initial phased roadmap
- 2026-06-19: Added prerender on Vercel, noindex testing flag
- 2026-06-19: Sprint 1 — `page-seo.js`, loader meta fetch, schema fixes on all main routes
- 2026-06-19: Expanded to SEO / GEO / AEO / LLMS checklist
