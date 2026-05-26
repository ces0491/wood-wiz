import { scrapeWooCommerce } from "./shared";
export const vendorId = "namibian-hardwood";
export async function scrape() {
  return scrapeWooCommerce(vendorId, "https://namibianhardwood.co.za");
}
