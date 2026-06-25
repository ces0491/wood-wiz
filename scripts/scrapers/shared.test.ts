import { afterEach, describe, expect, test, vi } from "vitest";
import { extractWooPrice, fetchText, isRetryableError, type WooProduct } from "./shared";

function abortError(): Error {
  const e = new Error("This operation was aborted");
  e.name = "AbortError";
  return e;
}

function networkError(): Error {
  const e = new Error("fetch failed");
  e.name = "TypeError";
  return e;
}

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

describe("isRetryableError", () => {
  test("retries timeouts (AbortError) and network errors (TypeError)", () => {
    expect(isRetryableError(abortError())).toBe(true);
    expect(isRetryableError(networkError())).toBe(true);
  });

  test("retries 5xx and transient socket errors", () => {
    expect(isRetryableError(new Error("HTTP 503 for https://x"))).toBe(true);
    expect(isRetryableError(new Error("ECONNRESET"))).toBe(true);
  });

  test("does not retry 4xx or non-Errors", () => {
    expect(isRetryableError(new Error("HTTP 404 for https://x"))).toBe(false);
    expect(isRetryableError("nope")).toBe(false);
  });
});

describe("fetchText retry", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("retries a transient timeout then returns the eventual success", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls++;
        if (calls < 3) throw abortError();
        return new Response("ok", { status: 200 });
      }),
    );
    const text = await fetchText("https://x", 1000, { backoffMs: 1 });
    expect(text).toBe("ok");
    expect(calls).toBe(3);
  });

  test("gives up after exhausting attempts and rethrows", async () => {
    const fetchMock = vi.fn(async () => {
      throw abortError();
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchText("https://x", 1000, { attempts: 2, backoffMs: 1 })).rejects.toThrow(
      /aborted/i,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("does not retry a non-retryable 4xx", async () => {
    const fetchMock = vi.fn(async () => new Response("nope", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchText("https://x", 1000, { backoffMs: 1 })).rejects.toThrow(/HTTP 404/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
