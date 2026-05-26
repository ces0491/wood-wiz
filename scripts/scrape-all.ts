import { writeFileSync } from "node:fs";
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
      status[mod.vendorId] = { ok: true, count: normalized.length, ranAt };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${msg}`);
      status[mod.vendorId] = { ok: false, count: 0, error: msg, ranAt };
    }
  }

  const out: ProductsFile = {
    generatedAt: new Date().toISOString(),
    products: allProducts.sort((a, b) => a.pricePerKgZar - b.pricePerKgZar),
    vendorRunStatus: status,
  };

  const path = join(process.cwd(), "data", "products.json");
  writeFileSync(path, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${out.products.length} products to ${path}`);

  const failures = Object.entries(status).filter(([, s]) => !s.ok);
  if (failures.length === SCRAPERS.length) {
    console.error("All scrapers failed");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
