import ProductBrowser from "@/components/ProductBrowser";
import { loadProducts } from "@/lib/load-products";
import { VENDORS } from "@/lib/vendors";

export default async function Page() {
  const data = await loadProducts();
  return (
    <ProductBrowser
      products={data.products}
      vendors={VENDORS}
      generatedAt={data.generatedAt}
      vendorRunStatus={data.vendorRunStatus}
    />
  );
}
