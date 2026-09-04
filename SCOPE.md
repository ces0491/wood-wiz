# Wood Wiz — SCOPE

## What this is

A public, independent comparison of South African firewood vendors, normalised to rand per kilogram, so buyers can find the best value for their budget without spreadsheets.

Comparison is always **within a city**. Each city page ranks the vendors who deliver to that doorstep against one another; the site never ranks one city against another. Cape Town bulk wood is cheaper than Gauteng's largely because it is nearer the source, which tells a Johannesburg buyer nothing about which of their options is good value.

## What "done" means

Done is observable, not eternal. The criteria below are the pass/fail bar for declaring the project "v1 — public utility shipped". Each item is binary and verifiable.

### Data quality

- [x] `extractWeight()` and `detectSpecies()` have unit tests covering each regex branch and a representative accessory-rejection set. (138 tests across `normalize.test.ts` and `shared.test.ts`.)
- [x] Post-scrape sanity check fails the CI scrape job if (a) any normalised product reports per-kg > R 50 without specialty-product exemption, (b) total product count drops by more than 40% between consecutive runs, or (c) any vendor reports > 10 raw items but normalises to 0. Found and fixed 8 misparsed Namibian Hardwood titles on first run.
- [ ] For any product spot-checked against its live vendor page, the published total price matches within 24 hours of the last refresh, or the discrepancy is documented in the FAQ.
- [ ] At least 8 vendors covered in the founding city (Cape Town), with daily auto-refresh confirmed by the `scrape.yml` workflow. A second city ships when it has enough vendors to be a comparison rather than a listing — Johannesburg is live with 2 and is explicitly not there yet.

### Trust signals

- [ ] Methodology documented in `/faq`, including weight estimation, variable-product range display, and known limitations.
- [x] Uncertainty visible in the UI: `~est` tag for inferred weights, full price range for variable products. The "Stacking unconfirmed" badge has been removed from the UI — stacking badges only appear when the vendor's behaviour is positively confirmed.
- [ ] No affiliate links and no paid placement. Vendor ranking is purely metric-based.
- [x] About section with maintainer name, motivation, and contact (GitHub issues). Lives as the "Who runs this" section on `/faq` with four entries covering identity, no-affiliate disclosure, contact path, and vendor-correction process.
- [ ] One-time email to each listed vendor announcing the listing with a clearly-stated opt-out path; replies tracked in GitHub issues. **Template drafted at `docs/vendor-announcement.md`; emails still need to be sent (your task).**

### User experience

- [x] Vendor-level statistics use median per-kg (not mean) so vendors selling both bulk pallets and small specialty items aren't ranked as expensive by outlier pricing. The word "average" does not appear in the headline UI — spotlights and breakdown cards say "typical" or "median". Product-level sorting on `/` ranks by each product's own per-kg, which is the cheapest variant for products with delivery-zone ranges; this is consistent across pages because it's a product-level metric, not a vendor-level one.
- [x] Mobile interaction: opening filters does not push results more than two screen-heights down. The filter panel is now a bottom-sheet drawer at `< lg` viewports with a backdrop, Escape-to-close, body-scroll lock, and an X close button; on `lg+` it remains the sticky sidebar.
- [ ] Lighthouse accessibility score ≥ 90 on `/`, `/vendors`, and `/faq`. (Implemented: skip-to-content link, `aria-current` on active nav link and pagination, `aria-label`s on icon-only buttons, `aria-expanded`/`aria-controls` on the mobile Filters toggle. Lighthouse audit still needs to be run.)
- [x] Open Graph image, favicon variants, and a proper page title on every route. (`src/app/opengraph-image.tsx`, `src/app/icon.tsx`, `src/app/apple-icon.tsx`, per-page Metadata on /vendors and /faq.)

### Operational

- [ ] Daily scrape runs on a schedule; vendor failures are isolated and surfaced in the UI on the next page render.
- [x] Own domain (not the Vercel preview URL). Live at `woodwiz.sheetsolved.com` — a GoDaddy CNAME on the sheetsolved.com apex pointing at Vercel, matching `rtp.sheetsolved.com`. Certificate issued, all three routes serving. `SITE_URL` in `src/lib/site.ts` is the single origin the metadata, sitemap and robots policy all read.
- [x] Vercel Analytics enabled with at least one custom event (outbound vendor click). Every "Buy at vendor" link, vendor-name link, and cheapest-product link routes through `TrackedLink` and fires a `vendor_click` event with `vendor`, `product`, and `source` properties (product-title, buy-button, spotlight, vendor-card-name, vendor-card-cheapest). **Analytics dashboard needs to be enabled in Vercel project settings to capture them.**
- [x] CI green on every push to main: typecheck, lint, normalisation tests. (`.github/workflows/test.yml`)

## What is explicitly out of scope

These are decisions, not deferrals. We explicitly will **not** do:

- **Affiliate programs, paid placement, or vendor-sponsored ranking adjustments.** Ranking is metric-based, always.
- **Checkout, cart, or payments.** Users buy on the vendor's site.
- **User accounts, saved searches, or price alerts.** Anonymous browsing only.
- **Real-time prices.** Daily refresh is sufficient; the vendor's site is always authoritative for exact pricing at purchase time.
- **Computed delivered totals.** Vendors price delivery by suburb at checkout; we surface their stated rule and let the user factor it in.
- **Cross-city price comparison.** Prices are compared within a city, never between them. Distance from source dominates the difference, so a national ranking would read as a verdict on vendors when it is a fact about geography. The `/` picker deliberately shows no prices.
- **A city without enough vendors to compare.** A city page needs vendors with a public, machine-readable catalogue — the same bar the FAQ states. As of 2026-09-04 Durban and the Garden Route fail it: KZN firewood retail is Gumtree and Facebook Marketplace listings, and the Garden Route reduces to a single vendor. Both were requested and neither ships; a one-vendor page is a listing, not a comparison.
- **Native mobile apps.** Web only — no App Store or Play Store build, no React Native, no platform SDKs. The site is installable to a home screen as a PWA (web app manifest, generated icons, standalone display); that is still the same web page, deliberately with no service worker so a cache layer can never serve stale prices.
- **Charcoal, briquettes, eco logs, kindling, accessories.** Filtered out by the normaliser; not in the catalogue we publish.
- **Vendor-managed listings.** Vendors don't edit the site; corrections route through GitHub issues.
- **Historical price tracking, sparklines, or trend charts.** v2 candidate; not this version.

## The bar

**Production.** Tests, sanity checks, accessibility, documented methodology, predictable refresh cadence, transparent uncertainty. Bugs in the live site are credibility-eroding events; we treat them that way.

This is **not** a POC (we have a public URL and real users), nor a throwaway (the trust-building is months of work), nor a research script (we ship to real people), nor a library (one frontend, no public API).

## Who decides

**Cesaire Tobias (ces0491)** is the sole maintainer and decision-maker on scope, vendor inclusion, methodology disputes, and feature priority.

Vendor or user disputes route to [GitHub Issues](https://github.com/ces0491/wood-wiz/issues). Significant scope changes are recorded by editing this file.

## Status

This document is updated when any of the above changes. Reviewed at least quarterly. Last updated: 2026-09-04.

- Narrowed the “mobile apps” exclusion to native apps, recording the PWA install decision.
- **Multi-city, reversing the “Cape Town only” exclusion.** The site now covers Cape Town (9 vendors) and Johannesburg (2), on per-city routes at `/[region]`. Durban and the Garden Route were requested at the same time and are not shipping, for the reason given under “out of scope” above. What replaces the old exclusion is a narrower one: no cross-city comparison, and no city that can't sustain a comparison.
