import type { Product, Vendor, WoodSpecies } from "./types";
import type { RegionId } from "./regions";

/**
 * The vendors serving a metro, and the products a reader there can actually buy.
 *
 * Every comparison on the site is within one metro: vendors are ranked against
 * the others delivering to the same doorstep, never against another city's.
 * Cape Town bulk runs R 1–5/kg against Gauteng's R 4–11, and a combined
 * ranking would read as a verdict on the vendors when it is a fact about
 * distance from the source.
 *
 * A vendor serving two metros appears in both with the same catalogue — one
 * storefront, one set of prices — so their figures are identical on each page
 * and are still only ever compared with that page's other vendors.
 */
export function forRegion(
  region: RegionId,
  products: Product[],
  vendors: Vendor[],
): { products: Product[]; vendors: Vendor[] } {
  const inRegion = vendors.filter((v) => v.regions.includes(region));
  const ids = new Set(inRegion.map((v) => v.id));
  return { products: products.filter((p) => ids.has(p.vendorId)), vendors: inRegion };
}

export interface VendorStats {
  vendorId: string;
  productCount: number;
  inStockCount: number;
  speciesCount: number;
  speciesList: WoodSpecies[];
  avgPricePerKgZar: number;
  medianPricePerKgZar: number;
  minPricePerKgZar: number;
  maxPricePerKgZar: number;
  cheapestProduct: Product;
  salesCount: number;
  // True only when at least one product from this vendor has a
  // regularPriceZar captured. Vendors whose scraper / API doesn't expose
  // a regular price (Lancehoudt's variable products, WooCommerce variable
  // products generally, Wix scraper which skips the field) get false here,
  // and salesCount of 0 means "unknown", not "no sales".
  hasSalesData: boolean;
}

// Fewest products a vendor can have and still be eligible for the "cheapest
// typical price" spotlight. Below this the median is describing too small a
// catalogue to call typical.
export const MIN_SPOTLIGHT_SAMPLE = 8;

export interface ComparisonHighlights {
  cheapestMedian: VendorStats | null;
  mostVariety: VendorStats | null;
  mostSales: VendorStats | null;
  cheapestSingleProduct: Product | null;
  freeStackingVendorIds: string[];
  freeDeliveryThresholds: { vendorId: string; threshold: number }[];
}

export function computeVendorStats(products: Product[], vendors: Vendor[]): VendorStats[] {
  const out: VendorStats[] = [];
  for (const v of vendors) {
    const vProducts = products.filter((p) => p.vendorId === v.id);
    if (vProducts.length === 0) continue;
    const inStock = vProducts.filter((p) => p.inStock);
    const sorted = [...vProducts].sort((a, b) => a.pricePerKgZar - b.pricePerKgZar);
    const speciesSet = new Set<WoodSpecies>(vProducts.map((p) => p.species));
    const ppk = vProducts.map((p) => p.pricePerKgZar);
    const sum = ppk.reduce((a, b) => a + b, 0);
    const mid = Math.floor(ppk.length / 2);
    const sortedPpk = [...ppk].sort((a, b) => a - b);
    const median =
      ppk.length % 2 === 0 ? (sortedPpk[mid - 1] + sortedPpk[mid]) / 2 : sortedPpk[mid];

    out.push({
      vendorId: v.id,
      productCount: vProducts.length,
      inStockCount: inStock.length,
      speciesCount: speciesSet.size,
      speciesList: [...speciesSet],
      avgPricePerKgZar: sum / ppk.length,
      medianPricePerKgZar: median,
      minPricePerKgZar: sorted[0].pricePerKgZar,
      maxPricePerKgZar: sorted[sorted.length - 1].pricePerKgZar,
      cheapestProduct: sorted[0],
      salesCount: vProducts.filter(
        (p) => p.regularPriceZar !== undefined && p.regularPriceZar > p.priceZar && p.inStock,
      ).length,
      hasSalesData: vProducts.some((p) => p.regularPriceZar !== undefined),
    });
  }
  return out;
}

export function computeHighlights(
  stats: VendorStats[],
  vendors: Vendor[],
  products: Product[],
): ComparisonHighlights {
  if (stats.length === 0) {
    return {
      cheapestMedian: null,
      mostVariety: null,
      mostSales: null,
      cheapestSingleProduct: null,
      freeStackingVendorIds: [],
      freeDeliveryThresholds: [],
    };
  }
  // Use median rather than mean: vendors that sell both bulk pallets (R 2-5/kg)
  // and specialty smoking boxes (R 100+/kg) would otherwise rank as expensive
  // on the mean even though their bulk pricing is competitive.
  //
  // The spotlight also needs a sample floor. A median over a handful of
  // products is not a "typical price" — The Wood Gurus normalise to 8 listings
  // because most of their catalogue is a per-piece configurator, and a vendor
  // with four products could take the headline off one with two hundred.
  // Vendors below the floor still appear in every chart and breakdown card,
  // with their product count shown; they just can't win the award.
  //
  // It takes **two** eligible vendors to award it at all. With one, "cheapest"
  // ranks a field of one and the card states the opposite of what it means:
  // on Johannesburg's first run the floor excluded Just Get Wood at R 3.91/kg
  // for having five products, which would have handed "cheapest typical price"
  // to the only survivor — Stompies, at R 9.66/kg, two and a half times dearer.
  // A superlative over a set of one is not a superlative.
  const byMedian = [...stats].sort((a, b) => a.medianPricePerKgZar - b.medianPricePerKgZar);
  const eligible = byMedian.filter((s) => s.productCount >= MIN_SPOTLIGHT_SAMPLE);
  const cheapestMedian = eligible.length >= 2 ? eligible[0] : null;
  const mostVariety = [...stats].sort((a, b) => b.speciesCount - a.speciesCount)[0];
  const mostSales = [...stats].sort((a, b) => b.salesCount - a.salesCount)[0];
  const cheapestSingleProduct = [...products]
    .filter((p) => p.inStock)
    .sort((a, b) => a.pricePerKgZar - b.pricePerKgZar)[0];
  const freeStackingVendorIds = vendors
    .filter((v) => v.delivery.stacking === "free" || v.delivery.stacking === "free-over-threshold")
    .map((v) => v.id);
  const freeDeliveryThresholds = vendors
    .filter((v) => v.delivery.freeOverZar !== undefined)
    .map((v) => ({ vendorId: v.id, threshold: v.delivery.freeOverZar! }))
    .sort((a, b) => a.threshold - b.threshold);

  return {
    cheapestMedian,
    mostVariety,
    mostSales: mostSales.salesCount > 0 ? mostSales : null,
    cheapestSingleProduct: cheapestSingleProduct ?? null,
    freeStackingVendorIds,
    freeDeliveryThresholds,
  };
}
