import type { WoodSpecies, WoodUsage } from "./types";

interface SpeciesInfo {
  id: WoodSpecies;
  displayName: string;
  aliases: string[];
  densityKgPerM3: number;
  usage: WoodUsage;
  // Tailwind background class for a 6px color dot in the UI. Hints at the
  // wood's visual character where the name suggests one (red gum → red);
  // otherwise an earthy tone.
  color: string;
  // Audit trail for the density figure. Lets us defend a per-kg number if
  // a vendor disputes it. Most entries are "industry-typical estimate"
  // because the South African indigenous-wood literature is thin;
  // contributions of cited sources welcome via GitHub.
  densitySource: string;
}

// Approximate air-dry densities (kg/m^3). These are mid-range estimates and
// are used only when a vendor doesn't state the bag weight directly. Products
// whose weight is derived from these are flagged `weightEstimated: true` in
// the UI.
//
// Density methodology:
// - Air-dry, ~12% moisture content. Green wood is substantially heavier
//   (often 30–50% more); we assume vendors sell seasoned wood.
// - Values are mid-range estimates that match what South African firewood
//   vendors commonly cite. They are NOT pinned to specific cited sources.
// - Recommended sources for future tightening: FAO Global Wood Density
//   Database (Zanne et al., 2009) for widespread genera; Wagenführ's
//   Holzatlas for Northern Hemisphere species; SANBI / national herbarium
//   records for South African indigenous species.
//
// Auditability bar: every entry has a `densitySource` field. If you can
// replace an "industry-typical estimate" with a real citation, PRs welcome.
const ESTIMATE = "industry-typical estimate; air-dry; ranges with provenance";

