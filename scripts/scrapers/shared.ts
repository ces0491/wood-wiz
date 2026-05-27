import type { ScrapedProduct } from "../../src/lib/types";

const USER_AGENT =
  "wood-wiz/0.1 (+https://github.com/ces0491/wood-wiz; price comparison bot)";

export async function fetchText(url: string, timeoutMs = 20000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/json,*/*" },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T = unknown>(url: string, timeoutMs = 20000): Promise<T> {
  const text = await fetchText(url, timeoutMs);
  return JSON.parse(text) as T;
}

// Shopify exposes /products.json on most storefronts with paginated product
// data. Page size defaults to 30; max 250 with ?limit=. We iterate until an
// empty page is returned.
interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html?: string;
  images: { src: string }[];
  variants: {
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    available: boolean;
    grams?: number;
    weight?: number;
    weight_unit?: string;
  }[];
}

export async function scrapeShopify(
  vendorId: string,
  storeUrl: string,
): Promise<ScrapedProduct[]> {
  const base = storeUrl.replace(/\/$/, "");
  const out: ScrapedProduct[] = [];
  const now = new Date().toISOString();
  for (let page = 1; page < 20; page++) {
    const url = `${base}/products.json?limit=250&page=${page}`;
    const data = await fetchJson<{ products: ShopifyProduct[] }>(url);
    if (!data.products || data.products.length === 0) break;
    for (const p of data.products) {
      for (const v of p.variants) {
        const price = parseFloat(v.price);
        if (!Number.isFinite(price) || price <= 0) continue;
        // Many Shopify stores set placeholder grams (e.g. 10g). Only trust
        // the field when it represents at least 1kg — otherwise fall back to
        // the variant title so the regex parser can find a real weight.
        const grams = v.grams ?? 0;
        const rawWeight =
          grams >= 1000
            ? `${grams / 1000}kg ${v.title}`
            : v.title;
        out.push({
          vendorId,
          externalId: `${p.id}-${v.id}`,
          title: p.variants.length > 1 ? `${p.title} — ${v.title}` : p.title,
          url: `${base}/products/${p.handle}?variant=${v.id}`,
          imageUrl: p.images?.[0]?.src,
          priceZar: price,
          regularPriceZar: v.compare_at_price ? parseFloat(v.compare_at_price) : undefined,
          inStock: v.available,
          rawWeightLabel: rawWeight,
          scrapedAt: now,
        });
      }
    }
    if (data.products.length < 250) break;
  }
  return out;
}

// WooCommerce Store API (public, no auth) lives at /wp-json/wc/store/v1/products
// on modern WooCommerce installs. Older sites may need HTML scraping instead.
interface WooProduct {
  id: number;
  name: string;
  permalink: string;
  is_in_stock: boolean;
  prices: {
    price: string;
    regular_price: string;
    currency_minor_unit: number;
    price_range?: { min_amount: string; max_amount: string } | null;
  };
  images: { src: string }[];
  variation: string;
  type: string;
  weight?: string;
}

export async function scrapeWooCommerce(
  vendorId: string,
  storeUrl: string,
): Promise<ScrapedProduct[]> {
  const base = storeUrl.replace(/\/$/, "");
  const out: ScrapedProduct[] = [];
  const now = new Date().toISOString();
  for (let page = 1; page < 30; page++) {
    const url = `${base}/wp-json/wc/store/v1/products?per_page=100&page=${page}`;
    let data: WooProduct[];
    try {
      data = await fetchJson<WooProduct[]>(url);
    } catch (err) {
      if (page === 1) throw err;
      break;
    }
    if (!Array.isArray(data) || data.length === 0) break;
    for (const p of data) {
      const minor = p.prices?.currency_minor_unit ?? 2;
      const divisor = Math.pow(10, minor);

      // Variable products expose a price_range whose min_amount is what the
      // storefront actually displays. The parent's `price` field is a stale
      // default that doesn't correspond to any selectable variant, so trusting
      // it produces ghost prices well below any real purchase option.
      const isVariable = p.type === "variable";
      const range = p.prices?.price_range;
      const priceStr = isVariable && range?.min_amount ? range.min_amount : p.prices?.price ?? "0";
      const price = parseFloat(priceStr) / divisor;
      if (!Number.isFinite(price) || price <= 0) continue;

      // Skip the regular_price comparison for variable products — the min
      // variant IS the regular price, not a sale.
      const regular =
        !isVariable && p.prices?.regular_price
          ? parseFloat(p.prices.regular_price) / divisor
          : undefined;

      out.push({
        vendorId,
        externalId: String(p.id),
        title: p.name,
        url: p.permalink,
        imageUrl: p.images?.[0]?.src,
        priceZar: price,
        regularPriceZar: regular && regular !== price ? regular : undefined,
        inStock: p.is_in_stock,
        rawWeightLabel: p.weight ? `${p.weight}kg` : undefined,
        scrapedAt: now,
      });
    }
    if (data.length < 100) break;
  }
  return out;
}

export function logScraper(vendorId: string, ...args: unknown[]) {
  console.log(`[${vendorId}]`, ...args);
}
