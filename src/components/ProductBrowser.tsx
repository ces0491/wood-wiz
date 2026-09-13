"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Home,
  Layers,
  LayoutGrid,
  PackageCheck,
  SlidersHorizontal,
  Wind,
  X,
} from "lucide-react";
import type { Product, ProductsFile, Vendor, WoodSpecies, WoodUsage } from "@/lib/types";
import type { Region } from "@/lib/regions";
import { SPECIES } from "@/lib/wood-species";
import { formatKg, formatZar } from "@/lib/format";
import RefreshedAt from "./RefreshedAt";
import Link from "next/link";
import TrackedLink from "./TrackedLink";
import VendorFailureNotice from "./VendorFailureNotice";
import { scrollToElement } from "@/lib/scroll";

type UsageFilter = "all" | WoodUsage;
type SortKey = "price-per-kg-asc" | "price-per-kg-desc" | "price-asc";

// Weight thresholds offered in the "Bulk only" dropdown. Null = no filter.
const BULK_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Any size" },
  { value: 100, label: "100 kg+" },
  { value: 500, label: "500 kg+" },
  { value: 1000, label: "1 ton+" },
  { value: 2000, label: "2 tons+" },
];

// Quick-pick budget presets. min/max nullable so "Any" resets both.
const BUDGET_PRESETS: { label: string; min: number | null; max: number | null }[] = [
  { label: "Any", min: null, max: null },
  { label: "< R 500", min: null, max: 500 },
  { label: "R 500–1k", min: 500, max: 1000 },
  { label: "R 1k–3k", min: 1000, max: 3000 },
  { label: "R 3k–7k", min: 3000, max: 7000 },
  { label: "R 7k+", min: 7000, max: null },
];

interface Props {
  region: Region;
  products: Product[];
  vendors: Vendor[];
  generatedAt: string;
  vendorRunStatus: ProductsFile["vendorRunStatus"];
}

const USAGE_LABEL: Record<UsageFilter, string> = {
  all: "All",
  braai: "Braai",
  fireplace: "Fireplace",
  smoking: "Smoking",
  both: "Both",
};

