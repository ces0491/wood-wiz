import { scrapeShopify } from "./shared";
export const vendorId = "cape-town-firewood";
export async function scrape() {
  return scrapeShopify(vendorId, "https://capetownfirewood.co.za");
}
