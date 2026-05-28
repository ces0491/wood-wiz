import { describe, expect, test } from "vitest";
import {
  detectUsage,
  extractWeight,
  isFirewood,
  normalize,
} from "./normalize";
import { detectSpecies } from "./wood-species";
import type { ScrapedProduct } from "./types";

// Density used in volume-based estimation tests. Bluegum air-dry density is
// 800 kg/m³ per wood-species.ts.
const DENSITY = 800;

describe("extractWeight", () => {
  describe("explicit total postscript (parens or trailing)", () => {
    test("'(750KG)' wins over per-bag math", () => {
      const r = extractWeight(
        "Soetdoring Hardwood Bags | 5x 18KG or more — 42 Bags (750KG)",
        DENSITY,
      );
      expect(r?.weightKg).toBe(750);
      expect(r?.packFormat).toBe("pallet");
    });
    test("'(1-Ton)' parses as 1,000 kg", () => {
      const r = extractWeight(
        "Soetdoring Hardwood | 5x 18KG — 56 Bags (1-Ton)",
        DENSITY,
      );
      expect(r?.weightKg).toBe(1000);
    });
    test("'(1-Ton) + Free Delivery' still parses the ton, ignores trailing words", () => {
      const r = extractWeight(
        "Swarthaak | 5x 18KG — 50x 20KG Bags (1-Ton) + Free Delivery",
        DENSITY,
      );
      expect(r?.weightKg).toBe(1000);
    });
    test("trailing '| 144KG' parses as the total", () => {
      const r = extractWeight(
        "Namibian Hardwood Bulk | 16KG Braai Mix Bags — 9 Bags | 144KG",
        DENSITY,
      );
      expect(r?.weightKg).toBe(144);
    });
    test("ignores parens that don't contain a weight (e.g. '(Premium)')", () => {
      const r = extractWeight(
        "Rooibos Hardwood Bags (Premium) | 5x 18KG + — 42 Bags (750KG)",
        DENSITY,
      );
      expect(r?.weightKg).toBe(750);
    });
    test("trailing '| 48KG' parses smaller totals too (no floor)", () => {
      const r = extractWeight(
        "Namibian Hardwood Bulk | 16KG Braai Mix Bags — 3 Bags | 48KG",
        DENSITY,
      );
      expect(r?.weightKg).toBe(48);
      expect(r?.packFormat).toBe("bag"); // < 50kg → bag packFormat
    });
    test("'(15kg)' parens still parses small weights too", () => {
      const r = extractWeight("Mixed wood (15kg)", DENSITY);
      expect(r?.weightKg).toBe(15);
      expect(r?.packFormat).toBe("bag");
    });
    test("doesn't fire on a single-bag listing 'Hardwood 60kg' (no separator)", () => {
      // No `|` or `)` before 60kg → trailingTotal doesn't match,
      // falls through to direct-kg → returns 60 as bag
      const r = extractWeight("Hardwood 60kg", DENSITY);
      expect(r?.weightKg).toBe(60);
      expect(r?.packFormat).toBe("pallet"); // >= 50kg → pallet per direct-kg branch
    });
  });

  describe("tons", () => {
    test("'34 ton' → 34,000 kg pallet", () => {
      expect(extractWeight("34 ton bluegum pallet", DENSITY)).toEqual({
        weightKg: 34000,
        estimated: false,
        packFormat: "pallet",
      });
    });
    test("'2.5 tonnes' → 2,500 kg pallet", () => {
      expect(extractWeight("Bluegum 2.5 tonnes", DENSITY)).toEqual({
        weightKg: 2500,
        estimated: false,
        packFormat: "pallet",
      });
    });
    test("'1ton' no-space → 1,000 kg", () => {
      expect(extractWeight("Mopane 1ton", DENSITY)?.weightKg).toBe(1000);
    });
    test("rejects 0 tons", () => {
      expect(extractWeight("0 ton dummy", DENSITY)).toBeNull();
    });
    test("rejects 200 tons (out of range)", () => {
      // Falls through to next branch; with no other weight, returns null
      expect(extractWeight("200 tons mythical", DENSITY)).toBeNull();
    });
  });

  describe("composite 'N x M kg'", () => {
    test("'1700 x 20kg' → 34,000 kg", () => {
      const r = extractWeight("Bluegum 1700 x 20kg pallet", DENSITY);
      expect(r?.weightKg).toBe(34000);
      expect(r?.packFormat).toBe("pallet");
      expect(r?.estimated).toBe(false);
    });
    test("'20x20kg' (no spaces)", () => {
      expect(extractWeight("Hardwood 20x20kg", DENSITY)?.weightKg).toBe(400);
    });
    test("'25 x 2.5kg' decimal unit", () => {
      expect(extractWeight("Smoking chunks 25 x 2.5kg", DENSITY)?.weightKg).toBe(62.5);
    });
    test("composite over 50,000 kg falls through to next branch", () => {
      // 3000 x 20kg = 60,000 → out of range. The current behaviour is to
      // fall through to the direct-kg branch, which picks up "20kg".
      // Arguably wrong (we know it's a composite, returning a 20kg fragment
      // is misleading) but no real product hits this and changing it now
      // would be a quietly load-bearing behaviour change. Documenting here.
      expect(extractWeight("Mega 3000 x 20kg", DENSITY)?.weightKg).toBe(20);
    });
  });

  describe("'N x bags' with unit elsewhere", () => {
    test("'40x bags' + '20KG Bags'", () => {
      const r = extractWeight("Hardwood Bulk 40x bags 20KG Bags", DENSITY);
      expect(r?.weightKg).toBe(800);
      expect(r?.packFormat).toBe("pallet");
    });
  });

  describe("em-dash multi-pack (Shopify title+variant join)", () => {
    test("'5KG Bags — 50 Bag' → 250 kg", () => {
      // Realistic CTF title format
      const r = extractWeight(
        "Eco Fire Logs Bulk | 5KG Bags (Eco-Friendly) — 50 Bag",
        DENSITY,
      );
      expect(r?.weightKg).toBe(250);
      expect(r?.packFormat).toBe("pallet");
      expect(r?.estimated).toBe(false);
    });
    test("'9-10KG Bags — 20 Bags' picks 10 as the unit", () => {
      // Realistic Mother City format with weight range in the unit
      const r = extractWeight(
        "Kameeldoring Braai Wood | Small 9-10KG Bags — 20 Bags",
        DENSITY,
      );
      expect(r?.weightKg).toBe(200);
    });
    test("'18KG Bags — 25 Bags' → 450 kg", () => {
      const r = extractWeight(
        "Kameeldoring Firewood | Large 18KG Bags — 25 Bags | 4",
        DENSITY,
      );
      expect(r?.weightKg).toBe(450);
    });
    test("en-dash variant also matches", () => {
      const r = extractWeight("Pine 10KG Bags – 5 Bags", DENSITY);
      expect(r?.weightKg).toBe(50);
    });
    test("pipe separator also matches", () => {
      const r = extractWeight("Pine 10KG Bags | 5 Bags", DENSITY);
      expect(r?.weightKg).toBe(50);
    });
  });

  describe("direct kg", () => {
    test("'18kg'", () => {
      expect(extractWeight("Bluegum 18kg bag", DENSITY)?.weightKg).toBe(18);
    });
    test("'approx 30kg'", () => {
      expect(extractWeight("approx 30kg Rooikrans", DENSITY)?.weightKg).toBe(30);
    });
    test("'±20 kg'", () => {
      expect(extractWeight("Mixed wood ±20 kg", DENSITY)?.weightKg).toBe(20);
    });
    test("'100 kg bag' → pallet packFormat (>=50kg threshold)", () => {
      const r = extractWeight("Black Wattle 100 kg bag", DENSITY);
      expect(r?.weightKg).toBe(100);
      expect(r?.packFormat).toBe("pallet");
    });
    test("'18kg bag' → bag packFormat", () => {
      const r = extractWeight("Bluegum 18kg bag", DENSITY);
      expect(r?.packFormat).toBe("bag");
    });
  });

  describe("pieces", () => {
    test("'500 pieces' → 750 kg (estimated)", () => {
      const r = extractWeight("Bluegum 500 pieces", DENSITY);
      expect(r?.weightKg).toBe(750);
      expect(r?.estimated).toBe(true);
      expect(r?.packFormat).toBe("pieces");
    });
    test("'1000pc' → 1,500 kg", () => {
      expect(extractWeight("Port Jackson 1000pc", DENSITY)?.weightKg).toBe(1500);
    });
    test("'2000-piece' hyphenated", () => {
      expect(extractWeight("Bluegum 2000-piece pallet", DENSITY)?.weightKg).toBe(3000);
    });
  });

  describe("volume m³", () => {
    test("'0.5 m3' → density * 0.5", () => {
      const r = extractWeight("Loose 0.5 m3 mix", DENSITY);
      expect(r?.weightKg).toBe(400); // 0.5 * 800
      expect(r?.estimated).toBe(true);
      expect(r?.packFormat).toBe("loose");
    });
    test("'1 cubic metre'", () => {
      expect(extractWeight("Mixed 1 cubic metre", DENSITY)?.weightKg).toBe(800);
    });
    test("'2 m³' (unicode)", () => {
      expect(extractWeight("Pallet 2 m³ pine", DENSITY)?.weightKg).toBe(1600);
    });
  });

  describe("litres", () => {
    test("'50L' uses density * 0.5 packing factor", () => {
      // (50/1000) * 800 * 0.5 = 20
      expect(extractWeight("Bag 50L blue gum", DENSITY)?.weightKg).toBe(20);
    });
  });

  describe("priority and ordering", () => {
    test("tons branch wins over kg branch when both present", () => {
      // '1 ton' should match before incidental kg matches
      expect(extractWeight("1 ton 25kg bags", DENSITY)?.weightKg).toBe(1000);
    });
    test("composite wins over direct kg", () => {
      // '10 x 18kg' should multiply, not return 18kg or 10kg
      expect(extractWeight("Hardwood 10 x 18kg", DENSITY)?.weightKg).toBe(180);
    });
    test("em-dash multi-pack wins over direct kg fallback", () => {
      // '5KG Bags — 50 Bag' must not be parsed as 5kg
      const r = extractWeight("Eco logs 5KG Bags — 50 Bag", DENSITY);
      expect(r?.weightKg).toBe(250);
    });
  });

  describe("no match", () => {
    test("returns null for text with no weight indicator", () => {
      expect(extractWeight("Mystery firewood", DENSITY)).toBeNull();
    });
    test("returns null for empty string", () => {
      expect(extractWeight("", DENSITY)).toBeNull();
    });
  });
});

