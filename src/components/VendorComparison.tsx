import {
  Layers,
  Package,
  PiggyBank,
  Tag,
  Trees,
  TrendingDown,
  Truck,
} from "lucide-react";
import type { ComparisonHighlights, VendorStats } from "@/lib/vendor-stats";
import type { Vendor } from "@/lib/types";
import { SPECIES } from "@/lib/wood-species";
import { formatKg, formatPct, formatRelative, formatZar } from "@/lib/format";

type IconType = typeof Tag;

interface Props {
  vendors: Vendor[];
  stats: VendorStats[];
  highlights: ComparisonHighlights;
  totalProducts: number;
  generatedAt: string;
}

function stackingLabel(s: Vendor["delivery"]["stacking"]): {
  text: string;
  tone: "good" | "neutral" | "unknown";
} {
  switch (s) {
    case "free":
      return { text: "Stacking included", tone: "good" };
    case "free-over-threshold":
      return { text: "Free stacking over threshold", tone: "good" };
    case "extra":
      return { text: "Stacking extra", tone: "neutral" };
    default:
      return { text: "Stacking unconfirmed", tone: "unknown" };
  }
}

export default function VendorComparison({
  vendors,
  stats,
  highlights,
  totalProducts,
  generatedAt,
}: Props) {
  const vendorById = Object.fromEntries(vendors.map((v) => [v.id, v]));
  const maxMedian = Math.max(...stats.map((s) => s.medianPricePerKgZar));
  const maxVariety = Math.max(...stats.map((s) => s.speciesCount));
  const maxSales = Math.max(...stats.map((s) => s.salesCount));
  const maxProductCount = Math.max(...stats.map((s) => s.productCount));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Vendor comparison</h1>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800/50">
            Cape Town
          </span>
        </div>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {totalProducts} products across {stats.length} vendors. Data refreshed{" "}
          {formatRelative(generatedAt)}.
        </p>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.cheapestMedian && (
          <SpotlightCard
            icon={TrendingDown}
            tone="emerald"
            label="Cheapest typical price"
            value={
              vendorById[highlights.cheapestMedian.vendorId]?.name ??
              highlights.cheapestMedian.vendorId
            }
            sub={`${formatZar(highlights.cheapestMedian.medianPricePerKgZar)} median per kg`}
          />
        )}
        {highlights.cheapestSingleProduct && (
          <SpotlightCard
            icon={PiggyBank}
            tone="amber"
            label="Lowest price per kg"
            value={formatZar(highlights.cheapestSingleProduct.pricePerKgZar)}
            sub={
              <>
                <a
                  href={highlights.cheapestSingleProduct.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {highlights.cheapestSingleProduct.title}
                </a>{" "}
                — {vendorById[highlights.cheapestSingleProduct.vendorId]?.name}
              </>
            }
          />
        )}
        {highlights.mostVariety && (
          <SpotlightCard
            icon={Trees}
            tone="sky"
            label="Most species variety"
            value={vendorById[highlights.mostVariety.vendorId]?.name ?? highlights.mostVariety.vendorId}
            sub={`${highlights.mostVariety.speciesCount} species across ${highlights.mostVariety.productCount} products`}
          />
        )}
        {highlights.mostSales && (
          <SpotlightCard
            icon={Tag}
            tone="rose"
            label="Most active sales right now"
            value={vendorById[highlights.mostSales.vendorId]?.name ?? highlights.mostSales.vendorId}
            sub={`${highlights.mostSales.salesCount} product${highlights.mostSales.salesCount === 1 ? "" : "s"} on sale`}
          />
        )}
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarChart
          icon={TrendingDown}
          title="Typical price per kg"
          subtitle="Median across each vendor's catalogue — lower is better"
          rows={stats
            .map((s) => ({
              label: vendorById[s.vendorId]?.name ?? s.vendorId,
              value: s.medianPricePerKgZar,
              display: formatZar(s.medianPricePerKgZar),
            }))
            .sort((a, b) => a.value - b.value)}
          max={maxMedian}
          tone="cheap"
        />
        <BarChart
          icon={Trees}
          title="Species variety"
          subtitle="Distinct wood types per vendor"
          rows={stats
            .map((s) => ({
              label: vendorById[s.vendorId]?.name ?? s.vendorId,
              value: s.speciesCount,
              display: `${s.speciesCount} species`,
            }))
            .sort((a, b) => b.value - a.value)}
          max={maxVariety}
          tone="abundant"
        />
        <BarChart
          icon={Package}
          title="Product range"
          subtitle="Total in-catalog products per vendor"
          rows={stats
            .map((s) => ({
              label: vendorById[s.vendorId]?.name ?? s.vendorId,
              value: s.productCount,
              display: `${s.productCount} (${s.inStockCount} in stock)`,
            }))
            .sort((a, b) => b.value - a.value)}
          max={maxProductCount}
          tone="abundant"
        />
        {maxSales > 0 && (
          <BarChart
            icon={Tag}
            title="Active sales right now"
            subtitle="In-stock products with a struck-through regular price"
            rows={stats
              .map((s) => ({
                label: vendorById[s.vendorId]?.name ?? s.vendorId,
                value: s.salesCount,
                display: `${s.salesCount}`,
              }))
              .sort((a, b) => b.value - a.value)}
            max={maxSales}
            tone="sale"
          />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Vendor breakdown</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...stats]
            .sort((a, b) => a.medianPricePerKgZar - b.medianPricePerKgZar)
            .map((s) => {
              const v = vendorById[s.vendorId];
              if (!v) return null;
              const stacking = stackingLabel(v.delivery.stacking);
              const freeDelivery = v.delivery.freeOverZar;
              const inStockRate = s.productCount > 0 ? s.inStockCount / s.productCount : 0;
              return (
                <article
                  key={s.vendorId}
                  className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                >
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold">
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {v.name}
                      </a>
                    </h3>
                    <span className="text-xs uppercase tracking-wide text-stone-500">
                      {v.platform}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <Stat label="Median per kg" value={formatZar(s.medianPricePerKgZar)} />
                    <Stat label="Cheapest per kg" value={formatZar(s.minPricePerKgZar)} />
                    <Stat label="Products" value={`${s.productCount}`} />
                    <Stat label="In stock" value={`${s.inStockCount} (${formatPct(inStockRate)})`} />
                    <Stat label="Species" value={`${s.speciesCount}`} />
                    <Stat label="On sale" value={`${s.salesCount}`} />
                  </dl>

                  <div className="mt-3 border-t border-stone-100 pt-3 dark:border-stone-800">
                    <p className="text-xs text-stone-500">Cheapest product</p>
                    <a
                      href={s.cheapestProduct.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline"
                    >
                      {s.cheapestProduct.title}
                    </a>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-stone-500">
                      <span
                        aria-hidden
                        className={`size-2 shrink-0 rounded-full ${SPECIES[s.cheapestProduct.species].color}`}
                      />
                      <span>{SPECIES[s.cheapestProduct.species].displayName}</span>
                      <span>•</span>
                      <span>{formatZar(s.cheapestProduct.priceZar, 0)} total</span>
                      <span>•</span>
                      <span>{formatKg(s.cheapestProduct.weightKg)}</span>
                      {s.cheapestProduct.weightEstimated && (
                        <span
                          title="Weight estimated from piece count or volume — not stated by vendor"
                          className="text-amber-700 dark:text-amber-300"
                        >
                          ~est
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="mt-3 border-t border-stone-100 pt-3 dark:border-stone-800">
                    <p className="text-xs text-stone-500">Delivery</p>
                    <p className="text-sm">{v.delivery.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {freeDelivery !== undefined && (
                        <Badge tone="good" icon={Truck}>
                          Free delivery over {formatZar(freeDelivery, 0)}
                        </Badge>
                      )}
                      {stacking.tone !== "unknown" && (
                        <Badge tone={stacking.tone} icon={Layers}>
                          {stacking.text}
                        </Badge>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </section>
    </div>
  );
}

type SpotlightTone = "emerald" | "amber" | "sky" | "rose";

const SPOTLIGHT_TONE: Record<SpotlightTone, { iconBg: string; iconColor: string; border: string }> = {
  emerald: {
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200/60 dark:border-emerald-900/50",
  },
  amber: {
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200/60 dark:border-amber-900/50",
  },
  sky: {
    iconBg: "bg-sky-100 dark:bg-sky-900/40",
    iconColor: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200/60 dark:border-sky-900/50",
  },
  rose: {
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
    iconColor: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200/60 dark:border-rose-900/50",
  },
};

function SpotlightCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: IconType;
  tone: SpotlightTone;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  const t = SPOTLIGHT_TONE[tone];
  return (
    <div
      className={`rounded-lg border ${t.border} bg-white p-4 dark:bg-stone-900`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-md ${t.iconBg}`}
          aria-hidden
        >
          <Icon className={`size-5 ${t.iconColor}`} />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
          <p className="mt-0.5 text-lg font-semibold leading-tight">{value}</p>
          {sub !== undefined && (
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">{sub}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function Badge({
  children,
  tone,
  icon: Icon,
}: {
  children: React.ReactNode;
  tone: "good" | "neutral" | "unknown";
  icon?: IconType;
}) {
  const styles = {
    good: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
    neutral: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
    unknown:
      "bg-stone-50 text-stone-500 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-500 dark:ring-stone-800",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {Icon && <Icon className="size-3" aria-hidden />}
      {children}
    </span>
  );
}

function BarChart({
  title,
  subtitle,
  rows,
  max,
  tone,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  rows: { label: string; value: number; display: string }[];
  max: number;
  tone: "cheap" | "abundant" | "sale";
  icon?: IconType;
}) {
  const barColor = {
    cheap: "bg-emerald-500/80 dark:bg-emerald-400/70",
    abundant: "bg-sky-500/80 dark:bg-sky-400/70",
    sale: "bg-amber-500/80 dark:bg-amber-400/70",
  }[tone];
  const iconColor = {
    cheap: "text-emerald-600 dark:text-emerald-400",
    abundant: "text-sky-600 dark:text-sky-400",
    sale: "text-amber-600 dark:text-amber-400",
  }[tone];

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`size-4 ${iconColor}`} aria-hidden />}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="text-xs text-stone-500">{subtitle}</p>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => {
          const pct = max > 0 ? (r.value / max) * 100 : 0;
          return (
            <li key={r.label}>
              <div className="mb-0.5 flex justify-between text-xs">
                <span className="truncate pr-2">{r.label}</span>
                <span className="shrink-0 tabular-nums text-stone-600 dark:text-stone-400">
                  {r.display}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
