"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import type { Product, Vendor, WoodSpecies, WoodUsage } from "@/lib/types";
import { SPECIES } from "@/lib/wood-species";
import { formatKg, formatRelative, formatZar } from "@/lib/format";

type UsageFilter = "all" | WoodUsage;
type SortKey = "price-per-kg-asc" | "price-per-kg-desc" | "price-asc";

const BULK_KG = 500;

interface Props {
  products: Product[];
  vendors: Vendor[];
  generatedAt: string;
  vendorRunStatus: Record<string, { ok: boolean; count: number; error?: string; ranAt: string }>;
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

const PAGE_SIZE = 25;

const SORT_LABEL: Record<SortKey, string> = {
  "price-per-kg-asc": "Cheapest per kg first",
  "price-per-kg-desc": "Most expensive per kg first",
  "price-asc": "Lowest total price first",
};


export default function ProductBrowser({
  products,
  vendors,
  generatedAt,
  vendorRunStatus,
}: Props) {
  const [usage, setUsage] = useState<UsageFilter>("all");
  const [selectedSpecies, setSelectedSpecies] = useState<Set<WoodSpecies>>(new Set());
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const [inStockOnly, setInStockOnly] = useState(true);
  const [bulkOnly, setBulkOnly] = useState(false);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("price-per-kg-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const baseFiltered = useMemo(() => {
    let out = products;
    if (inStockOnly) out = out.filter((p) => p.inStock);
    if (bulkOnly) out = out.filter((p) => p.weightKg >= BULK_KG);
    if (usage !== "all") {
      out = out.filter((p) => p.usage === usage || p.usage === "both");
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
  }, [products, usage, inStockOnly, bulkOnly, minPrice, maxPrice]);

  const productsForSpeciesCount = useMemo(() => {
    if (selectedVendors.size === 0) return baseFiltered;
    return baseFiltered.filter((p) => selectedVendors.has(p.vendorId));
  }, [baseFiltered, selectedVendors]);

  const productsForVendorCount = useMemo(() => {
    if (selectedSpecies.size === 0) return baseFiltered;
    return baseFiltered.filter((p) => selectedSpecies.has(p.species));
  }, [baseFiltered, selectedSpecies]);

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
      .sort((a, b) => (speciesCounts[b.id] ?? 0) - (speciesCounts[a.id] ?? 0));
  }, [speciesCounts, selectedSpecies]);

  const vendorOptions = useMemo(() => {
    return vendors
      .filter((v) => (vendorCounts[v.id] ?? 0) > 0 || selectedVendors.has(v.id))
      .sort((a, b) => (vendorCounts[b.id] ?? 0) - (vendorCounts[a.id] ?? 0));
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
    setBulkOnly(false);
    setMinPrice(null);
    setMaxPrice(null);
    setSort("price-per-kg-asc");
    setPage(1);
  }

  const failedVendors = Object.entries(vendorRunStatus).filter(([, s]) => !s.ok);
  const hasFilters =
    usage !== "all" ||
    selectedSpecies.size > 0 ||
    selectedVendors.size > 0 ||
    !inStockOnly ||
    bulkOnly ||
    minPrice !== null ||
    maxPrice !== null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Wood Wiz</h1>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800/50">
            Cape Town
          </span>
        </div>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Ranked by rand per kilogram across {vendors.length} Cape Town vendors. Data refreshed{" "}
          {formatRelative(generatedAt)}.
        </p>
        {failedVendors.length > 0 && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            ⚠ {failedVendors.length} vendor{failedVendors.length === 1 ? "" : "s"} failed to scrape:{" "}
            {failedVendors.map(([id]) => vendorById[id]?.name ?? id).join(", ")}
          </p>
        )}
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(Object.keys(USAGE_LABEL) as UsageFilter[])
          .filter((u) => u !== "both")
          .map((u) => {
            const Icon = USAGE_ICON[u];
            return (
              <button
                key={u}
                type="button"
                onClick={() => {
                  setUsage(u);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  usage === u
                    ? "bg-amber-700 text-white shadow-sm shadow-amber-900/30 dark:bg-amber-600 dark:text-stone-50"
                    : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700 dark:hover:bg-stone-800"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {USAGE_LABEL[u]}
              </button>
            );
          })}
        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-2">
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => {
                setInStockOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-stone-300 accent-amber-700"
            />
            <PackageCheck className="size-4 text-stone-500" aria-hidden />
            In stock only
          </label>
          <label
            className="flex items-center gap-1.5 text-sm"
            title={`Show only products of ${BULK_KG} kg or more — typically pallets and bakkie loads.`}
          >
            <input
              type="checkbox"
              checked={bulkOnly}
              onChange={(e) => {
                setBulkOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-stone-300 accent-amber-700"
            />
            <Layers className="size-4 text-stone-500" aria-hidden />
            Bulk (≥ {BULK_KG} kg)
          </label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
            className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm dark:border-stone-700 dark:bg-stone-900"
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium ring-1 ring-stone-200 hover:bg-stone-100 dark:bg-stone-900 dark:ring-stone-700 dark:hover:bg-stone-800 lg:hidden"
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            {showFilters ? "Hide" : "Filters"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
        <aside
          className={`space-y-6 lg:block ${showFilters ? "block" : "hidden"} self-start lg:sticky lg:top-4`}
        >
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Reset filters
            </button>
          )}
          <FilterGroup title="Budget (total)">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-1.5 rounded-md border border-stone-300 px-2 py-1.5 focus-within:ring-2 focus-within:ring-amber-400 dark:border-stone-700">
                <span className="text-xs text-stone-500">Min R</span>
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
                  className="w-full bg-transparent text-sm tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </label>
              <label className="flex items-center gap-1.5 rounded-md border border-stone-300 px-2 py-1.5 focus-within:ring-2 focus-within:ring-amber-400 dark:border-stone-700">
                <span className="text-xs text-stone-500">Max R</span>
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
                  className="w-full bg-transparent text-sm tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </label>
            </div>
            <p className="mt-1.5 text-xs text-stone-500">
              Filters by total product price. Use this with &ldquo;Cheapest per kg
              first&rdquo; sort to find the best value within your budget.
            </p>
          </FilterGroup>
          <FilterGroup title="Wood type">
            <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
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
        </aside>

        <PagedList
          products={filtered}
          vendorById={vendorById}
          page={page}
          setPage={setPage}
          clearAll={clearAll}
        />
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</h3>
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
      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition ${
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
            active ? "text-amber-100 dark:text-amber-100" : "text-stone-500"
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
    <li className="rounded-lg border border-stone-200 bg-white p-4 transition hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-base font-semibold leading-tight">
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {product.title}
              </a>
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
              <span title="Weight estimated from density — not stated by vendor" className="text-amber-700 dark:text-amber-300">
                ~est
              </span>
            )}
          </div>
          {vendor && (
            <p className="mt-2 text-xs text-stone-500" title={vendor.delivery.description}>
              <span className="font-medium">Delivery:</span> {vendor.delivery.description}
            </p>
          )}
        </div>

        <div className="text-right">
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
            <span className="ml-1 text-xs font-normal text-stone-500">/kg</span>
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
              <span className="ml-1 text-xs text-stone-400 line-through">
                {formatZar(product.regularPriceZar)}
              </span>
            )}
          </div>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
          >
            Buy at {vendor?.name ?? "vendor"} →
          </a>
        </div>
      </div>
    </li>
  );
}

function PagedList({
  products,
  vendorById,
  page,
  setPage,
  clearAll,
}: {
  products: Product[];
  vendorById: Record<string, Vendor>;
  page: number;
  setPage: (p: number) => void;
  clearAll: () => void;
}) {
  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageItems = products.slice(start, end);

  return (
    <main>
      <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
        {total === 0
          ? "0 products match"
          : `Showing ${start + 1}–${end} of ${total} ${total === 1 ? "product" : "products"}`}
      </p>
      {total === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center text-sm text-stone-500 dark:border-stone-700">
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
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            />
          )}
        </>
      )}
    </main>
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
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-1 text-sm">
      <PageButton disabled={page === 1} onClick={() => onChange(page - 1)}>
        <span className="inline-flex items-center gap-1">
          <ChevronLeft className="size-4" aria-hidden />
          Prev
        </span>
      </PageButton>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-stone-500">
            …
          </span>
        ) : (
          <PageButton key={p} active={p === page} onClick={() => onChange(p)}>
            {p}
          </PageButton>
        ),
      )}
      <PageButton disabled={page === totalPages} onClick={() => onChange(page + 1)}>
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
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-w-9 rounded-md px-3 py-1.5 font-medium transition ${
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
