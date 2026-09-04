# Wood Wiz

Ranks firewood from Cape Town vendors by **rand per kilogram**, with delivery costs and stock status surfaced up front.

Three pages:

- **`/`** — paginated price list (10/page, adjustable to 100). Filter by wood type (kameeldoring, blue gum, etc.), vendor, intended use (braai, fireplace, smoking), total budget, and minimum bulk weight. Facet counts update live as you filter, so you always see how many products match the *other* axes you haven't picked yet. On phones and tablets the filters are a bottom-sheet drawer; from `lg` up they're a sticky sidebar.
- **`/vendors`** — vendor comparison: cheapest typical (median) price per kg, most species variety, most sales running right now, and a per-vendor breakdown with delivery and stacking info.
- **`/faq`** — the methodology: how per-kg is computed, what `~est` means, how delivery-zone variants are handled, how fresh the data is, and who runs the site.

Data is scraped daily from each vendor's storefront and committed to `data/products.json`. The Next.js front-end reads that file directly — no database required. Every route is statically prerendered, so a data commit is what triggers the redeploy that publishes new prices.

The site is installable to a home screen as a PWA (manifest, generated icons, standalone display). There is deliberately no service worker — a cache layer over daily-refreshed prices would risk showing stale numbers.

## Vendors covered (8)

| Vendor | Platform | Site |
| --- | --- | --- |
| Mother City Firewood | Shopify | mothercityfirewood.co.za |
| The Wood Gurus | Shopify | thewoodgurus.co.za |
| Cape Town Firewood (CTF) | Shopify | capetownfirewood.co.za |
| The Firewood Company | WooCommerce | thefirewoodcompany.co.za |
| The Fire Man | WooCommerce | thefireman.co.za |
| Lancehoudt | WooCommerce | lancehoudt.co.za |
| Namibian Hardwood | WooCommerce | namibianhardwood.co.za |
| The Wood Bros | Wix (sitemap + meta) | thewoodbros.co.za |

## Running locally

```powershell
npm install
npm run scrape   # populate data/products.json (~60-90s)
npm run dev      # http://localhost:3000
```

`npm run scrape` runs every vendor scraper, normalizes results to a price-per-kg figure, and writes `data/products.json`. The dev server reads that file at request time, so re-running `scrape` and refreshing is enough — no rebuild needed. In production it's read at build time instead, since `/` and `/vendors` prerender to static HTML.

Other scripts:

```powershell
npm run lint
npm run typecheck
npm test         # vitest: normalisation, scraper helpers, sanity gate, install eligibility
```

### Testing from another device on your LAN

If you want to view the dev server from a phone or another machine, add the LAN IP to `next.config.ts` so Next 16 doesn't block dev resources cross-origin:

```ts
const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.100"], // your machine's LAN IP
};
```

Without this, the page HTML loads but React never hydrates — buttons render but onClick handlers don't fire.

## How "ceteris paribus" pricing works

Vendors sell in incompatible units — 18 kg bags, 500-piece bundles, 1-ton pallets, half-bakkie loads. The normaliser brings everything to **R/kg**:

1. If the listing states a weight directly (`18kg`, `100kg bag`, `20x20kg`), use it.
2. If only piece-count is listed (`500 Pieces`), estimate at ~1.5 kg per split piece.
3. If only volume is listed (`0.5 m³`, `50L`), multiply by the species' air-dry density from `src/lib/wood-species.ts`.
4. Composite formats like `40x Bags` look up the unit weight elsewhere in the title (e.g. `20KG Bags`).
5. Em-dash multi-pack format (`5KG Bags — 50 Bag`) is also parsed — this is what the Shopify scraper produces when it joins a parent product title with a variant title, and matters because the variant carries the pack count.
6. `Nx Bags`, `N ton`, and similar wholesale formats are explicitly handled.

For **WooCommerce variable products** (one product with per-zone or per-size variants), the scraper reads `prices.price_range.min_amount` — what the storefront actually displays — instead of the parent's `prices.price`, which is a stale default that doesn't correspond to any selectable variant. Without this, those products would surface as ghost cheap "Sale" prices below every real purchase option.

Any product whose weight had to be inferred (cases 2–3) is flagged `weightEstimated: true` and displayed with a `~est` tag in the UI. Cases 1, 4, 5, and 6 are treated as vendor-stated and shown without a flag.

Densities used are mid-range air-dry estimates from general wood-science references — see `src/lib/wood-species.ts` for the full table and the species → braai/fireplace/smoking usage mapping.

## Architecture

