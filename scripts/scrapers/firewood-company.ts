import { scrapeWooCommerce } from "./shared";
export const vendorId = "firewood-company";
export async function scrape() {
  return scrapeWooCommerce(vendorId, "https://thefirewoodcompany.co.za");
}
