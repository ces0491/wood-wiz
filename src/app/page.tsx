import RegionPicker, { type RegionCard } from "@/components/RegionPicker";
import { loadProducts } from "@/lib/load-products";
import { REGIONS } from "@/lib/regions";
import { VENDORS } from "@/lib/vendors";
import { forRegion } from "@/lib/vendor-stats";

export default async function Home() {
  const data = await loadProducts();

  const cards: RegionCard[] = REGIONS.map((region) => {
    const { products, vendors } = forRegion(region.id, data.products, VENDORS);
    return { region, productCount: products.length, vendorCount: vendors.length };
  });

  return <RegionPicker cards={cards} />;
}
