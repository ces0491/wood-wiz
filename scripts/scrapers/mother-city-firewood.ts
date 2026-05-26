import { scrapeShopify } from "./shared";
export const vendorId = "mother-city-firewood";
export async function scrape() {
  return scrapeShopify(vendorId, "https://www.mothercityfirewood.co.za");
}
