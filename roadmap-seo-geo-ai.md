# SEO, GEO, and AI Optimisation Roadmap

Status: Active
Primary domain target: https://simplr.co.za
Priority direction: GEO and AI optimisation first, then deep technical SEO hardening.

## Quick Access

- Main roadmap file: roadmap-seo-geo-ai.md
- Supporting overview: readme.md
- SEO asset generator: scripts/generate-seo-assets.mjs
- Crawl assets:
  - public/sitemap.xml
  - public/robots.txt
  - public/llms.txt
  - public/llms-full.txt

## How To Use This Roadmap

- Status legend:
  - [ ] Not started
  - [~] In progress
  - [x] Done
- Effort legend:
  - S = 0.5 to 1 day
  - M = 1 to 3 days
  - L = 3+ days
- Update rule: when starting work, mark item [~] and add owner/date in the Sprint Board.
- Review cadence: revisit weekly and re-order by business impact.

## Sprint Board (GEO/AI First)

| Priority | Item                                                                            | Effort | Status | Owner | Target Sprint |
| -------- | ------------------------------------------------------------------------------- | ------ | ------ | ----- | ------------- |
| P1       | Expand llms-full.txt with route purpose summaries and machine-readable entities | M      | [ ]    | TBD   | Sprint 1      |
| P1       | Schema audit and fixes for home/services/work/thinking route types              | M      | [ ]    | TBD   | Sprint 1      |
| P1       | Thinking article template for answer-first intro and explicit entities          | M      | [ ]    | TBD   | Sprint 1      |
| P1       | GEO manual QA pack (prompt set + citation scoring sheet)                        | S      | [ ]    | TBD   | Sprint 1      |
| P2       | Sitemap lastmod support for static and dynamic routes                           | M      | [ ]    | TBD   | Sprint 2      |
| P2       | CI guardrail: fail on localhost URLs in crawl assets                            | S      | [ ]    | TBD   | Sprint 2      |
| P2       | CI guardrail: internal link check and report                                    | M      | [ ]    | TBD   | Sprint 2      |
| P2       | Canonical/trailing slash policy lock and consistency pass                       | S      | [ ]    | TBD   | Sprint 2      |
| P3       | Evaluate pre-render or SSR for top value routes                                 | L      | [ ]    | TBD   | Sprint 3      |

## Recommended Execution Order (Next 2 Weeks)

1. llms-full entity and route summary upgrade.
2. Schema audit plus route-level fixes.
3. Thinking and case-study content template hardening.
4. GEO QA prompt pack and baseline run.
5. Add CI checks for localhost and link integrity.
6. Add sitemap lastmod and canonical policy pass.

## Goals

- Make site content easy for search engines and AI systems to discover, parse, cite, and trust.
- Preserve current motion-rich UX while improving crawlability and index reliability.
- Build repeatable quality checks so regressions are caught during development.

## Completed Baseline (Done)

- [x] Production-safe default site URL updated to simplr.co.za in config.
- [x] Sitemap generator aligned with real dynamic route structure:
  - Work singles: /work/:slug
  - Thinking singles: /thinking/:topic/:slug
- [x] SEO asset generation hardened to support relative GraphQL endpoint setups.
- [x] Crawl assets regenerated with production domain:
  - robots.txt
  - sitemap.xml
  - llms.txt
  - llms-full.txt

## Phase 1: GEO and AI Optimisation (Do First)

### 1. AI Discoverability and Citation Readiness

- [ ] Expand llms-full.txt with stronger content summaries by section and route purpose.
- [ ] Add a concise "facts and entities" section (brand, services, location, capabilities, contact) for machine extraction.
- [ ] Ensure all key service/work/thinking pages have clear, non-ambiguous H1 and intro summaries.
- [ ] Add editorial guidance for writing answer-first intros that improve LLM snippet quality.

### 2. Structured Data for AI + Search Understanding

- [ ] Audit schema coverage route by route (home, services, service single, work single, thinking single).
- [ ] Strengthen Article schema for thinking entries (author, datePublished, dateModified, image, canonical consistency).
- [ ] Add/verify Service schema on service pages and Organization consistency across all routes.
- [ ] Validate rich results using Google Rich Results Test and Schema Markup Validator.

### 3. Content Architecture for Retrieval

- [ ] Create content templates for thinking posts that enforce:
  - Summary paragraph near top
  - Clear section headings
  - Explicit terms and entities
- [ ] Create case study template with measurable outcomes fields (challenge, approach, result).
- [ ] Add internal links from summary/list pages to priority conversion pages.

### 4. AI-Focused QA

- [ ] Add a quarterly manual GEO audit:
  - Ask top AI assistants targeted brand/service questions
  - Record whether responses cite correct pages and facts
  - Patch weak pages with clearer summaries/entities

## Phase 2: Technical SEO Hardening

### 1. Crawl and Index Hygiene

- [ ] Ensure sitemap includes all intended indexable dynamic URLs (including service singles if required).
- [ ] Add optional lastmod support to sitemap output.
- [ ] Add CI check that fails build if sitemap/robots/llms contain localhost URLs.
- [ ] Add CI check for broken internal links.

### 2. Rendering Strategy Improvements

- [ ] Evaluate pre-render or SSR for high-value routes:
  - /
  - /services
  - /work
  - /thinking
  - Top N work/thinking singles
- [ ] Compare LCP, crawl rendering reliability, and deployment complexity before committing.

### 3. Metadata and Canonical Consistency

- [ ] Verify canonical URL format consistency (trailing slash policy).
- [ ] Ensure one clear canonical per route variant.
- [ ] Audit Open Graph and Twitter image consistency for social previews.

### 4. Performance and Core Web Vitals

- [ ] Establish Lighthouse baseline for mobile and desktop.
- [ ] Optimise largest above-the-fold media per template.
- [ ] Review JS and animation cost on first load for key landing routes.

## Phase 3: Launch and Post-Launch Operations

### Pre-Launch

- [ ] Verify production env vars and regenerate crawl assets in CI.
- [ ] Submit sitemap in Google Search Console and Bing Webmaster Tools.
- [ ] Run final schema/canonical/crawlability pass on staging domain.

### First 30 Days Post-Launch

- [ ] Weekly index coverage check (submitted vs indexed URLs).
- [ ] Weekly crawl error and redirect chain review.
- [ ] Review query impressions for service and case-study intent.
- [ ] Patch weak CTR pages with improved title and description copy.

## Nice-to-Have Enhancements

- [ ] Add route-level content freshness indicators where editorially appropriate.
- [ ] Add OG image automation for dynamic entries.
- [ ] Add editorial checklist to CMS workflow for SEO + GEO quality gates.

## Working Notes

- This roadmap is intended as a living checklist.
- Update checkboxes as items are completed.
- Re-prioritise every sprint based on performance, indexing, and business goals.

## Change Log

- 2026-06-04: Initial phased roadmap created.
- 2026-06-04: Added Sprint Board with effort sizing and next-2-weeks execution order.
