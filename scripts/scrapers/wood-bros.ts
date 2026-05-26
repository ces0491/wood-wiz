import * as cheerio from "cheerio";
import { fetchText, logScraper } from "./shared";
import type { ScrapedProduct } from "../../src/lib/types";

export const vendorId = "wood-bros";

const SITEMAP = "https://www.thewoodbros.co.za/store-products-sitemap.xml";

function extractUrlsFromSitemap(xml: string): string[] {
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return matches.map((m) => m[1].trim()).filter((u) => u.includes("/product-page/"));
}

async function scrapeOne(url: string): Promise<ScrapedProduct | null> {
  const html = await fetchText(url);
  const $ = cheerio.load(html);

  const ogTitle = $('meta[property="og:title"]').attr("content") ?? "";
  const title = ogTitle.replace(/\s*\|\s*The Wood Bros\s*$/i, "").trim();
  const priceStr = $('meta[property="product:price:amount"]').attr("content") ?? "";
  const currency = $('meta[property="product:price:currency"]').attr("content") ?? "";

  if (!title || !priceStr || currency.toUpperCase() !== "ZAR") return null;
  const price = parseFloat(priceStr);
  if (!Number.isFinite(price) || price <= 0) return null;

  // Availability via JSON-LD Offer
  let inStock = true;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text()) as { Offers?: { Availability?: string } };
      const avail = data?.Offers?.Availability ?? "";
      if (avail.toLowerCase().includes("outofstock")) inStock = false;
    } catch {
      // ignore malformed JSON-LD
    }
  });

  const slug = url.split("/product-page/")[1] ?? url;
  const image = $('meta[property="og:image"]').attr("content");

  return {
    vendorId,
    externalId: slug,
    title,
    url,
    imageUrl: image,
    priceZar: price,
    inStock,
    rawWeightLabel: title,
    scrapedAt: new Date().toISOString(),
  };
}

export async function scrape(): Promise<ScrapedProduct[]> {
  const sitemap = await fetchText(SITEMAP);
  const urls = extractUrlsFromSitemap(sitemap);
  logScraper(vendorId, `discovered ${urls.length} product URLs from sitemap`);

  const out: ScrapedProduct[] = [];
  // Sequential to be polite — Wix sites can rate-limit aggressive crawls.
  for (const url of urls) {
    try {
      const p = await scrapeOne(url);
      if (p) out.push(p);
    } catch (err) {
      logScraper(vendorId, `failed ${url}: ${err instanceof Error ? err.message : err}`);
    }
  }
  return out;
}