export const SPECIES: Record<WoodSpecies, SpeciesInfo> = {
  kameeldoring: {
    id: "kameeldoring",
    displayName: "Kameeldoring (Camel Thorn)",
    aliases: [
      "kameeldoring",
      "kameel doring",
      "kameelhout",
      "kameel hout",
      "camel thorn",
      "camelthorn",
      "vachellia erioloba",
    ],
    densityKgPerM3: 1150,
    usage: "both",
    color: "bg-yellow-600",
    densitySource: ESTIMATE,
  },
  sekelbos: {
    id: "sekelbos",
    displayName: "Sekelbos (Sickle Bush)",
    aliases: ["sekelbos", "sickle bush", "dichrostachys"],
    densityKgPerM3: 950,
    usage: "both",
    color: "bg-green-700",
    densitySource: ESTIMATE,
  },
  mopane: {
    id: "mopane",
    displayName: "Mopane",
    aliases: ["mopane", "mopani", "mupani", "mupane", "colophospermum"],
    densityKgPerM3: 1150,
    usage: "both",
    color: "bg-amber-800",
    densitySource: ESTIMATE,
  },
  rooikrans: {
    id: "rooikrans",
    displayName: "Rooikrans",
    aliases: ["rooikrans", "rooi krans", "red eye", "acacia cyclops"],
    densityKgPerM3: 750,
    usage: "braai",
    color: "bg-orange-700",
    densitySource: ESTIMATE,
  },
  "black-wattle": {
    id: "black-wattle",
    displayName: "Black Wattle",
    aliases: ["black wattle", "wattle", "acacia mearnsii"],
    densityKgPerM3: 700,
    usage: "both",
    color: "bg-stone-800",
    densitySource: ESTIMATE,
  },
  "blue-gum": {
    id: "blue-gum",
    displayName: "Blue Gum",
    aliases: ["blue gum", "bluegum", "eucalyptus globulus", "eucalyptus"],
    densityKgPerM3: 800,
    usage: "both",
    color: "bg-sky-600",
    densitySource: ESTIMATE,
  },
  "red-gum": {
    id: "red-gum",
    displayName: "Red Gum",
    aliases: ["red gum", "redgum", "eucalyptus camaldulensis"],
    densityKgPerM3: 850,
    usage: "both",
    color: "bg-red-600",
    densitySource: ESTIMATE,
  },
  swarthaak: {
    id: "swarthaak",
    displayName: "Swarthaak (Black Thorn)",
    aliases: ["swarthaak", "swart haak", "black thorn", "senegalia mellifera"],
    densityKgPerM3: 950,
    usage: "both",
    color: "bg-stone-700",
    densitySource: ESTIMATE,
  },
  soetdoring: {
    id: "soetdoring",
    displayName: "Soetdoring (Sweet Thorn)",
    aliases: ["soetdoring", "soet doring", "sweet thorn", "vachellia karroo"],
    densityKgPerM3: 950,
    usage: "both",
    color: "bg-amber-500",
    densitySource: ESTIMATE,
  },
  "port-jackson": {
    id: "port-jackson",
    displayName: "Port Jackson",
    aliases: ["port jackson", "port-jackson", "acacia saligna"],
    densityKgPerM3: 700,
    usage: "braai",
    color: "bg-lime-700",
    densitySource: ESTIMATE,
  },
  "rooibos-hardwood": {
    id: "rooibos-hardwood",
    displayName: "Rooibos Hardwood (Red Bushwillow)",
    aliases: [
      "rooibos hardwood",
      "rooibos south african",
      "red bushwillow",
      "combretum apiculatum",
      "rooibos braai",
      "rooibos wood",
      "rooibos",
    ],
    densityKgPerM3: 950,
    usage: "both",
    color: "bg-red-800",
    densitySource: ESTIMATE,
  },
  "grape-vine": {
    id: "grape-vine",
    displayName: "Grape Vine (Wingerdstompies)",
    aliases: [
      "wingerd stompies",
      "wingerdstompies",
      "wingerd stompe",
      "wingerd",
      "grape vine",
      "grapevine",
      "vine wood",
      "vine/wingerd",
    ],
    densityKgPerM3: 700,
    usage: "smoking",
    color: "bg-purple-700",
    densitySource: ESTIMATE,
  },
  beefwood: {
    id: "beefwood",
    displayName: "Beefwood",
    aliases: ["beefwood", "beef wood", "casuarina"],
    densityKgPerM3: 850,
    usage: "both",
    color: "bg-rose-700",
    densitySource: ESTIMATE,
  },
  oak: {
    id: "oak",
    displayName: "Oak",
    aliases: ["oak", "eikehout", "quercus"],
    densityKgPerM3: 750,
    usage: "fireplace",
    color: "bg-amber-700",
    densitySource: ESTIMATE,
  },
  olive: {
    id: "olive",
    displayName: "Olive",
    aliases: ["olive", "olienhout", "olea europaea"],
    densityKgPerM3: 950,
    usage: "both",
    color: "bg-emerald-700",
    densitySource: ESTIMATE,
  },
  pine: {
    id: "pine",
    displayName: "Pine",
    aliases: ["pine", "den", "pinus"],
    densityKgPerM3: 500,
    usage: "braai",
    color: "bg-green-800",
    densitySource: ESTIMATE,
  },
  plum: {
    id: "plum",
    displayName: "Plum",
    aliases: ["plum", "pruim"],
    densityKgPerM3: 750,
    usage: "smoking",
    color: "bg-purple-800",
    densitySource: ESTIMATE,
  },
  marula: {
    id: "marula",
    displayName: "Marula",
    aliases: ["marula", "sclerocarya"],
    densityKgPerM3: 600,
    usage: "smoking",
    color: "bg-yellow-700",
    densitySource: ESTIMATE,
  },
  karee: {
    id: "karee",
    displayName: "Karee",
    aliases: ["karee", "searsia lancea"],
    densityKgPerM3: 850,
    usage: "both",
    color: "bg-stone-600",
    densitySource: ESTIMATE,
  },
  myrtle: {
    id: "myrtle",
    displayName: "Myrtle",
    aliases: ["myrtle"],
    densityKgPerM3: 700,
    usage: "both",
    color: "bg-emerald-600",
    densitySource: ESTIMATE,
  },
  cherry: {
    id: "cherry",
    displayName: "Cherry",
    aliases: ["cherry"],
    densityKgPerM3: 650,
    usage: "smoking",
    color: "bg-pink-700",
    densitySource: ESTIMATE,
  },
  pecan: {
    id: "pecan",
    displayName: "Pecan",
    aliases: ["pecan"],
    densityKgPerM3: 750,
    usage: "smoking",
    color: "bg-amber-600",
    densitySource: ESTIMATE,
  },
  macadamia: {
    id: "macadamia",
    displayName: "Macadamia",
    aliases: ["macadamia"],
    densityKgPerM3: 800,
    usage: "smoking",
    color: "bg-orange-400",
    densitySource: ESTIMATE,
  },
  mesquite: {
    id: "mesquite",
    displayName: "Mesquite",
    aliases: ["mesquite", "prosopis"],
    densityKgPerM3: 850,
    usage: "smoking",
    color: "bg-stone-700",
    densitySource: ESTIMATE,
  },
  "namibian-hardwood-mix": {
    id: "namibian-hardwood-mix",
    displayName: "Namibian Hardwood Mix",
    aliases: ["namibian mix", "namibian hardwood", "nam mix"],
    densityKgPerM3: 950,
    usage: "both",
    color: "bg-amber-900",
    densitySource: ESTIMATE,
  },
  "doring-mix": {
    id: "doring-mix",
    displayName: "Doring Mix",
    aliases: ["doring mix", "thorn mix"],
    densityKgPerM3: 1000,
    usage: "both",
    color: "bg-yellow-800",
    densitySource: ESTIMATE,
  },
  "smoking-mix": {
    id: "smoking-mix",
    displayName: "Smoking Wood Mix",
    aliases: ["smoking wood chunks", "smoking chunks", "smoking wood"],
    densityKgPerM3: 750,
    usage: "smoking",
    color: "bg-stone-500",
    densitySource: ESTIMATE,
  },
  unknown: {
    id: "unknown",
    displayName: "Unknown / Mixed",
    aliases: [],
    densityKgPerM3: 800,
    usage: "both",
    color: "bg-stone-400",
    densitySource: ESTIMATE,
  },
};

const ALL_SPECIES = Object.values(SPECIES);

export function detectSpecies(text: string): WoodSpecies {
  const lower = text.toLowerCase();
  const byLength = ALL_SPECIES.flatMap((s) =>
    s.aliases.map((alias) => ({ id: s.id, alias: alias.toLowerCase() })),
  ).sort((a, b) => b.alias.length - a.alias.length);

  for (const { id, alias } of byLength) {
    if (lower.includes(alias)) return id;
  }
  return "unknown";
}

export function getSpecies(id: WoodSpecies): SpeciesInfo {
  return SPECIES[id];
}

export function listSpecies(): SpeciesInfo[] {
  return ALL_SPECIES.filter((s) => s.id !== "unknown");
}