```
src/
  app/
    layout.tsx               # Nav, footer, install banner, <main> landmark, skip link
    page.tsx                 # Price browser (server component, loads data)
    vendors/page.tsx         # Vendor comparison (server component)
    faq/page.tsx             # Methodology / trust page
    manifest.ts              # Web app manifest (PWA install)
    icon.tsx                 # Favicon, generated via ImageResponse
    apple-icon.tsx           # iOS touch icon
    opengraph-image.tsx      # Social preview card
    pwa-icon/[variant]/      # 192 / 512 / maskable home-screen icons
    globals.css              # Tailwind v4
  components/
    SiteNav.tsx              # Top nav with active-route highlighting
    SiteFooter.tsx           # Footer with independence note + GitHub link
    ProductBrowser.tsx       # Client: facet filters, sort, pagination, filter drawer
    VendorComparison.tsx     # Server-rendered spotlights + CSS bar charts
    FAQ.tsx                  # Server-rendered accordion sections
    RefreshedAt.tsx          # Client: absolute stamp on the server, relative once hydrated
    TrackedLink.tsx          # Outbound <a> that fires the vendor_click event
    InstallBanner.tsx        # Client: dismissible "Add to Home Screen" bar
    ReturnToTop.tsx          # Client: scroll-to-top affordance
  lib/
    types.ts                 # Product, Vendor, ScrapedProduct, ProductsFile
    wood-species.ts          # Density table + alias detection + usage map
    vendors.ts               # Vendor registry + delivery rules + stacking flags
    normalize.ts             # Raw scrape → normalized Product (price/kg)
    vendor-stats.ts          # Per-vendor aggregates and comparison highlights
    format.ts                # Deterministic currency/weight/date formatters (SSR-safe)
    load-products.ts         # Server-side JSON loader
    install-app.ts           # DOM-free PWA install eligibility rules
    use-install-app.ts       # Client hook wrapping beforeinstallprompt
scripts/
  scrape-all.ts              # Orchestrator: runs every scraper, writes JSON
  sanity-checks.ts           # Build gate: price bounds, per-vendor yield, count drop
  scrapers/
    shared.ts                # Shopify (/products.json) + WooCommerce (/wp-json/wc/store/v1/products) helpers
    mother-city-firewood.ts  # Each scraper exports { vendorId, scrape() }
    wood-gurus.ts
    cape-town-firewood.ts
    firewood-company.ts
    fire-man.ts
    lancehoudt.ts
    namibian-hardwood.ts
    wood-bros.ts             # Wix: sitemap → per-page meta tag scrape
data/
  products.json              # Output of `npm run scrape`; ~480 products
.github/workflows/
  scrape.yml                 # Daily cron at 03:00 UTC, commits refreshed JSON
  test.yml                   # Lint, typecheck and unit tests on every push and PR
  lockfile.yml               # On package.json/lock changes: regenerate lockfile on Linux and auto-commit
```

## Adding a new vendor

1. Add a `Vendor` entry to `src/lib/vendors.ts` (id, name, url, platform, delivery rule).
2. Create `scripts/scrapers/<vendor-id>.ts` exporting `{ vendorId, scrape(): Promise<ScrapedProduct[]> }`. For Shopify/WooCommerce sites you can usually just call `scrapeShopify(vendorId, "https://store")` or `scrapeWooCommerce(...)`.
3. Import and add it to the `SCRAPERS` array in `scripts/scrape-all.ts`.
4. `npm run scrape` to verify it produces sensible products. Check the cheapest/most expensive items — extreme outliers usually mean a weight-parsing miss.

For non-Shopify/WooCommerce sites, look for JSON-LD Product schema, OpenGraph `product:price:amount`, or a public store API before falling back to HTML scraping. The Wix scraper (`wood-bros.ts`) is a worked example of meta-tag extraction.

### The sanity gate

`scripts/sanity-checks.ts` runs before anything is written, and a failure exits non-zero so the workflow leaves the previous `data/products.json` in place. It fails on:

- any product over R 50/kg without a small-specialty exemption (a misparse that looks expensive — a bag pretending to be a pallet);
- any product under R 1/kg at 50 kg or more (a non-firewood service that slipped past the accessory blocklist);
- a vendor returning more than 10 raw items but normalising to zero;
- a vendor normalising less than 15% of at least 20 raw items — the partial-breakage case, where a title format changes and most listings stop parsing while a few still do;
- the total product count dropping more than 40% against the previous run.

