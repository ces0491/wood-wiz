import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProductsFile } from "./types";

/**
 * Where the catalogue is read from.
 *
 * Two fixed paths chosen by a flag, rather than an env var holding a path.
 * `join(process.cwd(), someEnvVar)` cannot be statically analysed, so
 * Turbopack gives up and traces the entire project into the server output —
 * every source file and the whole public folder — which it warns about at
 * build time and which slows deployments or trips size limits. Both branches
 * here are literals, so the tracer knows exactly which file each build needs.
 *
 * `WOOD_WIZ_DATA=fixture` is set only by the visual regression suite. The
 * catalogue is re-scraped daily, so screenshots taken against the real file
 * would differ every morning and every baseline would be worthless.
 *
 * Read at build time, not per request: every page that calls this is
 * statically prerendered.
 */
const USE_FIXTURE = process.env.WOOD_WIZ_DATA === "fixture";

export async function loadProducts(): Promise<ProductsFile> {
  const path = USE_FIXTURE
    ? join(process.cwd(), "tests", "fixtures", "products.json")
    : join(process.cwd(), "data", "products.json");
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as ProductsFile;
}
