# Wood Wiz

**Live: <https://woodwiz.sheetsolved.com>**

Ranks South African firewood vendors by **rand per kilogram**, with delivery costs and stock status surfaced up front.

Comparison is always **within a city**: each city page ranks the vendors delivering to that doorstep against each other. The site never ranks one city against another — Cape Town bulk is cheaper than Gauteng's mostly because it is nearer the source, which is useless to someone buying in Johannesburg.

Routes:

- **`/`** — city picker. Vendor and product counts only, deliberately no prices: a per-kg figure beside another city's would invite exactly the comparison the site doesn't make.
- **`/[region]`** (`/cape-town`, `/johannesburg`) — paginated price list (10/page, adjustable to 100). Filter by wood type (kameeldoring, blue gum, etc.), vendor, intended use (braai, fireplace, smoking), total budget, and minimum bulk weight. Facet counts update live as you filter, so you always see how many products match the *other* axes you haven't picked yet. On phones and tablets the filters are a bottom-sheet drawer; from `lg` up they're a sticky sidebar.
- **`/[region]/vendors`** — vendor comparison for that city: cheapest typical (median) price per kg, most species variety, most sales running right now, and a per-vendor breakdown with delivery and stacking info. Stats are computed from that city's slice only.
- **`/faq`** — the methodology: how per-kg is computed, what `~est` means, how delivery-zone variants are handled, how fresh the data is, and who runs the site.

Data is scraped daily from each vendor's storefront and committed to `data/products.json`. The Next.js front-end reads that file directly — no database required. Every route is statically prerendered, so a data commit is what triggers the redeploy that publishes new prices.

The site is installable to a home screen as a PWA (manifest, generated icons, standalone display). There is deliberately no service worker — a cache layer over daily-refreshed prices would risk showing stale numbers.

## Vendors covered (10)

| Vendor | Cities | Platform | Site |
| --- | --- | --- | --- |
| Mother City Firewood | Cape Town | Shopify | mothercityfirewood.co.za |
| The Wood Gurus | Cape Town | Shopify | thewoodgurus.co.za |
| Cape Town Firewood (CTF) | Cape Town | Shopify | capetownfirewood.co.za |
| The Firewood Company | Cape Town | WooCommerce | thefirewoodcompany.co.za |
| The Fire Man | Cape Town | WooCommerce | thefireman.co.za |
| Lancehoudt | Cape Town | WooCommerce | lancehoudt.co.za |
| Namibian Hardwood | Cape Town | WooCommerce | namibianhardwood.co.za |
| The Wood Bros | Cape Town | Wix (sitemap + meta) | thewoodbros.co.za |
| Just Get Wood | Johannesburg | WooCommerce | justgetwood.co.za |
| Stompies | Cape Town + Johannesburg | WooCommerce | stompieswood.com |

`Vendor.regions` is a list because Stompies genuinely delivers to both metros from one storefront. Their catalogue and prices are identical on each city page — what differs is who they sit beside.

### Cities

Cities live in `src/lib/regions.ts`. Adding one is a data edit: `/[region]` derives its static params from that registry, and the routes, sitemap, navigation and copy follow.

A city earns an entry once it has vendors publishing a machine-readable catalogue — the bar the FAQ states publicly. **Durban and the Garden Route are deliberately absent.** As of 2026-09-04, KZN firewood retail is Gumtree and Facebook Marketplace listings with no per-vendor catalogue, and the Garden Route reduces to a single vendor, which is a listing rather than a comparison. Both were requested; neither ships until that changes.

## Running locally

```powershell
npm install
npm run scrape   # populate data/products.json (~60-90s)
npm run dev      # http://localhost:3000
```

`npm run scrape` runs every vendor scraper, normalizes results to a price-per-kg figure, and writes `data/products.json`. The dev server reads that file at request time, so re-running `scrape` and refreshing is enough — no rebuild needed. In production it's read at build time instead, since every route prerenders to static HTML.

Other scripts:

```powershell
npm run lint
npm run typecheck
npm test          # vitest: normalisation, scraper helpers, sanity gate, install eligibility
npm run test:visual   # playwright: layout invariants in a real browser
```

### Visual regression

`tests/visual.spec.ts` loads every route in Chromium at 375, 768 and 1440 px in
both colour schemes and asserts two things: the document never scrolls
sideways, and no element overflows the box it sits in.

