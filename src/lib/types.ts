export type WoodUsage = "braai" | "fireplace" | "smoking" | "both";

export type PackFormat = "bag" | "loose" | "bundle" | "pieces" | "pallet" | "bakkie";

export type WoodSpecies =
  | "kameeldoring"
  | "sekelbos"
  | "mopane"
  | "rooikrans"
  | "black-wattle"
  | "blue-gum"
  | "red-gum"
  | "swarthaak"
  | "soetdoring"
  | "port-jackson"
  | "rooibos-hardwood"
  | "grape-vine"
  | "beefwood"
  | "oak"
  | "olive"
  | "pine"
  | "plum"
  | "marula"
  | "karee"
  | "myrtle"
  | "cherry"
  | "pecan"
  | "macadamia"
  | "mesquite"
  | "namibian-hardwood-mix"
  | "doring-mix"
  | "smoking-mix"
  | "unknown";

export interface ScrapedProduct {
  vendorId: string;
  externalId: string;
  title: string;
  url: string;
  imageUrl?: string;
  priceZar: number;
  // Set only for variable products whose variants span a range (e.g. one
  // product with different prices per delivery zone). When set, priceZar is
  // the minimum and maxPriceZar is the maximum across variants.
  maxPriceZar?: number;
  regularPriceZar?: number;
  inStock: boolean;
  rawWeightLabel?: string;
  scrapedAt: string;
}

export interface Product {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  url: string;
  imageUrl?: string;
  species: WoodSpecies;
  usage: WoodUsage;
  packFormat: PackFormat;
  priceZar: number;
  maxPriceZar?: number;
  regularPriceZar?: number;
  weightKg: number;
  pricePerKgZar: number;
  maxPricePerKgZar?: number;
  weightEstimated: boolean;
  inStock: boolean;
  scrapedAt: string;
}

// How a vendor's delivery pricing works at a structural level. Required so
// every vendor is explicitly classified instead of falling through to the
// freeform `description` string. We don't compute delivered totals (see
// SCOPE: "Computed delivered totals" is out of scope) but knowing the
// pricing model lets us surface the right badges and would be the right
// foundation if SCOPE ever changes.
export type DeliveryPricing =
  | "free-over-threshold" // Free over a stated rand value, fee below
  | "flat" // Single flat fee regardless of zone or value
  | "by-zone" // Per-suburb / per-region; pricing decided at checkout
  | "by-quote"; // No public pricing; vendor confirms after order

export interface DeliveryRule {
  description: string;
  pricing: DeliveryPricing;
  freeOverZar?: number;
  flatFeeZar?: number;
  minOrderZar?: number;
  zoneNote?: string;
  stacking?: "free" | "free-over-threshold" | "extra" | "unknown";
}

export interface Vendor {
  id: string;
  name: string;
  url: string;
  platform: "shopify" | "woocommerce" | "wix" | "custom";
  region: "cape-town";
  delivery: DeliveryRule;
  notes?: string;
}

export interface ProductsFile {
  generatedAt: string;
  products: Product[];
  vendorRunStatus: Record<
    string,
    {
      ok: boolean;
      count: number;
      rawCount?: number;
      error?: string;
      ranAt: string;
    }
  >;
}
