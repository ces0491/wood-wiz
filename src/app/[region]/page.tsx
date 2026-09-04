import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductBrowser from "@/components/ProductBrowser";
import RememberRegion from "@/components/RememberRegion";
import { loadProducts } from "@/lib/load-products";
import { REGIONS, getRegion } from "@/lib/regions";
import { VENDORS } from "@/lib/vendors";
import { forRegion } from "@/lib/vendor-stats";

// One page per metro in the registry, prerendered; anything else 404s rather
// than rendering an empty catalogue under a city name we don't cover.
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
    title: `${region.name} firewood prices per kg — Wood Wiz`,
    description: `Compare braai, fireplace and smoking wood prices across ${vendors.length} ${region.name} vendors, normalised to rand per kilogram. Daily refresh, no affiliate links.`,
    alternates: { canonical: `/${region.id}` },
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region: id } = await params;
  const region = getRegion(id);
  if (!region) notFound();

  const data = await loadProducts();
  const { products, vendors } = forRegion(region.id, data.products, VENDORS);

  return (
    <>
      <RememberRegion region={region.id} />
      <ProductBrowser
        region={region}
        products={products}
        vendors={vendors}
        generatedAt={data.generatedAt}
        vendorRunStatus={data.vendorRunStatus}
      />
    </>
  );
}
