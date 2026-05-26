import { scrapeWooCommerce } from "./shared";
export const vendorId = "fire-man";
export async function scrape() {
  return scrapeWooCommerce(vendorId, "https://thefireman.co.za");
}
