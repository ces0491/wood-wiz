import { describe, expect, test } from "vitest";
import { extractWooPrice, type WooProduct } from "./shared";

// All amounts are in minor units (cents) per WooCommerce Store API
// convention. R 100.00 = 10000.

function makeWoo(overrides: Partial<WooProduct> = {}): WooProduct {
  return {
    id: 1,
    name: "Bluegum 18kg",
    permalink: "https://example.com/p/1",
    is_in_stock: true,
    prices: {
      price: "10000",
      regular_price: "10000",
      currency_minor_unit: 2,
      price_range: null,
    },
    images: [],
    variation: "",
    type: "simple",
    weight: undefined,
    ...overrides,
  };
}

describe("extractWooPrice", () => {
  describe("simple products", () => {
    test("uses 'price' as the displayed price", () => {
      const r = extractWooPrice(makeWoo({ type: "simple" }));
      expect(r?.priceZar).toBe(100);
      expect(r?.maxPriceZar).toBeUndefined();
    });

    test("sets regularPriceZar when on sale (regular > price)", () => {
      const r = extractWooPrice(
        makeWoo({
          type: "simple",
          prices: {
            price: "8000",
            regular_price: "10000",
            currency_minor_unit: 2,
            price_range: null,
          },
        }),
      );
      expect(r?.priceZar).toBe(80);
      expect(r?.regularPriceZar).toBe(100);
    });

    test("does not set regularPriceZar when not on sale (regular == price)", () => {
      const r = extractWooPrice(makeWoo({ type: "simple" }));
      expect(r?.regularPriceZar).toBeUndefined();
    });
  });

  describe("variable products with price_range", () => {
    test("uses price_range.min_amount as the price, not the parent's ghost 'price'", () => {
      // This is the original Bluegum bug: parent price 152500 (R 1,525) is a
      // stale default; the storefront shows the range starting at R 1,929.13.
      const r = extractWooPrice(
        makeWoo({
          type: "variable",
          prices: {
            price: "152500",
            regular_price: "192913",
            currency_minor_unit: 2,
            price_range: { min_amount: "192913", max_amount: "222008" },
          },
        }),
      );
      expect(r?.priceZar).toBeCloseTo(1929.13, 2);
      expect(r?.maxPriceZar).toBeCloseTo(2220.08, 2);
    });

    test("max_amount equal to min_amount does not produce a maxPriceZar", () => {
      const r = extractWooPrice(
        makeWoo({
          type: "variable",
          prices: {
            price: "100000",
            regular_price: "100000",
            currency_minor_unit: 2,
            price_range: { min_amount: "100000", max_amount: "100000" },
          },
        }),
      );
      expect(r?.priceZar).toBe(1000);
      expect(r?.maxPriceZar).toBeUndefined();
    });

    test("never sets a 'sale' regularPriceZar for variable products", () => {
      const r = extractWooPrice(
        makeWoo({
          type: "variable",
          prices: {
            price: "10000",
            regular_price: "20000",
            currency_minor_unit: 2,
            price_range: { min_amount: "15000", max_amount: "20000" },
          },
        }),
      );
      expect(r?.regularPriceZar).toBeUndefined();
    });
  });

  describe("variable products without price_range", () => {
    test("falls back to regular_price when price_range is absent", () => {
      // This is the Port Jackson 3000 case: all variants happen to be the
      // same price, so WooCommerce omits price_range. The site shows the
      // single price (R 5,692.50), but 'price' is the ghost low value.
      const r = extractWooPrice(
        makeWoo({
          type: "variable",
          prices: {
            price: "450000",
            regular_price: "569250",
            currency_minor_unit: 2,
            price_range: null,
          },
        }),
      );
      expect(r?.priceZar).toBe(5692.5);
      expect(r?.maxPriceZar).toBeUndefined();
    });

    test("falls back to regular_price when price_range is undefined", () => {
      const r = extractWooPrice(
        makeWoo({
          type: "variable",
          prices: {
            price: "450000",
            regular_price: "569250",
            currency_minor_unit: 2,
          },
        }),
      );
      expect(r?.priceZar).toBe(5692.5);
    });

    test("falls back to price as last resort when no range and no regular_price", () => {
      const r = extractWooPrice(
        makeWoo({
          type: "variable",
          prices: {
            price: "10000",
            regular_price: "",
            currency_minor_unit: 2,
            price_range: null,
          },
        }),
      );
      expect(r?.priceZar).toBe(100);
    });
  });

  describe("edge cases", () => {
    test("returns null for zero price", () => {
      const r = extractWooPrice(
        makeWoo({
          prices: { price: "0", regular_price: "0", currency_minor_unit: 2 },
        }),
      );
      expect(r).toBeNull();
    });

    test("returns null for negative price", () => {
      const r = extractWooPrice(
        makeWoo({
          prices: {
            price: "-100",
            regular_price: "-100",
            currency_minor_unit: 2,
          },
        }),
      );
      expect(r).toBeNull();
    });

    test("handles currency_minor_unit = 0 (no decimal places)", () => {
      const r = extractWooPrice(
        makeWoo({
          prices: { price: "100", regular_price: "100", currency_minor_unit: 0 },
        }),
      );
      expect(r?.priceZar).toBe(100);
    });

    test("handles currency_minor_unit = 3", () => {
      const r = extractWooPrice(
        makeWoo({
          prices: {
            price: "100000",
            regular_price: "100000",
            currency_minor_unit: 3,
          },
        }),
      );
      expect(r?.priceZar).toBe(100);
    });
  });
});
