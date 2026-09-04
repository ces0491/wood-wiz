import type { Vendor } from "./types";

export const VENDORS: Vendor[] = [
  {
    id: "mother-city-firewood",
    name: "Mother City Firewood",
    url: "https://www.mothercityfirewood.co.za",
    platform: "shopify",
    regions: ["cape-town"],
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
    regions: ["cape-town"],
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
    regions: ["cape-town"],
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
    regions: ["cape-town"],
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
    regions: ["cape-town"],
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
    regions: ["cape-town"],
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
    regions: ["cape-town"],
    delivery: {
      description: "Free delivery over R1,000 in Cape Town & surrounds.",
      pricing: "free-over-threshold",
      freeOverZar: 1000,
    },
  },
  {
    id: "just-get-wood",
    name: "Just Get Wood",
    url: "https://justgetwood.co.za",
    platform: "woocommerce",
    regions: ["johannesburg"],
    delivery: {
      // Their own wording: "in Gauteng, covering the Greater Johannesburg area,
      // North Rand, East Rand, South Rand, West Rand, Centurion, Parts of
      // Pretoria... Anywhere within a 50km radius from our warehouse." No fee
      // schedule, threshold or stacking policy is published.
      description:
        "Gauteng — Greater Johannesburg, East/West/North/South Rand, Centurion and parts of Pretoria, within 50 km of their warehouse.",
      pricing: "by-quote",
      zoneNote: "Within 50 km of the warehouse",
    },
  },
  {
    id: "stompies",
    name: "Stompies",
    url: "https://www.stompieswood.com",
    platform: "woocommerce",
    // Listed in both metros because their delivery page names both: Pretoria
    // and Johannesburg in Gauteng, and Cape Town CBD, Southern Suburbs,
    // Northern Suburbs, Atlantic Seaboard, Somerset West, Stellenbosch,
    // Franschhoek, Paarl and the Garden Route in the Western Cape.
    regions: ["cape-town", "johannesburg"],
    delivery: {
      description:
        "Cape Town, the Winelands and the Garden Route, plus Johannesburg and Pretoria. Delivery in 1–5 business days; fee confirmed at checkout.",
      pricing: "by-zone",
      zoneNote: "By metro",
      // Stacking deliberately unset. Their copy says wood is "neatly stacked
      // and arranged by our professional team", but in context that describes
      // how bags are packed before dispatch, not stacking at your door. The
      // badge is positive-confirmation-only, so an ambiguous claim earns none.
    },
  },
  {
    id: "wood-bros",
    name: "The Wood Bros",
    url: "https://www.thewoodbros.co.za",
    platform: "wix",
    regions: ["cape-town"],
    delivery: {
      description: "Cape Town delivery — fee confirmed at checkout.",
      pricing: "by-quote",
    },
  },
];

export function getVendor(id: string): Vendor | undefined {
  return VENDORS.find((v) => v.id === id);
}
