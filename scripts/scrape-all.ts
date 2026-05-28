import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Product, ProductsFile, ScrapedProduct } from "../src/lib/types";
import { normalize } from "../src/lib/normalize";

import * as motherCity from "./scrapers/mother-city-firewood";
import * as woodGurus from "./scrapers/wood-gurus";
import * as ctf from "./scrapers/cape-town-firewood";
import * as firewoodCompany from "./scrapers/firewood-company";
import * as fireMan from "./scrapers/fire-man";
import * as lancehoudt from "./scrapers/lancehoudt";
import * as namibianHardwood from "./scrapers/namibian-hardwood";
import * as woodBros from "./scrapers/wood-bros";

interface ScraperModule {
  vendorId: string;
  scrape: () => Promise<ScrapedProduct[]>;
}

const SCRAPERS: ScraperModule[] = [
  motherCity,
  woodGurus,
  ctf,
  firewoodCompany,
  fireMan,
  lancehoudt,
  namibianHardwood,
  woodBros,
];

// Sanity-check thresholds. See SCOPE.md > "Data quality".
const SUSPECT_PRICE_PER_KG = 50;
// Below R 1/kg with a bulk-scale weight is almost certainly a non-firewood
// service that slipped past the accessory filter (e.g. "Garden Refuse Removal
// Service — 1 Ton Bakkie Load" sold at R 549). Legitimate bulk firewood
// bottoms out around R 1–2/kg.
const FLOOR_PRICE_PER_KG = 1;
const FLOOR_MIN_KG = 50;
const COUNT_DROP_THRESHOLD = 0.6; // fail if new < old * this
// Titles matching this pattern are allowed to exceed SUSPECT_PRICE_PER_KG —
// these are legitimately-expensive small specialty products (smoking chunks,
// per-box gift items, etc.) whose per-kg price reflects packaging not value.
const SPECIALTY_PATTERN = /\b(smoking|chunks|per\s*box|eco\s*log)/i;
const SPECIALTY_MAX_KG = 10; // only allow specialty exemption for small packs

function runSanityChecks(
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

  // 2. Per-product: per-kg way above realistic firewood prices.
  const overpriced = products.filter(
    (p) =>
      p.pricePerKgZar > SUSPECT_PRICE_PER_KG &&
      !(p.weightKg < SPECIALTY_MAX_KG && SPECIALTY_PATTERN.test(p.title)),
  );
  if (overpriced.length > 0) {
    failures.push(
      `${overpriced.length} product(s) exceed R ${SUSPECT_PRICE_PER_KG}/kg without specialty exemption:`,
    );
    for (const p of overpriced.slice(0, 8)) {
      failures.push(
        `  R${p.pricePerKgZar.toFixed(2)}/kg | ${p.weightKg}kg | R${p.priceZar.toFixed(0)} | ${p.title}`,
      );
    }
    if (overpriced.length > 8) {
      failures.push(`  ... and ${overpriced.length - 8} more`);
    }
  }

  // 2b. Per-product: per-kg suspiciously low for a bulk-scale weight. Catches
  // non-firewood services (refuse removal, etc.) that priced their "1-ton"
  // listings at R 549 and slipped past the accessory blocklist.
  const underpriced = products.filter(
    (p) => p.pricePerKgZar < FLOOR_PRICE_PER_KG && p.weightKg >= FLOOR_MIN_KG,
  );
  if (underpriced.length > 0) {
    failures.push(
      `${underpriced.length} product(s) below R ${FLOOR_PRICE_PER_KG}/kg at ${FLOOR_MIN_KG}kg+ (likely non-firewood):`,
    );
    for (const p of underpriced.slice(0, 8)) {
      failures.push(
        `  R${p.pricePerKgZar.toFixed(2)}/kg | ${p.weightKg}kg | R${p.priceZar.toFixed(0)} | ${p.title}`,
      );
    }
    if (underpriced.length > 8) {
      failures.push(`  ... and ${underpriced.length - 8} more`);
    }
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

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`Scrape run started at ${startedAt}`);
  const allProducts: Product[] = [];
  const status: ProductsFile["vendorRunStatus"] = {};

  for (const mod of SCRAPERS) {
    const ranAt = new Date().toISOString();
    try {
      console.log(`\n=== ${mod.vendorId} ===`);
      const scraped = await mod.scrape();
      console.log(`  scraped ${scraped.length} raw items`);
      const normalized = scraped
        .map(normalize)
        .filter((p): p is Product => p !== null);
      console.log(`  normalized ${normalized.length} products`);
      allProducts.push(...normalized);
      status[mod.vendorId] = {
        ok: true,
        count: normalized.length,
        rawCount: scraped.length,
        ranAt,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${msg}`);
      status[mod.vendorId] = { ok: false, count: 0, error: msg, ranAt };
    }
  }

  const path = join(process.cwd(), "data", "products.json");

  console.log("\n=== Sanity checks ===");
  const failures = runSanityChecks(allProducts, status, path);
  if (failures.length > 0) {
    console.error("Sanity checks failed — refusing to overwrite data/products.json:");
    for (const line of failures) console.error(`  ${line}`);
    process.exit(2);
  }
  console.log("  all checks passed");

  const out: ProductsFile = {
    generatedAt: new Date().toISOString(),
    products: allProducts.sort((a, b) => a.pricePerKgZar - b.pricePerKgZar),
    vendorRunStatus: status,
  };

  writeFileSync(path, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${out.products.length} products to ${path}`);

  const allFailed = Object.values(status).every((s) => !s.ok);
  if (allFailed) {
    console.error("All scrapers failed");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