This exists because markup review cannot find layout bugs. Adding the city
switcher pushed the mobile nav to 456 px inside a 375 px viewport, so all four
city pages scrolled sideways on a phone — the HTML was valid and every class
was plausible. Only a real layout engine at a real width shows it. The suite
was checked against that regression: reintroduce it and eight assertions fail,
naming the routes and the width.

The suite builds and serves the app against `tests/fixtures/products.json`
rather than the live catalogue, via `WOOD_WIZ_DATA=fixture` (see
`src/lib/load-products.ts` — a flag rather than an env var holding a path,
because a non-literal path defeats Turbopack's file tracing and pulls the whole
project into the server output). The scrape rewrites `data/products.json` every
morning, so anything asserted against real data would be stale by breakfast.
The fixture is a curated 53-product subset carrying each state the UI can
render: price ranges, estimated weights, sale badges, out-of-stock, long
titles, and both metros.

**Pixel diffs are a local tool, not a CI gate.** `npm run test:visual:baseline`
writes screenshots for your platform and `npm run test:visual:pixel` compares
against them — useful either side of a CSS refactor to see whether anything
moved. The baselines are gitignored: Playwright stores them per platform, so a
Windows-authored set is unusable on the Linux runner, and the design still
moves enough that committed baselines would mostly report intended changes.
Making them a real CI gate means generating the Linux set on the runner once
and committing it; that is a deliberate choice, not an oversight.

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

```text
src/
  app/
    layout.tsx               # Nav, footer, install banner, <main> landmark, skip link
    page.tsx                 # City picker (server component, counts only)
    [region]/page.tsx        # Price browser for one city (server component)
    [region]/vendors/page.tsx # Vendor comparison for one city
    faq/page.tsx             # Methodology / trust page
    manifest.ts              # Web app manifest (PWA install)
    robots.ts                # Crawl policy; preview builds refuse indexing
    sitemap.ts               # Six routes, dated from the catalogue
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
    site.ts                  # SITE_URL / IS_PRODUCTION, read by metadata + sitemap + robots
    install-app.ts           # DOM-free PWA install eligibility rules
    use-install-app.ts       # Client hook wrapping beforeinstallprompt
tests/
  visual.spec.ts             # Playwright: layout invariants + opt-in pixel diffs
  fixtures/products.json     # Frozen catalogue so screenshots don't churn daily
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
  test.yml                   # Lint, typecheck, unit tests, layout invariants, audit gate
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

| | |
| --- | --- |
| Live | <https://woodwiz.sheetsolved.com> |
| Custom domain | `woodwiz.sheetsolved.com`, CNAME at GoDaddy |
| Project | `wood-wiz` |
| Linked repository | `ces0491/wood-wiz` |
| Production branch | `main` |
| Framework preset | Next.js (auto-detected) |
| Root directory | repository root |
| Environment variables | none required; one optional, below |

```powershell
git init -b main
git add .
git commit -m "init: wood-wiz"

gh repo create wood-wiz --private --source=. --remote=origin --push
# or, if not using gh: create the repo on github.com, then:
#   git remote add origin git@github.com:<you>/wood-wiz.git
#   git push -u origin main

