import type { PackFormat, Product, ScrapedProduct, WoodUsage } from "./types";
import { detectSpecies, getSpecies } from "./wood-species";
import { getVendor } from "./vendors";

interface WeightResult {
  weightKg: number;
  estimated: boolean;
  packFormat: PackFormat;
}

// Titles that match these patterns are not firewood — they're accessories,
// fuel substitutes, or tools sold alongside firewood.
const NON_FIREWOOD_PATTERNS = [
  /\bfire\s*lighters?\b/i,
  /\bfire\s*starters?\b/i,
  /\bgas\s*lighter\b/i,
  /\blid\s*lifter\b/i,
  /\b(braai\s*)?tongs?\b/i,
  /\b(braai\s*)?rake\b/i,
  /\bgrill\s*cleaner\b/i,
  /\b(potjie|braai)\s*(care\s*)?spray\b/i,
  /\bcoal\s*scoop\b/i,
  /\bdust\s*pan\b/i,
  /\btripod\b/i,
  /\bapron\b/i,
  /\bglove(s)?\b/i,
  /\banthracite\b/i,
  /\bbriquettes?\b/i,
  /\bcharcoal\b/i,
  /\bblitz\s+firelighters?\b/i,
  /\bbbq\s*(tool|set)\b/i,
  /\b(gift|starter|cleaning)\s*kit\b/i,
  /\bgrid\b/i,
  /\baxe\b/i,
  /\bgas\s+(boiling|burner|stove|table)\b/i,
  /\bfire\s*pit\b/i,
  /\bpotjie\s+(cooker|pot)\b/i,
  /\blk(?:'s|’s)?\s+pot\b/i,
  /\bfruit\s+bin\b/i,
  /\bfire(wood)?\s*holder\b/i,
  /\b(stand|rack)\b/i,
  /\bbag\s*opener\b/i,
  /\bbellow(s)?\b/i,
  /\bwood\s*pellet/i,
];

function isFirewood(title: string): boolean {
  return !NON_FIREWOOD_PATTERNS.some((p) => p.test(title));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function extractWeight(text: string, densityKgPerM3: number): WeightResult | null {
  const lower = text.toLowerCase().replace(/,/g, ".");

  // Tons: "34 ton", "1ton", "2.5 tonnes" — strong wholesale signal
  const tonMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:ton(?:ne)?s?)\b/);
  if (tonMatch) {
    const tons = parseFloat(tonMatch[1]);
    if (tons > 0 && tons < 100) {
      return { weightKg: tons * 1000, estimated: false, packFormat: "pallet" };
    }
  }

  // Composite: "1700 x 20kg" or "20x20kg" — total = multiplier * unit
  // Allow up to 50 tons since wholesale bundles are real listings.
  const compMatch = lower.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*kg\b/);
  if (compMatch) {
    const total = parseInt(compMatch[1], 10) * parseFloat(compMatch[2]);
    if (total > 0 && total < 50000) {
      return { weightKg: total, estimated: false, packFormat: total >= 50 ? "pallet" : "bag" };
    }
  }

  // "40x Bags" with separate unit weight elsewhere in title (e.g. "20KG Bags")
  const bagsMatch = lower.match(/(\d+)\s*x\s*bags?\b/);
  if (bagsMatch) {
    const count = parseInt(bagsMatch[1], 10);
    const unitMatch = lower.match(/(\d+(?:\.\d+)?)\s*kg\s*bags?\b/);
    if (unitMatch) {
      const unit = parseFloat(unitMatch[1]);
      const total = count * unit;
      if (total > 0 && total < 50000) {
        return { weightKg: total, estimated: false, packFormat: "pallet" };
      }
    }
  }

  // Multi-pack variant: unit weight followed by separator (em-dash, en-dash, or
  // pipe) and bag count. Shopify scrapers join product title and variant title
  // with " — ", producing strings like "5KG Bags — 50 Bag" or "18KG Bags | 25 Bags".
  const sepBagsMatch = lower.match(/[—–|]\s*(\d+)\s*bags?\b/);
  if (sepBagsMatch) {
    const count = parseInt(sepBagsMatch[1], 10);
    const unitMatch = lower.match(/(\d+(?:\.\d+)?)\s*kg\s*bags?\b/);
    if (unitMatch) {
      const unit = parseFloat(unitMatch[1]);
      const total = count * unit;
      if (total > 0 && total < 50000) {
        return { weightKg: total, estimated: false, packFormat: "pallet" };
      }
    }
  }

  // Direct kg: "18kg", "±20 kg", "approx 30kg", "100 kg bag"
  const kgMatch = lower.match(/(?:±|approx|approximately|around|about)?\s*(\d+(?:\.\d+)?)\s*kg\b/);
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1]);
    if (kg > 0 && kg < 50000) {
      return { weightKg: kg, estimated: false, packFormat: kg >= 50 ? "pallet" : "bag" };
    }
  }

  // Pieces: "500 pieces", "1000pc", "2000-piece"
  const piecesMatch = lower.match(/(\d+)\s*[-]?\s*(?:piece|pieces|pc|pcs)\b/);
  if (piecesMatch) {
    const pieces = parseInt(piecesMatch[1], 10);
    const estimated = pieces * 1.5;
    return { weightKg: estimated, estimated: true, packFormat: "pieces" };
  }

  // Volume: "0.5 m3", "1 cubic metre", "m^3"
  const m3Match = lower.match(/(\d+(?:\.\d+)?)\s*(?:m3|m\^3|cubic\s*met(?:re|er)|m³)\b/);
  if (m3Match) {
    const m3 = parseFloat(m3Match[1]);
    const kg = m3 * densityKgPerM3;
    return { weightKg: kg, estimated: true, packFormat: "loose" };
  }

  // Litres: bags are loose-stacked so apply 0.5 packing factor
  const litreMatch = lower.match(/(\d+)\s*(?:l|litre|liter)\b/);
  if (litreMatch) {
    const litres = parseInt(litreMatch[1], 10);
    const kg = (litres / 1000) * densityKgPerM3 * 0.5;
    return { weightKg: kg, estimated: true, packFormat: "bag" };
  }

  return null;
}