describe("isFirewood", () => {
  describe("accepts legitimate firewood", () => {
    const titles = [
      "Blue Gum Firewood 18kg",
      "1000 Pieces Port Jackson Fire Wood",
      "Kameeldoring Braai Wood — Large",
      "Black Wattle Bulk Bag 30kg",
      "Smoking Wood Chunks Mixed — Per Box",
      "Rooikrans Braai Wood 500 Pieces",
      "Hout Bay Firewood Combo - Kameelhout & Rooipitjie",
      "Bluegum Firewood Bakkie Load",
    ];
    test.each(titles)("'%s'", (title) => {
      expect(isFirewood(title)).toBe(true);
    });
  });

  describe("rejects accessories", () => {
    const cases: [string, string][] = [
      ["fire lighter", "Blitz fire lighters 50 pack"],
      ["fire starter", "Hardwood Firestarters Bulk"],
      ["fire starter (spaced)", "Premium Fire Starter Box"],
      ["gas lighter", "Gas Lighter Long Reach"],
      ["lid lifter", "Stainless Steel Lid Lifter"],
      ["tongs", "Braai Tongs Heavy Duty"],
      ["braai rake", "Braai Rake Set"],
      ["grill cleaner", "Grill Cleaner Spray"],
      ["potjie spray", "Potjie Care Spray"],
      ["coal scoop", "Charcoal scoop large"],
      ["tripod", "Cast Iron Tripod"],
      ["apron", "Braai Apron"],
      ["gloves", "Heat Resistant Gloves"],
      ["anthracite", "Anthracite 25kg"],
      ["briquettes", "Hardwood Briquettes"],
      ["charcoal", "Premium Lump Charcoal"],
      ["bbq tool set", "BBQ Tool Set 5-piece"],
      ["gift kit", "Forever Fire Reusable Fire Starter Gift Kit"],
      ["starter kit", "Wood Stove Starter Kit"],
      ["cleaning kit", "Grid Cleaning Kit"],
      ["grid", "Grid (Small Box) (MS)"],
      ["gas boiling table", "Gas Boiling Table (Double) (C/I)"],
      ["gas burner", "Gas Burner 4-plate"],
      ["fire pit", "Fire Pit (M/S)"],
      ["potjie cooker", "Potjie Cooker & Braai M/S"],
      ["LK pot", "LK's Pot (3 Leg) #3 – Size 7.8L"],
      ["fruit bin", "Wooden Fruit Bin"],
      ["axe", "Splitting axe 5lb"],
      ["wood holder", "Firewood Holder Rack"],
      ["stand", "Braai Stand"],
      ["bellows", "Leather Bellows"],
      ["wood pellet", "Hardwood Wood Pellets 15kg"],
      ["bag opener", "Cement Bag Opener"],
      ["garden refuse", "Garden Refuse & General Waste Removal Service — Half 1-Ton Bakkie Load"],
      ["waste removal", "General Waste Removal Service — Full 1-Ton Bakkie Load"],
      ["refuse removal", "Refuse Removal — Small Bakkie"],
      ["removal service", "Garden Removal Service — Bakkie Load"],
    ];
    test.each(cases)("rejects %s: '%s'", (_, title) => {
      expect(isFirewood(title)).toBe(false);
    });
  });
});

