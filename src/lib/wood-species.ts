import type { WoodSpecies, WoodUsage } from "./types";

interface SpeciesInfo {
  id: WoodSpecies;
  displayName: string;
  aliases: string[];
  densityKgPerM3: number;
  usage: WoodUsage;
}

// Approximate air-dry densities (kg/m^3). These are mid-range estimates from
// general wood-science references and are used only when a vendor doesn't
// state the bag weight directly — products derived this way are flagged
// `weightEstimated: true` in the UI.
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
  },
  sekelbos: {
    id: "sekelbos",
    displayName: "Sekelbos (Sickle Bush)",
    aliases: ["sekelbos", "sickle bush", "dichrostachys"],
    densityKgPerM3: 950,
    usage: "both",
  },
  mopane: {
    id: "mopane",
    displayName: "Mopane",
    aliases: ["mopane", "mopani", "mupani", "mupane", "colophospermum"],
    densityKgPerM3: 1150,
    usage: "both",
  },
  rooikrans: {
    id: "rooikrans",
    displayName: "Rooikrans",
    aliases: ["rooikrans", "rooi krans", "red eye", "acacia cyclops"],
    densityKgPerM3: 750,
    usage: "braai",
  },
  "black-wattle": {
    id: "black-wattle",
    displayName: "Black Wattle",
    aliases: ["black wattle", "wattle", "acacia mearnsii"],
    densityKgPerM3: 700,
    usage: "both",
  },
  "blue-gum": {
    id: "blue-gum",
    displayName: "Blue Gum",
    aliases: ["blue gum", "bluegum", "eucalyptus globulus", "eucalyptus"],
    densityKgPerM3: 800,
    usage: "both",
  },
  "red-gum": {
    id: "red-gum",
    displayName: "Red Gum",
    aliases: ["red gum", "redgum", "eucalyptus camaldulensis"],
    densityKgPerM3: 850,
    usage: "both",
  },
  swarthaak: {
    id: "swarthaak",
    displayName: "Swarthaak (Black Thorn)",
    aliases: ["swarthaak", "swart haak", "black thorn", "senegalia mellifera"],
    densityKgPerM3: 950,
    usage: "both",
  },
  soetdoring: {
    id: "soetdoring",
    displayName: "Soetdoring (Sweet Thorn)",
    aliases: ["soetdoring", "soet doring", "sweet thorn", "vachellia karroo"],
    densityKgPerM3: 950,
    usage: "both",
  },
  "port-jackson": {
    id: "port-jackson",
    displayName: "Port Jackson",
    aliases: ["port jackson", "port-jackson", "acacia saligna"],
    densityKgPerM3: 700,
    usage: "braai",
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
  },
  beefwood: {
    id: "beefwood",
    displayName: "Beefwood",
    aliases: ["beefwood", "beef wood", "casuarina"],
    densityKgPerM3: 850,
    usage: "both",
  },
  oak: {
    id: "oak",
    displayName: "Oak",
    aliases: ["oak", "eikehout", "quercus"],
    densityKgPerM3: 750,
    usage: "fireplace",
  },
  olive: {
    id: "olive",
    displayName: "Olive",
    aliases: ["olive", "olienhout", "olea europaea"],
    densityKgPerM3: 950,
    usage: "both",
  },
  pine: {
    id: "pine",
    displayName: "Pine",
    aliases: ["pine", "den", "pinus"],
    densityKgPerM3: 500,
    usage: "braai",
  },
  plum: {
    id: "plum",
    displayName: "Plum",
    aliases: ["plum", "pruim"],
    densityKgPerM3: 750,
    usage: "smoking",
  },
  marula: {
    id: "marula",
    displayName: "Marula",
    aliases: ["marula", "sclerocarya"],
    densityKgPerM3: 600,
    usage: "smoking",
  },
  karee: {
    id: "karee",
    displayName: "Karee",
    aliases: ["karee", "searsia lancea"],
    densityKgPerM3: 850,
    usage: "both",
  },
  myrtle: {
    id: "myrtle",
    displayName: "Myrtle",
    aliases: ["myrtle"],
    densityKgPerM3: 700,
    usage: "both",
  },
  cherry: {
    id: "cherry",
    displayName: "Cherry",
    aliases: ["cherry"],
    densityKgPerM3: 650,
    usage: "smoking",
  },
  pecan: {
    id: "pecan",
    displayName: "Pecan",
    aliases: ["pecan"],
    densityKgPerM3: 750,
    usage: "smoking",
  },
  macadamia: {
    id: "macadamia",
    displayName: "Macadamia",
    aliases: ["macadamia"],
    densityKgPerM3: 800,
    usage: "smoking",
  },
  mesquite: {
    id: "mesquite",
    displayName: "Mesquite",
    aliases: ["mesquite", "prosopis"],
    densityKgPerM3: 850,
    usage: "smoking",
  },
  "namibian-hardwood-mix": {
    id: "namibian-hardwood-mix",
    displayName: "Namibian Hardwood Mix",
    aliases: ["namibian mix", "namibian hardwood", "nam mix"],
    densityKgPerM3: 950,
    usage: "both",
  },
  "doring-mix": {
    id: "doring-mix",
    displayName: "Doring Mix",
    aliases: ["doring mix", "thorn mix"],
    densityKgPerM3: 1000,
    usage: "both",
  },
  "smoking-mix": {
    id: "smoking-mix",
    displayName: "Smoking Wood Mix",
    aliases: ["smoking wood chunks", "smoking chunks", "smoking wood"],
    densityKgPerM3: 750,
    usage: "smoking",
  },
  unknown: {
    id: "unknown",
    displayName: "Unknown / Mixed",
    aliases: [],
    densityKgPerM3: 800,
    usage: "both",
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
