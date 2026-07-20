# Simplr 2026 Site: Page Schemas

Generated 2026-07-20 from the staging site (simplr-2026-4u3th.kinsta.page). All URLs use the production domain https://simplr.co.za. 62 files: `_organisation.json`, 12 core pages, 41 work pages, 8 thinking articles. Privacy policy skipped (legal page, no schema needed).

`@id` conventions match what the new frontend already outputs (`https://simplr.co.za#organization`, `#website`), so these files interoperate with or can replace the baked-in schema.

## Things to fix on the site itself (found while crawling, not fixable from here)

1. **Fake phone number in the live org schema.** The frontend renders `telephone: +44 20 7946 0958` (a fictional UK number) on every page. Removed in `_organisation.json`; the frontend build needs the same fix.
2. **Placeholder sameAs.** Live schema links to bare `instagram.com` and `linkedin.com`. Corrected here with the real profile URLs.
3. **Scaffold text still live.** Every page's meta description is the dev string "Simplr headless WordPress scaffold with Vite, React...". About page schema description is "Fokkol", Services is "Also Fokol". The est-2014 page title is a scaffold note. All need real content before launch.
4. **robots is noindex,nofollow.** Correct for staging; must be lifted at launch.
5. **/site-map/ footer link returns 404.**
6. **Invalid schema type.** The live Services page uses `@type: "ServicesPage"`, which is not a schema.org type. These files use `CollectionPage`.

## Things I could not confirm (verify before launch)

- **Logo URL** in `_organisation.json` points to the current live site's WP uploads path. Swap to the new CMS logo asset once the production URL is known.
- **Article/media images** reference `simplrdashboard.kinsta.cloud` (the headless CMS domain). Assumed this stays after launch; update if the CMS domain changes.
- **Team roles.** The About page lists names and LinkedIn only, so Person schema has no jobTitle except the two founders. Bretta Russel-Espin has no LinkedIn link on the page.
- **Work datePublished values** come from the CMS post dates, which look like content-import dates rather than real project dates. dateModified (2026-07-18) is accurate per the CMS.
