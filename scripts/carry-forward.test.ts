import { describe, expect, test } from "vitest";
import type { Product, ProductsFile } from "../src/lib/types";
import { MAX_STALE_DAYS } from "../src/lib/stale";
import { carryForward } from "./carry-forward";

function product(over: Partial<Product> = {}): Product {
  return {
    id: "stompies::1",
    vendorId: "stompies",
    vendorName: "Stompies",
    title: "Sekelbush 20kg Bag",
    url: "https://example.test/p",
    species: "sekelbos",
    usage: "both",
    packFormat: "bag",
    priceZar: 120,
    weightKg: 20,
    pricePerKgZar: 6,
    weightEstimated: false,
    inStock: true,
    scrapedAt: "2026-09-09T07:40:00.000Z",
    ...over,
  };
}

const lastOk = "2026-09-09T07:40:00.000Z";

function prevFile(status: ProductsFile["vendorRunStatus"][string]): ProductsFile {
  return {
    generatedAt: lastOk,
    products: [
      product(),
      product({ id: "stompies::2", title: "Eco Logs 10kg" }),
      product({ id: "other::1", vendorId: "other" }),
    ],
    vendorRunStatus: { stompies: status },
  };
}

describe("carryForward", () => {
  test("a vendor failing the day after a success keeps its last prices", () => {
    const prev = prevFile({ ok: true, count: 2, ranAt: lastOk });
    const { products, status } = carryForward("stompies", "blocked", "2026-09-10T07:40:00.000Z", prev);
    expect(products.map((p) => p.id)).toEqual(["stompies::1"]);
    expect(status).toMatchObject({ ok: false, count: 1, error: "blocked", lastOkAt: lastOk });
  });

  test("carried products are re-checked against the current blocklist", () => {
    const prev = prevFile({ ok: true, count: 2, ranAt: lastOk });
    const { products } = carryForward("stompies", "blocked", "2026-09-10T07:40:00.000Z", prev);
    expect(products.some((p) => p.title.includes("Eco Logs"))).toBe(false);
  });

  test("a second failure keeps the date of the last success, not the last failure", () => {
    const prev = prevFile({ ok: false, count: 1, ranAt: "2026-09-10T07:40:00.000Z", lastOkAt: lastOk });
    const { status } = carryForward("stompies", "blocked", "2026-09-11T07:40:00.000Z", prev);
    expect(status.lastOkAt).toBe(lastOk);
  });

  test(`prices older than ${MAX_STALE_DAYS} days are dropped, but the date is kept`, () => {
    const prev = prevFile({ ok: false, count: 1, ranAt: "2026-09-16T07:40:00.000Z", lastOkAt: lastOk });
    const { products, status } = carryForward("stompies", "blocked", "2026-09-17T07:40:00.000Z", prev);
    expect(products).toEqual([]);
    expect(status).toMatchObject({ count: 0, lastOkAt: lastOk });
  });

  test("with no previous file there is nothing to carry", () => {
    const { products, status } = carryForward("stompies", "blocked", "2026-09-10T07:40:00.000Z", null);
    expect(products).toEqual([]);
    expect(status.lastOkAt).toBeUndefined();
  });
});
