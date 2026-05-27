import VendorComparison from "@/components/VendorComparison";
import { loadProducts } from "@/lib/load-products";
import { VENDORS } from "@/lib/vendors";
import { computeHighlights, computeVendorStats } from "@/lib/vendor-stats";

export default async function VendorsPage() {
  const data = await loadProducts();
  const stats = computeVendorStats(data.products, VENDORS);
  const highlights = computeHighlights(stats, VENDORS, data.products);
  return (
    <VendorComparison
      vendors={VENDORS}
      stats={stats}
      highlights={highlights}
      totalProducts={data.products.length}
      generatedAt={data.generatedAt}
    />
  );
}
