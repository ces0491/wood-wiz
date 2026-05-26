# Wood Wiz

Ranks firewood from Cape Town vendors by **rand per kilogram**, with delivery costs and stock status surfaced up front. Filter by wood type (kameeldoring, blue gum, etc.) and by intended use (braai, fireplace, smoking).

Data is scraped daily from each vendor's storefront and committed to `data/products.json`. The Next.js front-end reads that file directly — no database required.

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
npm run scrape   # populate data/products.json (~30s)
npm run dev      # http://localhost:3000
```

`npm run scrape` runs every vendor scraper, normalizes results to a price-per-kg figure, and writes `data/products.json`. The dev server reads that file at request time, so re-running `scrape` and refreshing is enough — no rebuild needed.

## How "ceteris paribus" pricing works

Vendors sell in incompatible units — 18 kg bags, 500-piece bundles, 1-ton pallets, half-bakkie loads. The normaliser brings everything to **R/kg**:

1. If the listing states a weight directly (`18kg`, `100kg bag`, `20x20kg`), use it.
2. If only piece-count is listed (`500 Pieces`), estimate at ~1.5 kg per split piece.
3. If only volume is listed (`0.5 m³`, `50L`), multiply by the species' air-dry density from `src/lib/wood-species.ts`.
4. Composite formats like `40x Bags` look up the unit weight elsewhere in the title (e.g. `20KG Bags`).
5. `Nx Bags`, `N ton`, and similar wholesale formats are explicitly handled.

Any product whose weight had to be inferred (cases 2–3) is flagged `weightEstimated: true` and displayed with a `~est` tag in the UI. Cases 1, 4, and 5 are treated as vendor-stated and shown without a flag.

Densities used are mid-range air-dry estimates from general wood-science references — see `src/lib/wood-species.ts` for the full table and the species → braai/fireplace/smoking usage mapping.

## Architecture

```
src/
  app/
    layout.tsx, page.tsx     # Next.js 16 App Router. page.tsx loads data
    globals.css              # Tailwind v4
  components/
    ProductBrowser.tsx       # Client component: filters, sort, list
  lib/
    types.ts                 # Product, Vendor, ScrapedProduct, ProductsFile
    wood-species.ts          # Density table + alias detection + usage map
    vendors.ts               # Vendor registry + delivery rules
    normalize.ts             # Raw scrape → normalized Product (price/kg)
    load-products.ts         # Server-side JSON loader
scripts/
  scrape-all.ts              # Orchestrator: runs every scraper, writes JSON
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
  products.json              # Output of `npm run scrape`; ~500 products
.github/workflows/
  scrape.yml                 # Daily cron at 03:00 UTC, commits refreshed JSON
```

## Adding a new vendor

1. Add a `Vendor` entry to `src/lib/vendors.ts` (id, name, url, platform, delivery rule).
2. Create `scripts/scrapers/<vendor-id>.ts` exporting `{ vendorId, scrape(): Promise<ScrapedProduct[]> }`. For Shopify/WooCommerce sites you can usually just call `scrapeShopify(vendorId, "https://store")` or `scrapeWooCommerce(...)`.
3. Import and add it to the `SCRAPERS` array in `scripts/scrape-all.ts`.
4. `npm run scrape` to verify it produces sensible products. Check the cheapest/most expensive items — extreme outliers usually mean a weight-parsing miss.

For non-Shopify/WooCommerce sites, look for JSON-LD Product schema, OpenGraph `product:price:amount`, or a public store API before falling back to HTML scraping. The Wix scraper (`wood-bros.ts`) is a worked example of meta-tag extraction.

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

## Known limitations

- **Delivery prices are descriptive, not computed.** The vendor record stores a free-form description and (where known) a `freeOverZar` threshold. The UI shows the description on each card but doesn't compute a delivered total — most vendors price delivery by suburb at checkout.
- **Region is Cape Town only.** Vendor registry has `region: "cape-town"` baked in. Adding Johannesburg/Durban would mean a region selector + filtering vendors by region.
- **Combo/bundle products** (e.g. `Hout Bay Firewood Combo - Kameelhout & Rooipitjie`) classify as `unknown` species because they contain multiple woods. The price/kg is still computed and they show in "All" filters.
- **Eco logs, briquettes, charcoal, and wood pellets** are filtered out by the normaliser since they're processed wood rather than firewood. Edit `NON_FIREWOOD_PATTERNS` in `src/lib/normalize.ts` to change this.
- **Big-box retailers** (Makro, Builders, Takealot) are not yet scraped. Their firewood SKUs need manual product-page verification first.