describe("detectSpecies", () => {
  describe("direct species names", () => {
    const cases: [string, string][] = [
      ["blue-gum", "Blue Gum Firewood"],
      ["blue-gum", "bluegum 18kg"],
      ["blue-gum", "Eucalyptus globulus"],
      ["red-gum", "Red Gum 25kg"],
      ["red-gum", "Eucalyptus camaldulensis"],
      ["kameeldoring", "Kameeldoring (Camel Thorn)"],
      ["kameeldoring", "Camel thorn 18kg"],
      ["kameeldoring", "Vachellia erioloba"],
      ["kameeldoring", "kameelhout"],
      ["black-wattle", "Black Wattle Braai Wood"],
      ["black-wattle", "Acacia mearnsii"],
      ["rooikrans", "Rooikrans 500 pieces"],
      ["rooikrans", "Acacia cyclops"],
      ["swarthaak", "Swarthaak (Black Thorn)"],
      ["soetdoring", "Soetdoring 18kg"],
      ["port-jackson", "Port Jackson Firewood"],
      ["sekelbos", "Sekelbos Sickle Bush"],
      ["mopane", "Mopane 25kg"],
      ["grape-vine", "Wingerdstompies"],
      ["grape-vine", "Grape Vine 5kg"],
      ["rooibos-hardwood", "Rooibos Hardwood"],
      ["pine", "Pine firewood"],
      ["oak", "Oak fireplace wood"],
      ["plum", "Plum firewood 25kg"],
      ["marula", "Marula Barrel Wood"],
    ];
    test.each(cases)("'%s' is detected in '%s'", (expected, title) => {
      expect(detectSpecies(title)).toBe(expected);
    });
  });

  describe("longer aliases win over shorter ones", () => {
    test("'Eucalyptus globulus' matches blue-gum even though 'eucalyptus' alone also exists", () => {
      // Both 'eucalyptus globulus' and 'eucalyptus' are aliases of blue-gum,
      // so this test mostly confirms the longest-alias-first ordering works
      expect(detectSpecies("Eucalyptus globulus 18kg")).toBe("blue-gum");
    });
  });

  describe("falls back to unknown", () => {
    test("returns 'unknown' when no alias matches", () => {
      expect(detectSpecies("Mystery firewood")).toBe("unknown");
    });
    test("returns 'unknown' for empty string", () => {
      expect(detectSpecies("")).toBe("unknown");
    });
  });
});

