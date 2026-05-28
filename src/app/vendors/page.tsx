import type { Metadata } from "next";
import VendorComparison from "@/components/VendorComparison";
import { loadProducts } from "@/lib/load-products";
import { VENDORS } from "@/lib/vendors";
import { computeHighlights, computeVendorStats } from "@/lib/vendor-stats";

export const metadata: Metadata = {
  title: "Vendor comparison — Wood Wiz",
  description:
    "Compare 8 Cape Town firewood vendors by typical price per kg, species variety, active sales, and delivery rules.",
};

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
