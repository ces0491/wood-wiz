import { scrapeWooCommerce } from "./shared";
export const vendorId = "just-get-wood";
export async function scrape() {
  return scrapeWooCommerce(vendorId, "https://justgetwood.co.za");
}
