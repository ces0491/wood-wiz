"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import type { Region } from "@/lib/regions";
import { useLastRegion } from "@/lib/last-region";

export interface RegionCard {
  region: Region;
  productCount: number;
  vendorCount: number;
}

/**
 * Which metro are you buying in.
 *
 * Deliberately not a comparison. Each card carries how much is listed and
 * nothing about price, because a per-kg figure beside another city's would
 * invite reading one against the other \u2014 and that comparison is meaningless.
 * Cape Town bulk runs cheaper than Gauteng's because it is nearer the source,
 * which says nothing about whether a vendor is good value to someone who lives
 * there. Prices are compared inside a metro, never across.
 *
 * A reader who has already chosen is sent straight through. The picker still
 * renders underneath, so it is what a first-time reader, a crawler and anyone
 * with storage blocked all get.
 */
export default function RegionPicker({ cards }: { cards: RegionCard[] }) {
  const router = useRouter();
  const remembered = useLastRegion();

  useEffect(() => {
    if (remembered) router.replace(`/${remembered}`);
  }, [remembered, router]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Where are you buying wood?
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Wood Wiz ranks firewood by rand per kilogram, comparing the vendors who deliver
          to you against each other. Pick your city to see its prices &mdash; we&apos;ll
          remember it next time.
        </p>
      </header>

      <ul className="space-y-3">
        {cards.map(({ region, productCount, vendorCount }) => (
          <li key={region.id}>
            <Link
              href={`/${region.id}`}
              className="group flex items-center gap-4 rounded-lg border border-stone-200 bg-white p-4 transition hover:border-amber-300 hover:shadow-md motion-reduce:transition-none dark:border-stone-800 dark:bg-stone-900 dark:hover:border-amber-800"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                <MapPin className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold">{region.name}</span>
                <span className="block text-xs text-stone-600 dark:text-stone-400">
                  {vendorCount} vendor{vendorCount === 1 ? "" : "s"} ·{" "}
                  {productCount} product{productCount === 1 ? "" : "s"} · {region.coverage}
                </span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-stone-500 transition group-hover:translate-x-0.5 group-hover:text-amber-700 motion-reduce:transition-none dark:text-stone-400 dark:group-hover:text-amber-400"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-xs text-stone-600 dark:text-stone-400">
        Only cities with vendors publishing a machine-readable catalogue are listed
        &mdash; see{" "}
        <Link href="/faq" className="text-amber-700 hover:underline dark:text-amber-400">
          how it works
        </Link>
        .
      </p>
    </div>
  );
}
