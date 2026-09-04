"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { REGIONS, isRegionId } from "@/lib/regions";
import { navRegion, useLastRegion } from "@/lib/last-region";

function StackedLogsMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      aria-hidden
      className={className}
    >
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="14" height="5" rx="2.5" fill="currentColor" fillOpacity="0.18" />
        <line x1="14" y1="5.5" x2="15.5" y2="5.5" opacity="0.6" />
        <rect x="6" y="9.5" width="14" height="5" rx="2.5" fill="currentColor" fillOpacity="0.18" />
        <line x1="17" y1="12" x2="18.5" y2="12" opacity="0.6" />
        <rect x="3" y="16" width="14" height="5" rx="2.5" fill="currentColor" fillOpacity="0.18" />
        <line x1="14" y1="18.5" x2="15.5" y2="18.5" opacity="0.6" />
      </g>
    </svg>
  );
}

/** The metro the current URL is in, or null on `/` and `/faq`. */
function regionFromPath(pathname: string) {
  const first = pathname.split("/")[1] ?? "";
  return isRegionId(first) ? first : null;
}

export default function SiteNav() {
  const pathname = usePathname();
  const inPath = regionFromPath(pathname);
  const remembered = useLastRegion();

  // Prices and Vendors are per metro and stay inside the one you're in. On a
  // metro-less page (`/faq`) they point at the remembered metro rather than
  // vanishing: dropping them stranded a reader on the FAQ with nothing but the
  // logo back to the picker, which is two taps to get where they were.
  const region = inPath ?? (remembered ? navRegion(remembered) : null);
  const links = region
    ? [
        { href: `/${region}`, label: "Prices" },
        { href: `/${region}/vendors`, label: "Vendors" },
        { href: "/faq", label: "How it works" },
      ]
    : [{ href: "/faq", label: "How it works" }];

  return (
    <nav className="sticky top-0 z-30 border-b border-stone-200/70 bg-white/80 backdrop-blur dark:border-stone-800/70 dark:bg-stone-950/70">
      {/* Wraps to two rows on a phone rather than overflowing: logo and city
          on the first, page links on the second. Measured at 375px the single
          row came to 456px and scrolled the whole document sideways. */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href={region ? `/${region}` : "/"}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          <StackedLogsMark className="text-amber-700 dark:text-amber-500" />
          Wood Wiz
        </Link>
        {inPath && REGIONS.length > 1 && (
          <div className="order-1 ml-auto sm:order-3 sm:ml-0">
            <RegionSwitch current={inPath} pathname={pathname} />
          </div>
        )}
        <div className="order-2 flex w-full items-center gap-1 sm:ml-auto sm:w-auto">
          <ul className="flex items-center gap-1">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md whitespace-nowrap px-3 py-1.5 text-sm font-medium transition motion-reduce:transition-none ${
                      active
                        ? "bg-amber-700 text-white shadow-sm shadow-amber-900/30 dark:bg-amber-600 dark:text-stone-50"
                        : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}

/**
 * Switch metro, staying on the equivalent page.
 *
 * A plain list of links rather than a select: with two metros a dropdown costs
 * a click to discover, and the destinations are worth naming outright.
 */
function RegionSwitch({ current, pathname }: { current: string; pathname: string }) {
  const suffix = pathname.startsWith(`/${current}/vendors`) ? "/vendors" : "";
  return (
    <div
      className="ml-1 flex items-center gap-0.5 border-l border-stone-200 pl-2 dark:border-stone-700"
      aria-label="City"
    >
      {REGIONS.map((r) =>
        r.id === current ? (
          <span
            key={r.id}
            aria-current="page"
            className="rounded-md px-2.5 py-1.5 text-xs font-medium bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100"
          >
            {r.name}
          </span>
        ) : (
          <Link
            key={r.id}
            href={`/${r.id}${suffix}`}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 motion-reduce:transition-none dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            {r.name}
          </Link>
        ),
      )}
    </div>
  );
}
