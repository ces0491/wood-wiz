/**
 * The origin this deployment should advertise as its own.
 *
 * A preview deployment should advertise itself rather than production, so
 * `VERCEL_URL` wins there; on production that variable holds the deployment's
 * own generated hostname rather than the alias, which is why the canonical
 * origin is named and takes precedence.
 *
 * Read by the metadata base, the sitemap and the robots file. Those three
 * disagreeing would publish canonical URLs, a sitemap and a crawl policy
 * pointing at different hosts, so the value is defined once.
 *
 * The production fallback is the custom domain, not the `wood-wiz.vercel.app`
 * host the site moved off on 2026-09-04. `NEXT_PUBLIC_SITE_URL` overrides it
 * where a deployment genuinely serves somewhere else.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_ENV === "production"
    ? "https://woodwiz.sheetsolved.com"
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

/**
 * Whether this deployment is the public production one.
 *
 * A preview build must not invite indexing: it serves the same content on a
 * different hostname, which is duplicate content competing with production for
 * the same queries.
 */
export const IS_PRODUCTION = process.env.VERCEL_ENV === "production";
