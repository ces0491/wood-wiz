import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Product, ProductsFile, ScrapedProduct } from "../src/lib/types";
import { normalize } from "../src/lib/normalize";
import { carryForward } from "./carry-forward";
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

// A run where some vendors failed still publishes, so the other vendors'
// prices refresh. The workflow fails afterwards on this output, so the failure
// sends a notification instead of sitting in a green run's log — Stompies
// failed four days running before anyone saw it.
function reportFailedVendors(failed: string[]) {
  const out = process.env.GITHUB_OUTPUT;
  if (out) appendFileSync(out, `vendors_failed=${failed.join(",")}\n`);
}

function readPrevious(path: string): ProductsFile | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as ProductsFile;
  } catch {
    return null; // unreadable: no carry-forward, no count comparison
  }
}

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`Scrape run started at ${startedAt}`);
  const path = join(process.cwd(), "data", "products.json");
  const prev = readPrevious(path);
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
      const carried = carryForward(mod.vendorId, msg, ranAt, prev);
      console.error(
        carried.products.length > 0
          ? `  carrying forward ${carried.products.length} products from ${carried.status.lastOkAt}`
          : "  nothing to carry forward",
      );
      allProducts.push(...carried.products);
      status[mod.vendorId] = carried.status;
    }
  }

  console.log("\n=== Sanity checks ===");
  const failures = runSanityChecks(allProducts, status, prev);
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

  // No readable previous file counts as a change.
  reportCatalogueChange(prev ? catalogueChanged(out, prev) : true);

  writeFileSync(path, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${out.products.length} products to ${path}`);

  const failed = Object.entries(status)
    .filter(([, s]) => !s.ok)
    .map(([id]) => id);
  reportFailedVendors(failed);

  if (failed.length === SCRAPERS.length) {
    console.error("All scrapers failed");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
