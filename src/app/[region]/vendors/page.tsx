import type { Metadata } from "next";
import { notFound } from "next/navigation";

import VendorComparison from "@/components/VendorComparison";
import RememberRegion from "@/components/RememberRegion";
import { loadProducts } from "@/lib/load-products";
import { REGIONS, getRegion } from "@/lib/regions";
import { VENDORS } from "@/lib/vendors";
import { computeHighlights, computeVendorStats, forRegion } from "@/lib/vendor-stats";

export function generateStaticParams() {
  return REGIONS.map((r) => ({ region: r.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region: id } = await params;
  const region = getRegion(id);
  if (!region) return {};
  const { vendors } = forRegion(region.id, [], VENDORS);
  return {
    title: `${region.name} vendor comparison — Wood Wiz`,
    description: `Compare ${vendors.length} ${region.name} firewood vendors by typical price per kg, species variety, active sales, and delivery rules.`,
    alternates: { canonical: `/${region.id}/vendors` },
  };
}

export default async function RegionVendorsPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region: id } = await params;
  const region = getRegion(id);
  if (!region) notFound();

  const data = await loadProducts();
  // Stats are computed from this metro's slice only. Ranking a vendor against
  // sellers who don't deliver to the same doorstep would compare cities.
  const { products, vendors } = forRegion(region.id, data.products, VENDORS);
  const stats = computeVendorStats(products, vendors);
  const highlights = computeHighlights(stats, vendors, products);

  return (
    <>
      <RememberRegion region={region.id} />
      <VendorComparison
        region={region}
        vendors={vendors}
        stats={stats}
        highlights={highlights}
        totalProducts={products.length}
        generatedAt={data.generatedAt}
      />
    </>
  );
}
