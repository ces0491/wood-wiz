import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProductsFile } from "./types";

export async function loadProducts(): Promise<ProductsFile> {
  const path = join(process.cwd(), "data", "products.json");
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as ProductsFile;
}
