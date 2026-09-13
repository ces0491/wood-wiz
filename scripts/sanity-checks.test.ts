import { describe, expect, test } from "vitest";
import type { Product, ProductsFile, Vendor } from "../src/lib/types";
import { MIN_YIELD, YIELD_OVERRIDES, catalogueChanged, runSanityChecks } from "./sanity-checks";

const NO_PREV = null;

const vendorBase: Omit<Vendor, "id" | "regions"> = {
  name: "Vendor",
  url: "https://vendor.test",
  platform: "woocommerce",
  delivery: { description: "Delivery", pricing: "by-quote" },
};

function status(
  entries: Record<string, { count: number; rawCount?: number; ok?: boolean }>,
): ProductsFile["vendorRunStatus"] {
  return Object.fromEntries(
    Object.entries(entries).map(([id, e]) => [
      id,
      { ok: e.ok ?? true, count: e.count, rawCount: e.rawCount, ranAt: "2026-08-10T04:00:00.000Z" },
    ]),
  );
}

function product(over: Partial<Product> = {}): Product {
  return {
    id: "v::1",
    vendorId: "v",
    vendorName: "V",
    title: "Blue Gum 20kg Bag",
    url: "https://example.test/p",
    species: "blue-gum",
    usage: "both",
    packFormat: "bag",
    priceZar: 100,
    weightKg: 20,
    pricePerKgZar: 5,
    weightEstimated: false,
    inStock: true,
    scrapedAt: "2026-08-10T04:00:00.000Z",
    ...over,
  };
}

describe("yield check", () => {
  test("a vendor whose listings mostly stop parsing fails", () => {
    const failures = runSanityChecks(
      [product()],
      status({ "mother-city-firewood": { count: 12, rawCount: 235 } }),
      NO_PREV,
    );
    expect(failures.some((f) => f.includes("normalised 12 of 235"))).toBe(true);
  });

  test("a healthy yield passes", () => {
    expect(
      runSanityChecks(
        [product()],
        status({ "mother-city-firewood": { count: 198, rawCount: 235 } }),
        NO_PREV,
      ),
    ).toEqual([]);
  });

  test("zero-yield is left to the dedicated check, not double-reported", () => {
    const failures = runSanityChecks(
      [product()],
      status({ "fire-man": { count: 0, rawCount: 40 } }),
      NO_PREV,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("normalised 0");
  });

  test("too few raw items to read a ratio from is not a failure", () => {
    // 1 of 19 is a terrible ratio but far too small a sample to act on.
    expect(
      runSanityChecks([product()], status({ "fire-man": { count: 1, rawCount: 19 } }), NO_PREV),
    ).toEqual([]);
  });

  test("Wood Gurus' per-piece configurator sits under the default floor by design", () => {
    // 4 of 33 is the observed steady state: most variants price a single
    // split piece and are dropped deliberately. It must not fail the build.
    expect(4 / 33).toBeLessThan(MIN_YIELD);
    expect(4 / 33).toBeGreaterThan(YIELD_OVERRIDES["wood-gurus"]);
    expect(
      runSanityChecks([product()], status({ "wood-gurus": { count: 4, rawCount: 33 } }), NO_PREV),
    ).toEqual([]);
  });

  test("even an overridden vendor fails once it collapses far enough", () => {
    const failures = runSanityChecks(
      [product()],
      status({ "wood-gurus": { count: 1, rawCount: 33 } }),
      NO_PREV,
    );
    expect(failures.some((f) => f.includes('"wood-gurus"'))).toBe(true);
  });

  test("a failed scraper is skipped — nothing to measure a ratio against", () => {
    expect(
      runSanityChecks([product()], status({ "fire-man": { count: 0, ok: false } }), NO_PREV),
    ).toEqual([]);
  });
});

describe("price checks still fire", () => {
  test("overpriced without specialty exemption", () => {
    const failures = runSanityChecks([product({ pricePerKgZar: 95 })], status({}), NO_PREV);
    expect(failures[0]).toContain("exceed R 50/kg");
  });

  test("small specialty smoking packs are exempt", () => {
    expect(
      runSanityChecks(
        [product({ pricePerKgZar: 120, weightKg: 1.5, title: "Smoking Chunks 1.5kg" })],
        status({}),
        NO_PREV,
      ),
    ).toEqual([]);
  });

  test("bulk weight under the floor price", () => {
    const failures = runSanityChecks(
      [product({ pricePerKgZar: 0.55, weightKg: 1000, priceZar: 549 })],
      status({}),
      NO_PREV,
    );
    expect(failures[0]).toContain("below R 1/kg");
  });
});

describe("count drop", () => {
  const vendors: Vendor[] = [
    { ...vendorBase, id: "ct-big", regions: ["cape-town"] },
    { ...vendorBase, id: "jhb-a", regions: ["johannesburg"] },
    { ...vendorBase, id: "jhb-b", regions: ["johannesburg"] },
  ];
  const many = (vendorId: string, n: number) =>
    Array.from({ length: n }, (_, i) => product({ id: `${vendorId}::${i}`, vendorId }));
  const prevOf = (products: Product[]): ProductsFile => ({
    generatedAt: "2026-08-09T04:00:00.000Z",
    products,
    vendorRunStatus: {},
  });
  const allOk = status({ "ct-big": { count: 1 }, "jhb-a": { count: 1 }, "jhb-b": { count: 1 } });

  test("a small city collapsing fails even when the site-wide total barely moves", () => {
    const prev = prevOf([...many("ct-big", 500), ...many("jhb-a", 10), ...many("jhb-b", 10)]);
    const next = [...many("ct-big", 500), ...many("jhb-a", 10), ...many("jhb-b", 1)];
    const failures = runSanityChecks(next, allOk, prev, vendors);
    expect(failures).toEqual(["Johannesburg product count dropped from 20 to 11 (45% drop)"]);
  });

  test("a failed vendor is left to the failed-run report, not counted as a drop", () => {
    // Its products are carried forward or aged out; either way the refresh of
    // everyone else must still publish.
    const prev = prevOf([...many("ct-big", 500), ...many("jhb-a", 10), ...many("jhb-b", 10)]);
    const next = [...many("ct-big", 500), ...many("jhb-a", 10)];
    const withFailure = status({
      "ct-big": { count: 1 },
      "jhb-a": { count: 1 },
      "jhb-b": { count: 0, ok: false },
    });
    expect(runSanityChecks(next, withFailure, prev, vendors)).toEqual([]);
  });
});

describe("catalogueChanged", () => {
  const base: ProductsFile = {
    generatedAt: "2026-08-10T04:19:45.689Z",
    products: [product()],
    vendorRunStatus: status({ v: { count: 1, rawCount: 1 } }),
  };

  test("timestamps moving on their own is not a change", () => {
    const next: ProductsFile = {
      generatedAt: "2026-08-11T04:20:01.000Z",
      products: [product({ scrapedAt: "2026-08-11T04:20:00.000Z" })],
      vendorRunStatus: {
        v: { ok: true, count: 1, rawCount: 1, ranAt: "2026-08-11T04:20:00.000Z" },
      },
    };
    expect(catalogueChanged(next, base)).toBe(false);
  });

  test("a price move is a change", () => {
    const next = { ...base, products: [product({ priceZar: 110, pricePerKgZar: 5.5 })] };
    expect(catalogueChanged(next, base)).toBe(true);
  });

  test("a vendor dropping out is a change", () => {
    expect(catalogueChanged({ ...base, products: [] }, base)).toBe(true);
  });
});
