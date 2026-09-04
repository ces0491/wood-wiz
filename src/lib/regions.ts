/**
 * The metros the site publishes prices for.
 *
 * A region is added here and in `vendors.ts` and nothing else changes: the
 * routes, the sitemap, the navigation and the copy are all derived from this
 * list. `/[region]` resolves its static params from `REGIONS`, so a new metro
 * is a data edit rather than a new route file.
 *
 * A metro earns an entry only once it has vendors with a public, machine-
 * readable catalogue — the same bar the FAQ states publicly. Durban and the
 * Garden Route are deliberately absent: as of 2026-09-04 neither has a seller
 * meeting it (KZN retail is Gumtree and Facebook Marketplace listings, and the
 * Garden Route reduces to a single vendor, which is not a comparison).
 */
export type RegionId = "cape-town" | "johannesburg";

export interface Region {
  id: RegionId;
  /** Used in headings, titles and the region chip. */
  name: string;
  /** Where a vendor list for this region actually reaches, in the vendors' own terms. */
  coverage: string;
}

export const REGIONS: Region[] = [
  {
    id: "cape-town",
    name: "Cape Town",
    coverage: "Cape Town, the Winelands and the West Coast",
  },
  {
    id: "johannesburg",
    name: "Johannesburg",
    coverage: "Greater Johannesburg, the East and West Rand, Centurion and Pretoria",
  },
];

/**
 * Where `/` sends a reader who hasn't picked a metro.
 *
 * Cape Town, because it is where the catalogue is deep enough to be worth
 * comparing — not because it came first.
 */
export const DEFAULT_REGION: RegionId = "cape-town";

export function getRegion(id: string): Region | undefined {
  return REGIONS.find((r) => r.id === id);
}

export function isRegionId(id: string): id is RegionId {
  return REGIONS.some((r) => r.id === id);
}