const USAGE_ICON: Record<UsageFilter, typeof Flame> = {
  all: LayoutGrid,
  braai: Flame,
  fireplace: Home,
  smoking: Wind,
  both: Flame,
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

const SORT_LABEL: Record<SortKey, string> = {
  "price-per-kg-asc": "Cheapest per kg first",
  "price-per-kg-desc": "Most expensive per kg first",
  "price-asc": "Lowest total price first",
};


export default function ProductBrowser({
  region,
  products,
  vendors,
  generatedAt,
  vendorRunStatus,
}: Props) {
  const [usage, setUsage] = useState<UsageFilter>("all");
  const [selectedSpecies, setSelectedSpecies] = useState<Set<WoodSpecies>>(new Set());
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const [inStockOnly, setInStockOnly] = useState(true);
  const [bulkMinKg, setBulkMinKg] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("price-per-kg-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const panelRef = useRef<HTMLElement>(null);

  // Mobile filter drawer: Escape to close, Tab cycles inside it, background
  // scroll is locked, and focus goes in on open and back to the trigger on
  // close. Only on mobile/tablet — on lg+ the sidebar is always visible, so
  // showFilters has no visible effect and trapping focus there would be wrong.
  //
  // The desktop test is a live matchMedia listener, not a one-shot read:
  // opening the drawer on a phone-width window and then widening past lg used
  // to leave body scroll locked with no visible drawer to close.
  useEffect(() => {
    if (!showFilters) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    if (desktop.matches) return;

    const trigger = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowFilters(false);
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Close rather than try to reconcile a drawer that is no longer rendered.
    const onBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) setShowFilters(false);
    };
    desktop.addEventListener("change", onBreakpoint);

    panelRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onBreakpoint);
      document.body.style.overflow = prevOverflow;
      trigger?.focus?.();
    };
  }, [showFilters]);

  const baseFiltered = useMemo(() => {
    let out = products;
    if (inStockOnly) out = out.filter((p) => p.inStock);
    if (bulkMinKg !== null) out = out.filter((p) => p.weightKg >= bulkMinKg);
    if (usage !== "all") {
      // "both" means "braai + fireplace" (indoor and outdoor fires); it does
      // NOT include smoking-food applications. A resinous hardwood good for a
      // braai is wrong for cold-smoking meat. So braai/fireplace inherit
      // "both" products, but smoking is strict.
      out = out.filter((p) =>
        usage === "smoking" ? p.usage === "smoking" : p.usage === usage || p.usage === "both",
      );
    }
    // Price filters: overlap-based so a variable product with a range of
    // R 1,500–R 2,500 still appears when the budget is R 2,000 — the user
    // can buy the cheapest variant within budget.
    if (minPrice !== null) {
      out = out.filter((p) => (p.maxPriceZar ?? p.priceZar) >= minPrice);
    }
    if (maxPrice !== null) {
      out = out.filter((p) => p.priceZar <= maxPrice);
    }
    return out;
  }, [products, usage, inStockOnly, bulkMinKg, minPrice, maxPrice]);

  const productsForSpeciesCount = useMemo(() => {
    if (selectedVendors.size === 0) return baseFiltered;
    return baseFiltered.filter((p) => selectedVendors.has(p.vendorId));
  }, [baseFiltered, selectedVendors]);

  const productsForVendorCount = useMemo(() => {
    if (selectedSpecies.size === 0) return baseFiltered;
    return baseFiltered.filter((p) => selectedSpecies.has(p.species));
  }, [baseFiltered, selectedSpecies]);

  // The species and vendor chips have always hidden themselves at zero and
  // shown counts. The usage tabs, the Bulk sizes and the Budget presets were
  // static arrays tuned against a 500-product Cape Town catalogue, and shipping
  // them unchanged to Johannesburg's 20 left five of twelve controls as
  // guaranteed dead ends — "1 ton+", "2 tons+", "R 500–1k", "R 7k+" and
  // Smoking all returned nothing. An empty result reads as a fault rather than
  // as "we don't have that here", so each group is now counted the same way.
  //
  // Each count excludes its own dimension: a Bulk size is counted against the
  // catalogue with every other filter applied but no size filter, or the
  // options would all collapse to the one already chosen.
  const withoutUsage = useMemo(() => {
    let out = products;
    if (inStockOnly) out = out.filter((p) => p.inStock);
    if (bulkMinKg !== null) out = out.filter((p) => p.weightKg >= bulkMinKg);
    if (minPrice !== null) out = out.filter((p) => (p.maxPriceZar ?? p.priceZar) >= minPrice);
    if (maxPrice !== null) out = out.filter((p) => p.priceZar <= maxPrice);
    if (selectedSpecies.size > 0) out = out.filter((p) => selectedSpecies.has(p.species));
    if (selectedVendors.size > 0) out = out.filter((p) => selectedVendors.has(p.vendorId));
    return out;
  }, [products, inStockOnly, bulkMinKg, minPrice, maxPrice, selectedSpecies, selectedVendors]);

  const usageCounts = useMemo(() => {
    const count = (u: UsageFilter) =>
      u === "all"
        ? withoutUsage.length
        : withoutUsage.filter((p) =>
            u === "smoking" ? p.usage === "smoking" : p.usage === u || p.usage === "both",
          ).length;
    return { all: count("all"), braai: count("braai"), fireplace: count("fireplace"), smoking: count("smoking") };
  }, [withoutUsage]);

  const withoutSize = useMemo(() => {
    let out = products;
    if (inStockOnly) out = out.filter((p) => p.inStock);
    if (usage !== "all") {
      out = out.filter((p) =>
        usage === "smoking" ? p.usage === "smoking" : p.usage === usage || p.usage === "both",
      );
    }
    if (minPrice !== null) out = out.filter((p) => (p.maxPriceZar ?? p.priceZar) >= minPrice);
    if (maxPrice !== null) out = out.filter((p) => p.priceZar <= maxPrice);
    if (selectedSpecies.size > 0) out = out.filter((p) => selectedSpecies.has(p.species));
    if (selectedVendors.size > 0) out = out.filter((p) => selectedVendors.has(p.vendorId));
    return out;
  }, [products, inStockOnly, usage, minPrice, maxPrice, selectedSpecies, selectedVendors]);

  const bulkOptions = useMemo(
    () =>
      BULK_OPTIONS.filter(
        (o) =>
          o.value === null ||
          o.value === bulkMinKg ||
          withoutSize.some((p) => p.weightKg >= o.value!),
      ),
    [withoutSize, bulkMinKg],
  );

  const withoutBudget = useMemo(() => {
    let out = products;
    if (inStockOnly) out = out.filter((p) => p.inStock);
    if (bulkMinKg !== null) out = out.filter((p) => p.weightKg >= bulkMinKg);
    if (usage !== "all") {
      out = out.filter((p) =>
        usage === "smoking" ? p.usage === "smoking" : p.usage === usage || p.usage === "both",
      );
    }
    if (selectedSpecies.size > 0) out = out.filter((p) => selectedSpecies.has(p.species));
    if (selectedVendors.size > 0) out = out.filter((p) => selectedVendors.has(p.vendorId));
    return out;
  }, [products, inStockOnly, bulkMinKg, usage, selectedSpecies, selectedVendors]);

  const budgetPresets = useMemo(
    () =>
      BUDGET_PRESETS.filter((preset) => {
        if (preset.min === null && preset.max === null) return true;
        if (preset.min === minPrice && preset.max === maxPrice) return true;
        return withoutBudget.some(
          (p) =>
            (preset.min === null || (p.maxPriceZar ?? p.priceZar) >= preset.min) &&
            (preset.max === null || p.priceZar <= preset.max),
        );
      }),
    [withoutBudget, minPrice, maxPrice],
  );

  const speciesCounts = useMemo(() => {
    const c: Partial<Record<WoodSpecies, number>> = {};
    for (const p of productsForSpeciesCount) c[p.species] = (c[p.species] ?? 0) + 1;
    return c;
  }, [productsForSpeciesCount]);

  const vendorCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of productsForVendorCount) c[p.vendorId] = (c[p.vendorId] ?? 0) + 1;
    return c;
  }, [productsForVendorCount]);

  const filtered = useMemo(() => {
    let out = baseFiltered;
    if (selectedSpecies.size > 0) out = out.filter((p) => selectedSpecies.has(p.species));
    if (selectedVendors.size > 0) out = out.filter((p) => selectedVendors.has(p.vendorId));

    switch (sort) {
      case "price-per-kg-asc":
        out = [...out].sort((a, b) => a.pricePerKgZar - b.pricePerKgZar);
        break;
      case "price-per-kg-desc":
        out = [...out].sort((a, b) => b.pricePerKgZar - a.pricePerKgZar);
        break;
      case "price-asc":
        out = [...out].sort((a, b) => a.priceZar - b.priceZar);
        break;
    }
    return out;
  }, [baseFiltered, selectedSpecies, selectedVendors, sort]);

  const speciesOptions = useMemo(() => {
    return Object.values(SPECIES)
      .filter((s) => (speciesCounts[s.id] ?? 0) > 0 || selectedSpecies.has(s.id))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [speciesCounts, selectedSpecies]);

  const vendorOptions = useMemo(() => {
    return vendors
      .filter((v) => (vendorCounts[v.id] ?? 0) > 0 || selectedVendors.has(v.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [vendors, vendorCounts, selectedVendors]);

  const vendorById = useMemo(() => {
    const m: Record<string, Vendor> = {};
    for (const v of vendors) m[v.id] = v;
    return m;
  }, [vendors]);

  function toggleSpecies(s: WoodSpecies) {
    setSelectedSpecies((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
    setPage(1);
  }

  function toggleVendor(v: string) {
    setSelectedVendors((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
    setPage(1);
  }

  function clearAll() {
    setUsage("all");
    setSelectedSpecies(new Set());
    setSelectedVendors(new Set());
    setInStockOnly(true);
    setBulkMinKg(null);
    setMinPrice(null);
    setMaxPrice(null);
    setSort("price-per-kg-asc");
    setPage(1);
  }

  const hasFilters =
    usage !== "all" ||
    selectedSpecies.size > 0 ||
    selectedVendors.size > 0 ||
    !inStockOnly ||
    bulkMinKg !== null ||
    minPrice !== null ||
    maxPrice !== null;

  // Filters that live in the drawer below lg, counted on the Filters button so
  // a reader can see something is narrowing the list without opening it. The
  // usage tabs stay visible at every width, so they aren't counted.
  const drawerFilterCount =
    selectedSpecies.size +
    selectedVendors.size +
    (inStockOnly ? 0 : 1) +
    (bulkMinKg !== null ? 1 : 0) +
    (minPrice !== null || maxPrice !== null ? 1 : 0);

  // Rendered twice: inline in the toolbar from lg, and inside the drawer below
  // it, where the toolbar only has room for sort and the Filters button.
  const inStockControl = (
    <label className="flex min-h-11 items-center gap-2 text-base lg:min-h-0 lg:gap-1.5 lg:text-sm">
      <input
        type="checkbox"
        checked={inStockOnly}
        onChange={(e) => {
          setInStockOnly(e.target.checked);
          setPage(1);
        }}
        className="size-5 rounded border-stone-300 accent-amber-700 lg:size-4"
      />
      <PackageCheck className="size-4 text-stone-500 dark:text-stone-400" aria-hidden />
      In stock only
    </label>
  );

  const bulkControl = (
    <label
      className="flex items-center gap-1.5 text-base lg:text-sm"
      title="Show only products at or above this size — pallets and bakkie loads."
    >
      <Layers className="size-4 text-stone-500 dark:text-stone-400" aria-hidden />
      <span>Bulk</span>
      <select
        value={bulkMinKg ?? ""}
        onChange={(e) => {
          setBulkMinKg(e.target.value === "" ? null : Number(e.target.value));
          setPage(1);
        }}
        className="min-h-11 rounded-md border border-stone-300 bg-white px-2 py-1 text-base lg:min-h-0 lg:text-sm dark:border-stone-700 dark:bg-stone-900"
      >
        {bulkOptions.map((opt) => (
          <option key={opt.label} value={opt.value ?? ""}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-4 sm:mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {region.name} firewood prices
          </h1>
          {/* The heading already names the city; on a phone the chip is a
              second row saying it again. */}
          <span className="hidden rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200 sm:inline-block dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800/50">
            {region.name}
          </span>
        </div>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Ranked by rand per kilogram across {vendors.length} {region.name} vendor
          {vendors.length === 1 ? "" : "s"}. Data refreshed{" "}
          <RefreshedAt iso={generatedAt} />.
        </p>
        <VendorFailureNotice vendors={vendors} vendorRunStatus={vendorRunStatus} />
      </header>

      {/* `contents` below sm so the toolbar is a child of the page column,
          which is what lets it stick for the length of the list on a phone. */}
      <div className="contents sm:mb-4 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
        {/* Four equal segments on a phone, one row; inline tabs from sm. */}
        <div className="mb-2 grid grid-cols-4 gap-1.5 sm:mb-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          {(Object.keys(USAGE_LABEL) as UsageFilter[])
            .filter((u) => u !== "both")
            .map((u) => {
              const Icon = USAGE_ICON[u];
              const count = usageCounts[u as keyof typeof usageCounts] ?? 0;
              // Disabled rather than hidden: these are the primary controls and
              // a row that reflows as you filter is worse than a dimmed tab.
              const empty = count === 0 && usage !== u;
              return (
                <button
                  key={u}
                  type="button"
                  disabled={empty}
                  aria-pressed={usage === u}
                  title={empty ? `No ${USAGE_LABEL[u].toLowerCase()} wood listed here` : undefined}
                  onClick={() => {
                    setUsage(u);
                    setPage(1);
                  }}
                  className={`flex min-h-12 flex-col items-center justify-center rounded-md px-1 py-1 text-sm font-medium leading-tight transition motion-reduce:transition-none sm:min-h-0 sm:flex-row sm:gap-1.5 sm:px-3 sm:py-1.5 ${
                    usage === u
                      ? "bg-amber-700 text-white shadow-sm shadow-amber-900/30 dark:bg-amber-600 dark:text-stone-50"
                      : empty
                        ? "cursor-not-allowed bg-white text-stone-400 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-600 dark:ring-stone-800"
                        : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700 dark:hover:bg-stone-800"
                  }`}
                >
                  <Icon className="hidden size-4 sm:block" aria-hidden />
                  {USAGE_LABEL[u]}
                  <span
                    className={`text-xs sm:text-sm ${usage === u ? "text-amber-100" : "text-stone-500 dark:text-stone-400"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
        </div>
        <div className="sticky top-0 z-20 -mx-4 mb-3 flex items-center gap-2 border-b border-stone-200/70 bg-stone-50/95 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:mb-0 sm:ml-auto sm:flex-wrap sm:gap-x-3 sm:gap-y-2 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none dark:border-stone-800/70 dark:bg-stone-950/95 sm:dark:bg-transparent">
          <div className="hidden lg:flex lg:items-center lg:gap-x-3">
            {inStockControl}
            {bulkControl}
          </div>
          <select
            value={sort}
            aria-label="Sort products"
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
            className="min-h-11 min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-2 py-1.5 text-base sm:min-h-0 sm:flex-none sm:text-sm dark:border-stone-700 dark:bg-stone-900"
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="filter-panel"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium ring-1 ring-stone-200 hover:bg-stone-100 sm:min-h-0 lg:hidden dark:bg-stone-900 dark:ring-stone-700 dark:hover:bg-stone-800"
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filters
            {drawerFilterCount > 0 && (
              <span className="rounded-full bg-amber-700 px-1.5 text-xs font-semibold text-white dark:bg-amber-600">
                {drawerFilterCount}
                <span className="sr-only"> active</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile backdrop — only shown when drawer is open at <lg. Above the
          return-to-top button (z-50), which otherwise sat on the sheet. */}
      {showFilters && (
        <button
          type="button"
          onClick={() => setShowFilters(false)}
          aria-hidden
          tabIndex={-1}
          className="fixed inset-0 z-60 bg-stone-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
        <aside
          ref={panelRef}
          id="filter-panel"
          className={`self-start space-y-6 lg:sticky lg:top-20 lg:block ${
            showFilters
              ? "fixed inset-x-0 bottom-0 z-70 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-stone-200 bg-stone-50 px-4 pt-0 shadow-2xl lg:static lg:z-auto lg:max-h-none lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none dark:border-stone-800 dark:bg-stone-950 dark:lg:bg-transparent"
              : "hidden"
          }`}
          aria-label="Filters"
        >
          {/* The heading stays in the accessibility tree at every width; only
              the sheet chrome around it is mobile-only. Sticky so Close stays
              in reach while the sheet scrolls. */}
          <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-2 lg:static lg:mx-0 lg:block lg:border-0 lg:bg-transparent lg:p-0 dark:border-stone-800 dark:bg-stone-950 dark:lg:bg-transparent">
            <h2 className="text-base font-semibold lg:sr-only">Filters</h2>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              aria-label="Close filters"
              className="flex size-11 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900 lg:hidden dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="space-y-1 lg:hidden">
            {inStockControl}
            {bulkControl}
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="min-h-11 w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 lg:min-h-0 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Reset filters
            </button>
          )}
          <FilterGroup title="Budget (total)">
            <div className="mb-2 flex flex-wrap gap-1.5 lg:gap-1">
              {budgetPresets.map((preset) => {
                const active = minPrice === preset.min && maxPrice === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setMinPrice(preset.min);
                      setMaxPrice(preset.max);
                      setPage(1);
                    }}
                    aria-pressed={active}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition lg:px-2 lg:py-1 lg:text-xs ${
                      active
                        ? "bg-amber-700 text-white shadow-sm shadow-amber-900/30 dark:bg-amber-600 dark:text-stone-50"
                        : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700 dark:hover:bg-stone-800"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-1.5 rounded-md border border-stone-300 px-2 py-2 focus-within:ring-2 lg:py-1.5 focus-within:ring-amber-400 dark:border-stone-700">
                <span className="whitespace-nowrap text-xs text-stone-500 dark:text-stone-400">Min R</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={minPrice ?? ""}
                  onChange={(e) => {
                    const n = e.target.value === "" ? null : Number(e.target.value);
                    setMinPrice(n !== null && n > 0 ? n : null);
                    setPage(1);
                  }}
                  className="w-full min-w-0 bg-transparent text-base tabular-nums outline-none lg:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </label>
              <label className="flex items-center gap-1.5 rounded-md border border-stone-300 px-2 py-2 focus-within:ring-2 lg:py-1.5 focus-within:ring-amber-400 dark:border-stone-700">
                <span className="whitespace-nowrap text-xs text-stone-500 dark:text-stone-400">Max R</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="100"
                  placeholder="Any"
                  value={maxPrice ?? ""}
                  onChange={(e) => {
                    const n = e.target.value === "" ? null : Number(e.target.value);
                    setMaxPrice(n !== null && n > 0 ? n : null);
                    setPage(1);
                  }}
                  className="w-full min-w-0 bg-transparent text-base tabular-nums outline-none lg:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </label>
            </div>
            <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
              Filters by total product price. Use this with &ldquo;Cheapest per kg
              first&rdquo; sort to find the best value within your budget.
            </p>
          </FilterGroup>
          <FilterGroup title="Wood type">
            <div className="space-y-1 lg:max-h-96 lg:overflow-y-auto lg:pr-1">
              {speciesOptions.map((s) => (
                <FilterChip
                  key={s.id}
                  label={s.displayName}
                  count={speciesCounts[s.id]}
                  active={selectedSpecies.has(s.id)}
                  onToggle={() => toggleSpecies(s.id)}
                  dot={s.color}
                />
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="Vendor">
            <div className="space-y-1">
              {vendorOptions.map((v) => (
                <FilterChip
                  key={v.id}
                  label={v.name}
                  count={vendorCounts[v.id] ?? 0}
                  active={selectedVendors.has(v.id)}
                  onToggle={() => toggleVendor(v.id)}
                />
              ))}
            </div>
          </FilterGroup>
          {/* Every change applies live, so this only closes the sheet — but
              without it the way back to the list was a small X at the top,
              past the whole scrolled sheet, with no word on what matched. */}
          <div className="sticky bottom-0 -mx-4 border-t border-stone-200 bg-stone-50 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden dark:border-stone-800 dark:bg-stone-950">
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="min-h-11 w-full rounded-md bg-amber-700 px-4 text-base font-semibold text-white shadow-sm hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              {filtered.length === 0
                ? "No products match"
                : `Show ${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </aside>

        <PagedList
          products={filtered}
          vendorById={vendorById}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          clearAll={clearAll}
        />
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">{title}</h3>
      {children}
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onToggle,
  dot,
}: {
  label: string;
  count?: number;
  active: boolean;
  onToggle: () => void;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex min-h-11 w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-base transition lg:min-h-0 lg:text-sm ${
        active
          ? "bg-amber-700 text-white shadow-sm shadow-amber-900/30 dark:bg-amber-600 dark:text-stone-50"
          : "hover:bg-stone-200/60 dark:hover:bg-stone-800"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        {dot && <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${dot}`} />}
        <span className="truncate">{label}</span>
      </span>
      {count !== undefined && (
        <span
          className={`ml-2 shrink-0 text-xs ${
            active ? "text-amber-100 dark:text-amber-100" : "text-stone-500 dark:text-stone-400"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ProductRow({ product, vendor }: { product: Product; vendor?: Vendor }) {
  const onSale =
    product.regularPriceZar !== undefined && product.regularPriceZar > product.priceZar;
  const speciesInfo = SPECIES[product.species];

  return (
    <li className="rounded-lg border border-stone-200 bg-white p-3.5 transition hover:shadow-md sm:p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-base font-semibold leading-tight">
              <TrackedLink
                href={product.url}
                event="vendor_click"
                data={{
                  vendor: product.vendorId,
                  product: product.id,
                  source: "product-title",
                }}
                className="hover:underline"
              >
                {product.title}
              </TrackedLink>
            </h2>
            {!product.inStock && (
              <span className="rounded bg-stone-200 px-1.5 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                Out of stock
              </span>
            )}
            {onSale && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
                Sale
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
            <span>{vendor?.name ?? product.vendorId}</span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className={`size-2 shrink-0 rounded-full ${speciesInfo.color}`} />
              {speciesInfo.displayName}
            </span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="capitalize">{product.usage === "both" ? "braai + fireplace" : product.usage}</span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span>{formatKg(product.weightKg)}</span>
            {product.weightEstimated && (
              <abbr
                title="Weight estimated from piece count or volume — not stated by vendor"
                className="cursor-help font-medium text-amber-700 no-underline dark:text-amber-300"
              >
                ~est
              </abbr>
            )}
          </div>
          {vendor && (
            <p className="mt-2 hidden text-xs text-stone-500 sm:block dark:text-stone-400">
              <span className="font-medium">Delivery:</span> {vendor.delivery.description}
            </p>
          )}
        </div>

        {/* On a phone the price and the Buy button share one row, straight
            after the title, so a card reads name → price → action before the
            delivery note rather than making the price wait behind it. */}
        <div className="flex items-end justify-between gap-3 border-t border-stone-100 pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right dark:border-stone-800 sm:dark:border-0">
          <div className="min-w-0">
            <div
              className="text-xl font-bold tabular-nums"
              title={
                product.maxPricePerKgZar
                  ? "Price varies by delivery zone — showing the full range. Click through for full pricing."
                  : undefined
              }
            >
              {product.maxPricePerKgZar &&
              product.maxPricePerKgZar !== product.pricePerKgZar
                ? `${formatZar(product.pricePerKgZar)}–${formatZar(product.maxPricePerKgZar)}`
                : formatZar(product.pricePerKgZar)}
              <span className="ml-1 text-xs font-normal text-stone-500 dark:text-stone-400">/kg</span>
            </div>
            <div className="mt-0.5 text-sm tabular-nums text-stone-600 dark:text-stone-400">
              {product.maxPriceZar && product.maxPriceZar !== product.priceZar ? (
                <>
                  {formatZar(product.priceZar)}–{formatZar(product.maxPriceZar)}
                </>
              ) : (
                formatZar(product.priceZar)
              )}
              {onSale && product.regularPriceZar && (
                <span className="ml-1 text-xs text-stone-500 line-through dark:text-stone-400">
                  {formatZar(product.regularPriceZar)}
                </span>
              )}
            </div>
          </div>
          <TrackedLink
            href={product.url}
            event="vendor_click"
            data={{
              vendor: product.vendorId,
              product: product.id,
              source: "buy-button",
            }}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-700 sm:mt-2 sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
          >
            {/* The vendor is already named on the card; a phone-width row has
                no room to repeat it, so it stays for screen readers only. */}
            Buy<span className="sr-only sm:not-sr-only"> at {vendor?.name ?? "vendor"}</span> →
          </TrackedLink>
        </div>
        {vendor && (
          <p className="text-xs text-stone-500 sm:hidden dark:text-stone-400">
            <span className="font-medium">Delivery:</span> {vendor.delivery.description}
          </p>
        )}
      </div>
    </li>
  );
}

function PagedList({
  products,
  vendorById,
  page,
  setPage,
  pageSize,
  setPageSize,
  clearAll,
}: {
  products: Product[];
  vendorById: Record<string, Vendor>;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  clearAll: () => void;
}) {
  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageItems = products.slice(start, end);
  const listTop = useRef<HTMLDivElement>(null);

  return (
    // flex-col so the key below can follow the list on a phone, where it used
    // to sit between the controls and the first price.
    <div ref={listTop} className="flex scroll-mt-16 flex-col sm:scroll-mt-20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600 dark:text-stone-400">
        <p>
          {total === 0
            ? "0 products match"
            : `Showing ${start + 1}–${end} of ${total} ${total === 1 ? "product" : "products"}`}
        </p>
        {total > PAGE_SIZE_OPTIONS[0] && (
          <label className="hidden items-center gap-1.5 text-xs sm:flex">
            Per page
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs tabular-nums dark:border-stone-700 dark:bg-stone-900"
              aria-label="Results per page"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {(pageItems.some((p) => p.weightEstimated) ||
        pageItems.some((p) => p.maxPricePerKgZar && p.maxPricePerKgZar !== p.pricePerKgZar)) && (
        <p className="order-last mt-4 text-xs text-stone-600 sm:order-none sm:mt-0 sm:mb-3 dark:text-stone-400">
          {pageItems.some((p) => p.weightEstimated) && (
            <>
              <span className="font-medium text-amber-700 dark:text-amber-300">~est</span>{" "}
              means the vendor didn&apos;t state a weight and we estimated it from piece
              count or volume.{" "}
            </>
          )}
          {pageItems.some((p) => p.maxPricePerKgZar && p.maxPricePerKgZar !== p.pricePerKgZar) && (
            <>A price range means the product costs different amounts by delivery zone.{" "}</>
          )}
          <Link
            href="/faq"
            className="text-amber-700 underline hover:no-underline dark:text-amber-400"
          >
            How we work it out
          </Link>
        </p>
      )}
      {total === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
          No products match your filters.{" "}
          <button onClick={clearAll} className="underline">
            Reset
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {pageItems.map((p) => (
              <ProductRow key={p.id} product={p} vendor={vendorById[p.vendorId]} />
            ))}
          </ul>
          {totalPages > 1 && (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onChange={(p) => {
                setPage(p);
                // To the first result rather than the page top: on a phone
                // the page top is a screen of header and controls away.
                scrollToElement(listTop.current);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages = visiblePages(page, totalPages);
  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-wrap items-center justify-center gap-1 text-sm"
    >
      <PageButton
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        label="Previous page"
      >
        <span className="inline-flex items-center gap-1">
          <ChevronLeft className="size-4" aria-hidden />
          Prev
        </span>
      </PageButton>
      <span className="px-3 tabular-nums text-stone-600 sm:hidden dark:text-stone-400">
        Page {page} of {totalPages}
      </span>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} aria-hidden className="hidden px-2 text-stone-500 sm:inline dark:text-stone-400">
            …
          </span>
        ) : (
          <PageButton
            key={p}
            numbered
            active={p === page}
            onClick={() => onChange(p)}
            label={p === page ? `Page ${p}, current` : `Go to page ${p}`}
          >
            {p}
          </PageButton>
        ),
      )}
      <PageButton
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        label="Next page"
      >
        <span className="inline-flex items-center gap-1">
          Next
          <ChevronRight className="size-4" aria-hidden />
        </span>
      </PageButton>
    </nav>
  );
}

function PageButton({
  children,
  onClick,
  active,
  disabled,
  label,
  numbered,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  numbered?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className={`min-h-11 min-w-9 items-center justify-center rounded-md px-3 py-1.5 font-medium transition sm:min-h-0 ${numbered ? "hidden sm:inline-flex" : "inline-flex"} ${
        active
          ? "bg-amber-700 text-white shadow-sm shadow-amber-900/30 dark:bg-amber-600 dark:text-stone-50"
          : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700 dark:hover:bg-stone-800 dark:disabled:hover:bg-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

function visiblePages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) pages.push("…");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}
