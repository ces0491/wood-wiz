import { scrapeShopify } from "./shared";
export const vendorId = "wood-gurus";
export async function scrape() {
  return scrapeShopify(vendorId, "https://thewoodgurus.co.za");
}
