import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProductsFile } from "./types";

/**
 * Where the catalogue is read from.
 *
 * `WOOD_WIZ_DATA_FILE` points the build at a different file, which is how the
 * visual regression suite gets a deterministic site: the real catalogue is
 * re-scraped daily, so screenshots taken against it would differ every morning
 * and the baselines would be worthless. Unset — which is every real build —
 * this is `data/products.json`.
 *
 * Read at build time, not per request: every page that calls this is statically
 * prerendered.
 */
function dataPath(): string {
  const override = process.env.WOOD_WIZ_DATA_FILE;
  return override
    ? join(process.cwd(), override)
    : join(process.cwd(), "data", "products.json");
}

export async function loadProducts(): Promise<ProductsFile> {
  const raw = await readFile(dataPath(), "utf-8");
  return JSON.parse(raw) as ProductsFile;
}
