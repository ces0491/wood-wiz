import type { Metadata } from "next";
import RegionPicker, { type RegionCard } from "@/components/RegionPicker";
import { loadProducts } from "@/lib/load-products";
import { REGIONS } from "@/lib/regions";
import { VENDORS } from "@/lib/vendors";
import { forRegion } from "@/lib/vendor-stats";

/**
 * Only the canonical: the title, description and Open Graph fields are the
 * layout's defaults and are inherited.
 *
 * Every page names its own canonical rather than the root layout naming one
 * for all of them. A layout-level canonical is inherited by any page that does
 * not override it, so a page added without one would silently claim to be the
 * home page — and a wrong canonical costs a page its indexing where a missing
 * one only fails to consolidate.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const data = await loadProducts();

  const cards: RegionCard[] = REGIONS.map((region) => {
    const { products, vendors } = forRegion(region.id, data.products, VENDORS);
    return { region, productCount: products.length, vendorCount: vendors.length };
  });

  return <RegionPicker cards={cards} />;
}