# Then in Vercel: import the repo at vercel.com/new and deploy.
```

The GitHub Actions workflow needs `contents: write` permission to push the refreshed `products.json`. This is already declared in `.github/workflows/scrape.yml`, but you also need to enable it under **Settings → Actions → General → Workflow permissions → Read and write permissions**.

### Custom domain

The site is served from `woodwiz.sheetsolved.com`, a subdomain of an apex registered at GoDaddy — the same arrangement as `rtp.sheetsolved.com`. Two halves, and both have to be done:

1. **Attach the domain to the Vercel project.** Either the dashboard (**Settings → Domains**) or:

   ```powershell
   vercel domains add woodwiz.sheetsolved.com wood-wiz --scope cesaires-projects
   ```

2. **Add the DNS record at GoDaddy**, under **DNS → Manage Zones → sheetsolved.com**:

   | Type | Name | Value | TTL |
   | --- | --- | --- | --- |
   | `CNAME` | `woodwiz` | `699a8d2e4d18bcd2.vercel-dns-017.com` | 1/2 hour |

The CNAME target is issued per domain, not per account — `rtp.sheetsolved.com` points at a different hostname under the same Vercel team. Don't copy one across; read the current value back with:

```powershell
vercel domains verify woodwiz.sheetsolved.com --project wood-wiz --scope cesaires-projects
```

The `records` array in that output is the record to create, field for field. `cname.vercel-dns.com` is listed as a rank-2 fallback and also works, but the ranked-1 hostname is the one to use.

The **Value** must be that target, not the subdomain again — a `CNAME` with the same name and value points at itself and resolves to nothing. `nslookup woodwiz.sheetsolved.com 8.8.8.8` should answer with the `vercel-dns` hostname as an alias; `Non-existent domain` means the record hasn't saved or hasn't propagated.

Propagation is usually minutes. Vercel issues the certificate on its own once the record resolves; the domain shows "Invalid Configuration" until then, which is expected rather than a fault.

### The origin a deployment advertises

`src/lib/site.ts` resolves it once, and the metadata base, the sitemap and the robots policy all read it — three files naming different hosts would publish canonical URLs, a sitemap and a crawl policy that disagree.

| Where | Origin |
| --- | --- |
| Production | `https://woodwiz.sheetsolved.com` |
| Preview | that deployment's own `VERCEL_URL` |
| Local | `http://localhost:3000` |

`NEXT_PUBLIC_SITE_URL` overrides all three and is the one environment variable the project takes. It is optional; set it only for a deployment that genuinely serves somewhere else.

`robots.txt` and `sitemap.xml` are generated from the same value. A preview build disallows crawling outright — it serves production's content on another hostname, which competes with production for the same queries — so only production emits an `Allow` and a `Sitemap` line. The sitemap dates the picker and the per-city pages from the catalogue's `generatedAt` and leaves `/faq` undated, since hand-written copy doesn't change when a price does.

**`wood-wiz.vercel.app` 308s to the custom domain**, via a host-matched redirect in `next.config.ts`. Vercel keeps answering on a project's generated alias after a custom domain is attached, and until 2026-09-04 the alias served the whole site — two hostnames with identical content, splitting whatever authority the pages earn. The `has` clause matches that exact alias, so preview deployments on their own generated hostnames are untouched and go on serving themselves for review.

**Every page sets its own `alternates.canonical`**, rather than the root layout setting one for all of them. A layout-level canonical is inherited by any page that doesn't override it, so a page added without one would quietly claim to be the home page — and a wrong canonical costs that page its indexing, where a missing one merely fails to consolidate. `/` and `/faq` went without canonicals until 2026-09-04 for exactly this reason: only the two `[region]` routes had ever set them.

Note that a `CNAME` **file** in the repository does nothing here. That is a GitHub Pages mechanism, which is how `rbr.sheetsolved.com` is wired; Vercel reads its domains from project settings.

### Dependency updates

`next` and `eslint-config-next` are pinned to an exact version rather than a
caret range — the framework moves fast and this is a live site, so a version
change should be a commit someone reviewed. Everything else takes a caret.

`npm audit --audit-level=high` is a CI gate, in its own job in `test.yml` so a
dependency advisory and a test failure show as two distinct red marks rather
than one hiding the other. It reads `package-lock.json` and needs no install,
so it answers in seconds.

The threshold is **high**, and dev dependencies are deliberately in scope (no
`--omit=dev`): the scrape job holds `contents: write`, reaches eight
third-party sites, and what it commits deploys itself, so a compromised build
tool is a real path to the live site. A moderate advisory in a build-time
transitive shouldn't block a 03:00 price refresh, though, so those surface at
review rather than as a failure.

When it fires, check whether the advisory reaches anything the site actually
does before reaching for `--force`: this is static HTML on a CDN with no Server
Actions, no middleware, no custom server and no `next/image`, so most Next
advisories describe surfaces that don't exist here. Patch anyway — "we don't
use that feature" expires the moment someone adds a Server Action — but that
context decides whether it is urgent.

If an advisory lands with no published fix, the gate blocks with nothing to do
about it. The escape hatch is an `overrides` entry in `package.json` pinning
the patched transitive, or raising the threshold in a commit that says why —
not deleting the gate.

### Lockfile sync (Windows contributors)

