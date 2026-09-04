import { scrapeWooCommerce } from "./shared";
export const vendorId = "stompies";
// Most of this storefront is fireplaces and stoves listed at price 0 for
// enquiry; extractWooPrice drops those before they reach normalize(), so the
// yield the sanity gate measures is against the priced items only.
export async function scrape() {
  return scrapeWooCommerce(vendorId, "https://www.stompieswood.com");
}
