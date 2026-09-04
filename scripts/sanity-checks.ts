import { existsSync, readFileSync } from "node:fs";
import type { Product, ProductsFile } from "../src/lib/types";

// Sanity-check thresholds. See SCOPE.md > "Data quality".
export const SUSPECT_PRICE_PER_KG = 50;
// Below R 1/kg with a bulk-scale weight is almost certainly a non-firewood
// service that slipped past the accessory filter (e.g. "Garden Refuse Removal
// Service — 1 Ton Bakkie Load" sold at R 549). Legitimate bulk firewood
// bottoms out around R 1–2/kg.
export const FLOOR_PRICE_PER_KG = 1;
export const FLOOR_MIN_KG = 50;
export const COUNT_DROP_THRESHOLD = 0.6; // fail if new < old * this
// Titles matching this pattern are allowed to exceed SUSPECT_PRICE_PER_KG —
// these are legitimately-expensive small specialty products (smoking chunks,
// per-box gift items, etc.) whose per-kg price reflects packaging not value.
export const SPECIALTY_PATTERN = /\b(smoking|chunks|per\s*box|eco\s*log)/i;
export const SPECIALTY_MAX_KG = 10; // only allow specialty exemption for small packs

// Per-vendor normalisation yield: what fraction of a vendor's raw listings
// survive normalize(). The zero-yield check below only fires on a total
// wipeout, which misses the more likely failure — a vendor changing their
// title format so most listings stop parsing while a handful still do.
export const MIN_YIELD = 0.15;
export const MIN_YIELD_RAW_COUNT = 20; // too few raw items to read a ratio from

// Vendors whose catalogue legitimately normalises well below MIN_YIELD.
export const YIELD_OVERRIDES: Record<string, number> = {
  // The Wood Gurus' storefront is mostly a "SELECT YOUR QUANTITY" per-piece
  // configurator: dozens of variants that price a single split piece. Those
  // are dropped by design (see ABSOLUTE_MIN_PRICE_PER_KG and MIN_BULK_PIECES
  // in src/lib/normalize.ts), leaving only their genuine bulk listings.
  "wood-gurus": 0.05,
};

function listOffenders(products: Product[], heading: string): string[] {
  const out = [heading];
  for (const p of products.slice(0, 8)) {
    out.push(
      `  R${p.pricePerKgZar.toFixed(2)}/kg | ${p.weightKg}kg | R${p.priceZar.toFixed(0)} | ${p.title}`,
    );
  }
  if (products.length > 8) out.push(`  ... and ${products.length - 8} more`);
  return out;
}

export function runSanityChecks(
  products: Product[],
  status: ProductsFile["vendorRunStatus"],
  outputPath: string,
): string[] {
  const failures: string[] = [];

  // 1. Per-vendor: raw items but zero normalised. Strong "scraper broke" signal.
  for (const [vendorId, s] of Object.entries(status)) {
    if (!s.ok) continue;
    if ((s.rawCount ?? 0) > 10 && s.count === 0) {
      failures.push(
        `vendor "${vendorId}" scraped ${s.rawCount} raw items but normalised 0`,
      );
    }
  }

  // 1b. Per-vendor: yield collapsed without going to zero.
  for (const [vendorId, s] of Object.entries(status)) {
    if (!s.ok || s.count === 0) continue; // zero is check 1's to report
    const raw = s.rawCount ?? 0;
    if (raw < MIN_YIELD_RAW_COUNT) continue;
    const floor = YIELD_OVERRIDES[vendorId] ?? MIN_YIELD;
    const yieldRatio = s.count / raw;
    if (yieldRatio < floor) {
      failures.push(
        `vendor "${vendorId}" normalised ${s.count} of ${raw} raw items ` +
          `(${Math.round(yieldRatio * 100)}%, floor ${Math.round(floor * 100)}%)`,
      );
    }
  }

  // 2. Per-product: per-kg way above realistic firewood prices.
  const overpriced = products.filter(
    (p) =>
      p.pricePerKgZar > SUSPECT_PRICE_PER_KG &&
      !(p.weightKg < SPECIALTY_MAX_KG && SPECIALTY_PATTERN.test(p.title)),
  );
  if (overpriced.length > 0) {
    failures.push(
      ...listOffenders(
        overpriced,
        `${overpriced.length} product(s) exceed R ${SUSPECT_PRICE_PER_KG}/kg without specialty exemption:`,
      ),
    );
  }

  // 2b. Per-product: per-kg suspiciously low for a bulk-scale weight. Catches
  // non-firewood services (refuse removal, etc.) that priced their "1-ton"
  // listings at R 549 and slipped past the accessory blocklist.
  const underpriced = products.filter(
    (p) => p.pricePerKgZar < FLOOR_PRICE_PER_KG && p.weightKg >= FLOOR_MIN_KG,
  );
  if (underpriced.length > 0) {
    failures.push(
      ...listOffenders(
        underpriced,
        `${underpriced.length} product(s) below R ${FLOOR_PRICE_PER_KG}/kg at ${FLOOR_MIN_KG}kg+ (likely non-firewood):`,
      ),
    );
  }

  // 3. Total count dropped catastrophically vs previous run.
  if (existsSync(outputPath)) {
    try {
      const prev = JSON.parse(readFileSync(outputPath, "utf-8")) as ProductsFile;
      const prevCount = prev.products.length;
      if (prevCount > 0 && products.length / prevCount < COUNT_DROP_THRESHOLD) {
        const pct = Math.round((1 - products.length / prevCount) * 100);
        failures.push(
          `product count dropped from ${prevCount} to ${products.length} (${pct}% drop)`,
        );
      }
    } catch {
      // Previous file unreadable; skip the check.
    }
  }

  return failures;
}

/**
 * Whether the catalogue itself changed, ignoring the per-run timestamps that
 * move on every scrape. `generatedAt`, `scrapedAt` and `ranAt` all advance
 * daily whether or not a single price did, so a plain file diff can never say
 * "nothing changed" — which made every commit claim a price refresh.
 */
export function catalogueChanged(next: ProductsFile, prev: ProductsFile): boolean {
  return payload(next) !== payload(prev);
}

function payload(f: ProductsFile): string {
  const products = f.products.map((p) => {
    const copy: Partial<Product> = { ...p };
    delete copy.scrapedAt;
    return copy;
  });
  const status = Object.entries(f.vendorRunStatus)
    .map(([id, s]) => [id, { ok: s.ok, count: s.count, rawCount: s.rawCount, error: s.error }] as const)
    .sort((a, b) => a[0].localeCompare(b[0]));
  return JSON.stringify({ products, status });
}
