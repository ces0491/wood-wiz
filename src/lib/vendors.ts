import type { Vendor } from "./types";

export const VENDORS: Vendor[] = [
  {
    id: "mother-city-firewood",
    name: "Mother City Firewood",
    url: "https://www.mothercityfirewood.co.za",
    platform: "shopify",
    region: "cape-town",
    delivery: {
      description: "Free delivery & stacking over R1,000. R100 flat fee under R1,000.",
      pricing: "free-over-threshold",
      freeOverZar: 1000,
      flatFeeZar: 100,
      stacking: "free-over-threshold",
    },
  },
  {
    id: "wood-gurus",
    name: "The Wood Gurus",
    url: "https://thewoodgurus.co.za",
    platform: "shopify",
    region: "cape-town",
    delivery: {
      description: "Cape Town delivery — fee varies by zone, confirm at checkout.",
      pricing: "by-zone",
      zoneNote: "Varies by suburb",
    },
  },
  {
    id: "cape-town-firewood",
    name: "Cape Town Firewood (CTF)",
    url: "https://capetownfirewood.co.za",
    platform: "shopify",
    region: "cape-town",
    delivery: {
      description: "R250 minimum spend excluding delivery. Up to 2-ton local delivery.",
      pricing: "by-quote",
      minOrderZar: 250,
    },
  },
  {
    id: "firewood-company",
    name: "The Firewood Company",
    url: "https://thefirewoodcompany.co.za",
    platform: "woocommerce",
    region: "cape-town",
    delivery: {
      description: "Northern/Southern Suburbs, Atlantic Seaboard, CBD, Winelands.",
      pricing: "by-zone",
      zoneNote: "By region",
    },
  },
  {
    id: "fire-man",
    name: "The Fire Man",
    url: "https://thefireman.co.za",
    platform: "woocommerce",
    region: "cape-town",
    delivery: {
      description: "Cape Town delivery service. Fees confirmed at checkout.",
      pricing: "by-quote",
    },
  },
  {
    id: "lancehoudt",
    name: "Lancehoudt",
    url: "https://lancehoudt.co.za",
    platform: "woocommerce",
    region: "cape-town",
    delivery: {
      description: "Delivered and stacked. West Coast, Boland, Cape Town.",
      pricing: "by-zone",
      zoneNote: "By region",
      stacking: "free",
    },
  },
  {
    id: "namibian-hardwood",
    name: "Namibian Hardwood",
    url: "https://namibianhardwood.co.za",
    platform: "woocommerce",
    region: "cape-town",
    delivery: {
      description: "Free delivery over R1,000 in Cape Town & surrounds.",
      pricing: "free-over-threshold",
      freeOverZar: 1000,
    },
  },
  {
    id: "wood-bros",
    name: "The Wood Bros",
    url: "https://www.thewoodbros.co.za",
    platform: "wix",
    region: "cape-town",
    delivery: {
      description: "Cape Town delivery — fee confirmed at checkout.",
      pricing: "by-quote",
    },
  },
];

export function getVendor(id: string): Vendor | undefined {
  return VENDORS.find((v) => v.id === id);
}
