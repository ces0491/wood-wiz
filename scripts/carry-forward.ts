import type { Product, ProductsFile, VendorRunStatus } from "../src/lib/types";
import { isFirewood } from "../src/lib/normalize";
import { MAX_STALE_DAYS } from "../src/lib/stale";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * What to publish for a vendor whose scrape failed this run.
 *
 * Without this a single failed run removed the vendor from the site until the
 * next success. Stompies failing from 2026-09-10 took Johannesburg from two
 * vendors to one, which SCOPE says a city page should never be.
 *
 * Carried products are re-checked against the current blocklist, since they
 * were normalised by whatever version of the normaliser ran last time.
 */
export function carryForward(
  vendorId: string,
  error: string,
  ranAt: string,
  prev: ProductsFile | null,
): { products: Product[]; status: VendorRunStatus } {
  const prevStatus = prev?.vendorRunStatus[vendorId];
  const lastOkAt = prevStatus?.ok ? prevStatus.ranAt : prevStatus?.lastOkAt;

  const fresh =
    lastOkAt !== undefined && Date.parse(ranAt) - Date.parse(lastOkAt) <= MAX_STALE_DAYS * DAY_MS;
  const products = fresh
    ? (prev?.products ?? []).filter((p) => p.vendorId === vendorId && isFirewood(p.title))
    : [];

  return {
    products,
    status: { ok: false, count: products.length, error, ranAt, lastOkAt },
  };
}