`.github/workflows/lockfile.yml` regenerates `package-lock.json` on the Linux CI runner whenever `package.json` or the lockfile change on a push or PR, and auto-commits any drift back to the branch. This exists because npm on Windows skips wasm32-targeted optional deps (e.g. `@tailwindcss/oxide-wasm32-wasi`, `@unrs/resolver-binding-wasm32-wasi`) and their transitive deps (`@emnapi/core`, `@emnapi/runtime`), producing a lockfile that fails `npm ci` on Linux with `Missing: @emnapi/runtime from lock file`. Letting CI own the lockfile means Windows contributors never have to think about it — just push and pull.

Both workflows fire on the same push, so `Test` runs `npm ci` against the Windows-shaped lockfile and fails seconds before the sync lands. The sync commit is pushed with `GITHUB_TOKEN`, which by GitHub's design triggers no further runs, so nothing would re-run the job it just repaired — the sync job therefore dispatches `test.yml` itself, and `test.yml` carries `workflow_dispatch` for that. Expect one red `Test` immediately after a dependency change from Windows, followed by a green dispatched run. `npm install --package-lock-only --os=linux --cpu=x64` does **not** avoid it: it reshapes the lockfile but still omits `@emnapi/core` and `@emnapi/runtime`, which are the packages `npm ci` complains about.

## Known limitations

- **Delivery prices are descriptive, not computed.** The vendor record stores a free-form description and (where known) a `freeOverZar` threshold and `stacking` flag. The UI shows the description on each card but doesn't compute a delivered total — most vendors price delivery by suburb at checkout.
- **Stacking flags only confirmed for two vendors.** `delivery.stacking` is explicitly set for Mother City Firewood (`free-over-threshold`) and Lancehoudt (`free`) — the only two whose product descriptions stated it. The other six are unset and render no stacking badge at all; the earlier "Stacking unconfirmed" badge was removed as UI noise, since a badge that says nothing still reads as a verdict.
- **Vendor ranking uses the median, never the mean.** CTF and Mother City Firewood sell premium smoking-chunk boxes at R 100–130/kg alongside bulk pallets at R 2–5/kg. The arithmetic mean ranks them as expensive (R 16–20/kg) even though their bulk product is cheap, so `/[region]/vendors` ranks and displays the median throughout — the word "average" is kept out of the headline UI on purpose. `avgPricePerKgZar` is still computed in `vendor-stats.ts` but isn't shown anywhere.
- **Medians rest on very different sample sizes.** The Wood Gurus normalise to a handful of products because most of their catalogue is a per-piece configurator, while Mother City Firewood contribute ~200. The bar charts print each vendor's product count beside their name, and the "cheapest typical price" spotlight skips vendors below `MIN_SPOTLIGHT_SAMPLE` (8) so a four-product median can't take the headline.
- **Regional price levels are not comparable, and the site doesn't try.** Cape Town bulk runs R 1–5/kg against Gauteng's R 4–11, driven mostly by distance from source. Rankings are scoped per city and `/` shows no prices. The sanity gate's R 1/kg floor and R 50/kg ceiling are still global, though, and were derived from Cape Town pricing — they hold for Gauteng today but should become per-region if a city with a very different price level is added.
- **The species table is coastal Western Cape–biased.** Rooikrans and Port Jackson are local invasives. `detectSpecies` returns `unknown` for anything unlisted, which silently applies the 800 kg/m³ default density to volume-priced listings. Gauteng vendors already surfaced this — Stompies' "Sekelbush" spelling needed an alias.
- **Combo/bundle products** (e.g. `Hout Bay Firewood Combo - Kameelhout & Rooipitjie`) classify as `unknown` species because they contain multiple woods. The price/kg is still computed and they show in "All" filters.
- **Eco logs, briquettes, charcoal, and wood pellets** are filtered out by the normaliser since they're processed wood rather than firewood. Edit `NON_FIREWOOD_PATTERNS` in `src/lib/normalize.ts` to change this.
- **Big-box retailers** (Makro, Builders, Takealot) are not yet scraped. Their firewood SKUs need manual product-page verification first.
- **Turbopack file watcher can desync on Windows + OneDrive paths.** Symptom: dev server keeps serving stale compiled output even after source edits; all routes start returning 404. Fix: kill the dev server, delete `.next/`, restart. If it recurs frequently, run `next dev --no-turbopack` (slower but uses Webpack's more robust file watcher), or move the project off OneDrive.
