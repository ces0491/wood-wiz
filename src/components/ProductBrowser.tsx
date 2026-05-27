"use client";

import { useMemo, useState } from "react";
import type { Product, Vendor, WoodSpecies, WoodUsage } from "@/lib/types";
import { SPECIES } from "@/lib/wood-species";
import { formatKg, formatRelative, formatZar } from "@/lib/format";

type UsageFilter = "all" | WoodUsage;
type SortKey = "price-per-kg-asc" | "price-per-kg-desc" | "price-asc" | "weight-desc";

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

const PAGE_SIZE = 25;

const SORT_LABEL: Record<SortKey, string> = {
  "price-per-kg-asc": "Cheapest per kg first",
  "price-per-kg-desc": "Most expensive per kg first",
  "price-asc": "Lowest total price first",
  "weight-desc": "Largest pack first",
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
  const [sort, setSort] = useState<SortKey>("price-per-kg-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const baseFiltered = useMemo(() => {
    let out = products;
    if (inStockOnly) out = out.filter((p) => p.inStock);
    if (usage !== "all") {
      out = out.filter((p) => p.usage === usage || p.usage === "both");
    }
    return out;
  }, [products, usage, inStockOnly]);

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
      case "weight-desc":
        out = [...out].sort((a, b) => b.weightKg - a.weightKg);
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
    setSort("price-per-kg-asc");
    setPage(1);
  }

  const failedVendors = Object.entries(vendorRunStatus).filter(([, s]) => !s.ok);
  const hasFilters =
    usage !== "all" || selectedSpecies.size > 0 || selectedVendors.size > 0 || !inStockOnly;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Wood Wiz</h1>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">
            Cape Town
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
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
          .map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => {
                setUsage(u);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                usage === u
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {USAGE_LABEL[u]}
            </button>
          ))}
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => {
                setInStockOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-zinc-300"
            />
            In stock only
          </label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
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
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:ring-zinc-700 dark:hover:bg-zinc-800 lg:hidden"
          >
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
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Reset filters
            </button>
          )}
          <FilterGroup title="Wood type">
            <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
              {speciesOptions.map((s) => (
                <FilterChip
                  key={s.id}
                  label={s.displayName}
                  count={speciesCounts[s.id]}
                  active={selectedSpecies.has(s.id)}
                  onToggle={() => toggleSpecies(s.id)}
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
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      {children}
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onToggle,
}: {
  label: string;
  count?: number;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition ${
        active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
      }`}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span
          className={`ml-2 shrink-0 text-xs ${
            active ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500"
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
    <li className="rounded-lg border border-zinc-200 bg-white p-4 transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
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
              <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Out of stock
              </span>
            )}
            {onSale && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
                Sale
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <span>{vendor?.name ?? product.vendorId}</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>{speciesInfo.displayName}</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="capitalize">{product.usage === "both" ? "braai + fireplace" : product.usage}</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>{formatKg(product.weightKg)}</span>
            {product.weightEstimated && (
              <span title="Weight estimated from density — not stated by vendor" className="text-amber-700 dark:text-amber-300">
                ~est
              </span>
            )}
          </div>
          {vendor && (
            <p className="mt-2 text-xs text-zinc-500" title={vendor.delivery.description}>
              <span className="font-medium">Delivery:</span> {vendor.delivery.description}
            </p>
          )}
        </div>

        <div className="text-right">
          <div className="text-xl font-bold tabular-nums">
            {formatZar(product.pricePerKgZar)}
            <span className="ml-1 text-xs font-normal text-zinc-500">/kg</span>
          </div>
          <div className="mt-0.5 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
            {formatZar(product.priceZar)}
            {onSale && product.regularPriceZar && (
              <span className="ml-1 text-xs text-zinc-400 line-through">
                {formatZar(product.regularPriceZar)}
              </span>
            )}
          </div>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
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
      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
        {total === 0
          ? "0 products match"
          : `Showing ${start + 1}–${end} of ${total} ${total === 1 ? "product" : "products"}`}
      </p>
      {total === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-700">
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
        ← Prev
      </PageButton>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-zinc-500">
            …
          </span>
        ) : (
          <PageButton key={p} active={p === page} onClick={() => onChange(p)}>
            {p}
          </PageButton>
        ),
      )}
      <PageButton disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        Next →
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
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800 dark:disabled:hover:bg-zinc-900"
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