describe("detectUsage", () => {
  test("'smoking' wins over braai/fireplace", () => {
    expect(detectUsage("Hardwood smoking chunks", "both")).toBe("smoking");
  });
  test("'smoker' triggers smoking", () => {
    expect(detectUsage("Best wood for smoker", "both")).toBe("smoking");
  });
  test("braai-only when only braai mentioned", () => {
    expect(detectUsage("Bluegum braai wood", "both")).toBe("braai");
  });
  test("fireplace-only when only fireplace mentioned", () => {
    expect(detectUsage("Oak fireplace logs", "both")).toBe("fireplace");
  });
  test("falls back to species default when both braai and fireplace mentioned", () => {
    expect(detectUsage("Braai or fireplace wood", "both")).toBe("both");
  });
  test("uses defaultUsage when no usage words found", () => {
    expect(detectUsage("Bluegum 18kg bag", "both")).toBe("both");
    expect(detectUsage("Rooikrans 18kg", "braai")).toBe("braai");
  });
  test("'pizza wood' counts as fireplace", () => {
    expect(detectUsage("Pizza wood mix", "both")).toBe("fireplace");
  });
});

describe("normalize (integration)", () => {
  function makeScraped(overrides: Partial<ScrapedProduct> = {}): ScrapedProduct {
    return {
      vendorId: "mother-city-firewood",
      externalId: "test-1",
      title: "Blue Gum 18kg",
      url: "https://example.com/p/1",
      priceZar: 100,
      inStock: true,
      scrapedAt: "2026-01-01T00:00:00Z",
      ...overrides,
    };
  }

  test("happy path: 18kg blue gum at R 100", () => {
    const result = normalize(makeScraped());
    expect(result).not.toBeNull();
    expect(result!.species).toBe("blue-gum");
    expect(result!.weightKg).toBe(18);
    expect(result!.pricePerKgZar).toBeCloseTo(5.56, 2);
    expect(result!.weightEstimated).toBe(false);
  });

  test("rejects non-firewood titles", () => {
    expect(normalize(makeScraped({ title: "Hardwood Firestarters Bulk" }))).toBeNull();
  });

  test("rejects products with no parseable weight", () => {
    expect(normalize(makeScraped({ title: "Mystery firewood" }))).toBeNull();
  });

  test("rejects unknown vendor", () => {
    expect(normalize(makeScraped({ vendorId: "not-a-vendor" }))).toBeNull();
  });

  test("rejects zero price", () => {
    expect(normalize(makeScraped({ priceZar: 0 }))).toBeNull();
  });

  test("flags weightEstimated for piece-count listings", () => {
    const result = normalize(makeScraped({ title: "Bluegum 1000 pieces" }));
    expect(result!.weightEstimated).toBe(true);
    expect(result!.weightKg).toBe(1500);
  });

  test("passes through maxPriceZar and computes maxPricePerKgZar", () => {
    const result = normalize(
      makeScraped({
        title: "Blue Gum 1000 pieces",
        priceZar: 1500,
        maxPriceZar: 1800,
      }),
    );
    expect(result!.maxPriceZar).toBe(1800);
    expect(result!.pricePerKgZar).toBeCloseTo(1.0, 2);
    expect(result!.maxPricePerKgZar).toBeCloseTo(1.2, 2);
  });

  test("decodes HTML entities in titles", () => {
    const result = normalize(
      makeScraped({ title: "Kameeldoring &amp; Sekelbos 18kg" }),
    );
    expect(result!.title).toBe("Kameeldoring & Sekelbos 18kg");
  });

  test("rounds pricePerKgZar to 2 decimals", () => {
    const result = normalize(makeScraped({ title: "Bluegum 18kg", priceZar: 99.99 }));
    // 99.99 / 18 = 5.555 → Math.round half-up → 5.56
    expect(result!.pricePerKgZar).toBe(5.56);
  });
});
