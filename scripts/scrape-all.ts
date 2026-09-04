import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Product, ProductsFile, ScrapedProduct } from "../src/lib/types";
import { normalize } from "../src/lib/normalize";
import { catalogueChanged, runSanityChecks } from "./sanity-checks";

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

// Tells the workflow whether prices actually moved, so the commit message can
// say which happened. The run timestamps advance either way.
function reportCatalogueChange(changed: boolean) {
  console.log(changed ? "  catalogue changed" : "  catalogue unchanged (timestamps only)");
  const out = process.env.GITHUB_OUTPUT;
  if (out) appendFileSync(out, `catalogue_changed=${changed}\n`);
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

  let changed = true;
  if (existsSync(path)) {
    try {
      changed = catalogueChanged(out, JSON.parse(readFileSync(path, "utf-8")) as ProductsFile);
    } catch {
      // Previous file unreadable; treat this run as a change.
    }
  }
  reportCatalogueChange(changed);

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
