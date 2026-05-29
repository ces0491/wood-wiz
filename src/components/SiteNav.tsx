"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Prices" },
  { href: "/vendors", label: "Vendors" },
  { href: "/faq", label: "How it works" },
];

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

export default function SiteNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-30 border-b border-stone-200/70 bg-white/80 backdrop-blur dark:border-stone-800/70 dark:bg-stone-950/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          <StackedLogsMark className="text-amber-700 dark:text-amber-500" />
          Wood Wiz
        </Link>
        <ul className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
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
    </nav>
  );
}
