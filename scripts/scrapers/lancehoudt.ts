import { scrapeWooCommerce } from "./shared";
export const vendorId = "lancehoudt";
export async function scrape() {
  return scrapeWooCommerce(vendorId, "https://lancehoudt.co.za");
}