A new vendor whose catalogue legitimately sits under the yield floor needs an entry in `YIELD_OVERRIDES` with a comment saying why. The Wood Gurus are the existing case: most of their storefront is a per-piece "SELECT YOUR QUANTITY" configurator whose variants are dropped by design in `normalize.ts`.

## Adding a new species

Edit `src/lib/wood-species.ts` and add an entry with `aliases` (everything a vendor might write — Afrikaans names, English names, Latin name), `densityKgPerM3` (mid-range air-dry), and `usage` (`braai`, `fireplace`, `smoking`, or `both`). Also add the id to the `WoodSpecies` union in `src/lib/types.ts`.

## Deploy to Vercel

```powershell
git init -b main
git add .
git commit -m "init: wood-wiz"

gh repo create wood-wiz --private --source=. --remote=origin --push
# or, if not using gh: create the repo on github.com, then:
#   git remote add origin git@github.com:<you>/wood-wiz.git
#   git push -u origin main

# Then in Vercel:
# 1. Import the repo (vercel.com/new)
# 2. Framework preset: Next.js (auto-detected)
# 3. Deploy — no environment variables needed
```

The GitHub Actions workflow needs `contents: write` permission to push the refreshed `products.json`. This is already declared in `.github/workflows/scrape.yml`, but you also need to enable it under **Settings → Actions → General → Workflow permissions → Read and write permissions**.

### Lockfile sync (Windows contributors)

`.github/workflows/lockfile.yml` regenerates `package-lock.json` on the Linux CI runner whenever `package.json` or the lockfile change on a push or PR, and auto-commits any drift back to the branch. This exists because npm on Windows skips wasm32-targeted optional deps (e.g. `@tailwindcss/oxide-wasm32-wasi`, `@unrs/resolver-binding-wasm32-wasi`) and their transitive deps (`@emnapi/core`, `@emnapi/runtime`), producing a lockfile that fails `npm ci` on Linux with `Missing: @emnapi/runtime from lock file`. Letting CI own the lockfile means Windows contributors never have to think about it — just push and pull.

## Known limitations

- **Delivery prices are descriptive, not computed.** The vendor record stores a free-form description and (where known) a `freeOverZar` threshold and `stacking` flag. The UI shows the description on each card but doesn't compute a delivered total — most vendors price delivery by suburb at checkout.
- **Stacking flags only confirmed for two vendors.** `delivery.stacking` is explicitly set for Mother City Firewood (`free-over-threshold`) and Lancehoudt (`free`) — the only two whose product descriptions stated it. The other six are unset and render no stacking badge at all; the earlier "Stacking unconfirmed" badge was removed as UI noise, since a badge that says nothing still reads as a verdict.
- **Vendor ranking uses the median, never the mean.** CTF and Mother City Firewood sell premium smoking-chunk boxes at R 100–130/kg alongside bulk pallets at R 2–5/kg. The arithmetic mean ranks them as expensive (R 16–20/kg) even though their bulk product is cheap, so `/vendors` ranks and displays the median throughout — the word "average" is kept out of the headline UI on purpose. `avgPricePerKgZar` is still computed in `vendor-stats.ts` but isn't shown anywhere.
- **Medians rest on very different sample sizes.** The Wood Gurus normalise to a handful of products because most of their catalogue is a per-piece configurator, while Mother City Firewood contribute ~200. The bar charts print each vendor's product count beside their name, and the "cheapest typical price" spotlight skips vendors below `MIN_SPOTLIGHT_SAMPLE` (8) so a four-product median can't take the headline.
- **Region is Cape Town only.** Vendor registry has `region: "cape-town"` baked in. Adding Johannesburg/Durban would mean a region selector + filtering vendors by region.
- **Combo/bundle products** (e.g. `Hout Bay Firewood Combo - Kameelhout & Rooipitjie`) classify as `unknown` species because they contain multiple woods. The price/kg is still computed and they show in "All" filters.
- **Eco logs, briquettes, charcoal, and wood pellets** are filtered out by the normaliser since they're processed wood rather than firewood. Edit `NON_FIREWOOD_PATTERNS` in `src/lib/normalize.ts` to change this.
- **Big-box retailers** (Makro, Builders, Takealot) are not yet scraped. Their firewood SKUs need manual product-page verification first.
- **Turbopack file watcher can desync on Windows + OneDrive paths.** Symptom: dev server keeps serving stale compiled output even after source edits; all routes start returning 404. Fix: kill the dev server, delete `.next/`, restart. If it recurs frequently, run `next dev --no-turbopack` (slower but uses Webpack's more robust file watcher), or move the project off OneDrive.
