import { describe, expect, test } from "vitest";
import type { Product, Vendor } from "./types";
import type { RegionId } from "./regions";
import {
  MIN_SPOTLIGHT_SAMPLE,
  computeHighlights,
  computeVendorStats,
  forRegion,
} from "./vendor-stats";

function vendor(id: string, regions: RegionId[] = ["cape-town"]): Vendor {
  return {
    id,
    name: id,
    url: `https://${id}.test`,
    platform: "shopify",
    regions,
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
  const vendors = [vendor("tiny"), vendor("big"), vendor("mid")];

  test("a tiny catalogue cannot take the headline from a large one", () => {
    // "tiny" has the lowest median but only 3 products to compute it from, so
    // the award goes to the cheapest of the two that clear the floor.
    const products = [
      ...catalogue("tiny", 3, 1.0),
      ...catalogue("big", 200, 2.0),
      ...catalogue("mid", 50, 3.0),
    ];
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

  test("no award when nobody clears the floor", () => {
    const products = [...catalogue("tiny", 3, 1.0), ...catalogue("big", 4, 2.0)];
    const stats = computeVendorStats(products, vendors);
    expect(computeHighlights(stats, vendors, products).cheapestMedian).toBeNull();
  });

  test("no award when only one vendor clears the floor, even with others listed", () => {
    // The Johannesburg case: the floor excludes the *cheaper* vendor, so
    // awarding "cheapest" to the survivor would name the dearer one.
    const products = [...catalogue("tiny", 3, 1.0), ...catalogue("big", 200, 9.66)];
    const stats = computeVendorStats(products, vendors);
    const { cheapestMedian } = computeHighlights(stats, vendors, products);
    expect(cheapestMedian).toBeNull();
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

describe("forRegion", () => {
  const vendors = [
    vendor("ct-only", ["cape-town"]),
    vendor("jhb-only", ["johannesburg"]),
    vendor("both", ["cape-town", "johannesburg"]),
  ];
  const products = [
    ...catalogue("ct-only", 2, 3),
    ...catalogue("jhb-only", 2, 9),
    ...catalogue("both", 2, 8),
  ];

  test("a metro sees its own vendors and the ones that also serve it", () => {
    const ct = forRegion("cape-town", products, vendors);
    expect(ct.vendors.map((v) => v.id).sort()).toEqual(["both", "ct-only"]);
    expect(ct.products.every((p) => p.vendorId !== "jhb-only")).toBe(true);
  });

  test("a metro never sees another metro's vendors", () => {
    const jhb = forRegion("johannesburg", products, vendors);
    expect(jhb.vendors.map((v) => v.id).sort()).toEqual(["both", "jhb-only"]);
    expect(jhb.products.some((p) => p.vendorId === "ct-only")).toBe(false);
  });

  test("a two-metro vendor carries the same catalogue into each", () => {
    // One storefront, one set of prices — so the figures must not differ by
    // which page you are on, only which vendors they sit beside.
    const ct = forRegion("cape-town", products, vendors);
    const jhb = forRegion("johannesburg", products, vendors);
    const only = (r: typeof ct) => r.products.filter((p) => p.vendorId === "both");
    expect(only(ct)).toEqual(only(jhb));
  });

  test("ranking is scoped to the metro, so each names its own cheapest", () => {
    const ct = forRegion("cape-town", products, vendors);
    const jhb = forRegion("johannesburg", products, vendors);
    const cheapest = (r: typeof ct) =>
      computeHighlights(
        computeVendorStats(r.products, r.vendors),
        r.vendors,
        r.products,
      ).cheapestSingleProduct?.vendorId;
    expect(cheapest(ct)).toBe("ct-only");
    expect(cheapest(jhb)).toBe("both");
  });
});
