import { describe, expect, test } from "vitest";
import type { Product, Vendor } from "./types";
import { MIN_SPOTLIGHT_SAMPLE, computeHighlights, computeVendorStats } from "./vendor-stats";

function vendor(id: string): Vendor {
  return {
    id,
    name: id,
    url: `https://${id}.test`,
    platform: "shopify",
    region: "cape-town",
    delivery: { description: "Delivery", pricing: "by-quote" },
  };
}

/** `count` products for `vendorId`, every one at `pricePerKgZar`. */
function catalogue(vendorId: string, count: number, pricePerKgZar: number): Product[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${vendorId}::${i}`,
    vendorId,
    vendorName: vendorId,
    title: `${vendorId} product ${i}`,
    url: `https://${vendorId}.test/${i}`,
    species: "blue-gum" as const,
    usage: "both" as const,
    packFormat: "bag" as const,
    priceZar: pricePerKgZar * 20,
    weightKg: 20,
    pricePerKgZar,
    weightEstimated: false,
    inStock: true,
    scrapedAt: "2026-08-10T04:00:00.000Z",
  }));
}

describe("cheapest typical price spotlight", () => {
  const vendors = [vendor("tiny"), vendor("big")];

  test("a tiny catalogue cannot take the headline from a large one", () => {
    // "tiny" has the lower median but only 3 products to compute it from.
    const products = [...catalogue("tiny", 3, 1.0), ...catalogue("big", 200, 2.0)];
    expect(3).toBeLessThan(MIN_SPOTLIGHT_SAMPLE);

    const stats = computeVendorStats(products, vendors);
    const { cheapestMedian } = computeHighlights(stats, vendors, products);
    expect(cheapestMedian?.vendorId).toBe("big");
  });

  test("once it clears the sample floor it wins on price like anyone else", () => {
    const products = [
      ...catalogue("tiny", MIN_SPOTLIGHT_SAMPLE, 1.0),
      ...catalogue("big", 200, 2.0),
    ];
    const stats = computeVendorStats(products, vendors);
    expect(computeHighlights(stats, vendors, products).cheapestMedian?.vendorId).toBe("tiny");
  });

  test("when nobody clears the floor, still name the cheapest rather than nothing", () => {
    const products = [...catalogue("tiny", 3, 1.0), ...catalogue("big", 4, 2.0)];
    const stats = computeVendorStats(products, vendors);
    expect(computeHighlights(stats, vendors, products).cheapestMedian?.vendorId).toBe("tiny");
  });

  test("the floor doesn't touch the charts — every vendor still has stats", () => {
    const products = [...catalogue("tiny", 3, 1.0), ...catalogue("big", 200, 2.0)];
    const stats = computeVendorStats(products, vendors);
    expect(stats.map((s) => s.vendorId).sort()).toEqual(["big", "tiny"]);
    expect(stats.find((s) => s.vendorId === "tiny")?.productCount).toBe(3);
  });
});

describe("median", () => {
  test("even-length catalogues average the two middle values", () => {
    const products = [...catalogue("v", 1, 2), ...catalogue("v", 1, 4)].map((p, i) => ({
      ...p,
      id: `v::${i}`,
    }));
    const stats = computeVendorStats(products, [vendor("v")]);
    expect(stats[0].medianPricePerKgZar).toBe(3);
  });

  test("median ignores the outliers that would drag the mean up", () => {
    const products = [
      ...catalogue("v", 9, 3).map((p, i) => ({ ...p, id: `v::a${i}` })),
      ...catalogue("v", 2, 120).map((p, i) => ({ ...p, id: `v::b${i}` })),
    ];
    const stats = computeVendorStats(products, [vendor("v")]);
    expect(stats[0].medianPricePerKgZar).toBe(3);
    expect(stats[0].avgPricePerKgZar).toBeGreaterThan(20);
  });
});