function detectUsage(title: string, defaultUsage: WoodUsage): WoodUsage {
  const lower = title.toLowerCase();
  const mentionsBraai = /\bbraai\b|\bbbq\b|barbecue/.test(lower);
  const mentionsFireplace = /\bfireplace\b|\bkaggel(hout)?\b|\bpizza\s*wood\b/.test(lower);
  const mentionsSmoking = /\bsmoking\b|\bsmoker\b/.test(lower);

  if (mentionsSmoking) return "smoking";
  if (mentionsBraai && !mentionsFireplace) return "braai";
  if (mentionsFireplace && !mentionsBraai) return "fireplace";
  return defaultUsage;
}

export function normalize(scraped: ScrapedProduct): Product | null {
  const vendor = getVendor(scraped.vendorId);
  if (!vendor) return null;

  const title = decodeEntities(scraped.title);
  if (!isFirewood(title)) return null;

  const species = detectSpecies(`${title} ${scraped.rawWeightLabel ?? ""}`);
  const speciesInfo = getSpecies(species);

  const searchText = `${title} ${scraped.rawWeightLabel ?? ""}`;
  const weight = extractWeight(searchText, speciesInfo.densityKgPerM3);
  if (!weight || weight.weightKg < 1) return null;
  if (scraped.priceZar <= 0) return null;

  const usage = detectUsage(title, speciesInfo.usage);

  return {
    id: `${scraped.vendorId}::${scraped.externalId}`,
    vendorId: scraped.vendorId,
    vendorName: vendor.name,
    title: title.trim(),
    url: scraped.url,
    imageUrl: scraped.imageUrl,
    species,
    usage,
    packFormat: weight.packFormat,
    priceZar: scraped.priceZar,
    regularPriceZar: scraped.regularPriceZar,
    weightKg: Math.round(weight.weightKg * 100) / 100,
    pricePerKgZar: Math.round((scraped.priceZar / weight.weightKg) * 100) / 100,
    weightEstimated: weight.estimated,
    inStock: scraped.inStock,
    scrapedAt: scraped.scrapedAt,
  };
}
