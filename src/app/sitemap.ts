import type { MetadataRoute } from "next";

import { loadProducts } from "@/lib/load-products";
import { REGIONS } from "@/lib/regions";
import { SITE_URL } from "@/lib/site";

/**
 * When the catalogue behind the price pages last moved.
 *
 * A missing or unreadable payload contributes no date rather than failing the
 * build: a sitemap is a discovery aid, and losing a `lastmod` costs far less
 * than losing the deployment.
 *
 * `generatedAt` is written by the scraper as an ISO instant with a `Z`, which
 * is already valid W3C Datetime. That matters more than it looks — a `lastmod`
 * carrying a time but no timezone designator is discarded whole rather than
 * approximated, so an unzoned stamp is worth exactly as much as no stamp.
 */
async function catalogueUpdatedAt(): Promise<string | undefined> {
  try {
    return (await loadProducts()).generatedAt;
  } catch {
    return undefined;
  }
}

/**
 * Every page a crawler should know about: the metro picker, two pages per
 * metro, and the methodology.
 *
 * Listing each metro separately is the point of the per-city routes — a single
 * URL cannot rank for "firewood prices johannesburg" and "firewood prices cape
 * town" at once, and each page is a genuinely different catalogue.
 *
 * The date is per group rather than blanket. The picker and the price pages
 * are rendered from `data/products.json` and move when a scrape commits, so
 * they carry its stamp. `/faq` is hand-written copy that changes when someone
 * edits it, and dating it from the price data would tell a crawler to re-read
 * an unchanged page every day. No date is a smaller claim than a wrong one.
 *
 * The generated metadata routes — the icons, the OG image, the manifest — are
 * assets rather than pages and aren't listed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = await catalogueUpdatedAt();

  return [
    { url: `${SITE_URL}/`, lastModified },
    ...REGIONS.flatMap((r) => [
      { url: `${SITE_URL}/${r.id}`, lastModified },
      { url: `${SITE_URL}/${r.id}/vendors`, lastModified },
    ]),
    { url: `${SITE_URL}/faq` },
  ];
}
