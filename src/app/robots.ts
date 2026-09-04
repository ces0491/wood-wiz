import type { MetadataRoute } from "next";

import { IS_PRODUCTION, SITE_URL } from "@/lib/site";

/**
 * The crawl policy.
 *
 * Production invites the whole site: a handful of pages and no API surface,
 * and the generated image routes cost a crawler nothing to skip on their own.
 *
 * A preview deployment refuses everything. It serves production's content on a
 * different hostname, which competes with production for the same queries.
 */
export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
