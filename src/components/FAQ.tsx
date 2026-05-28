import { ChevronDown, Scale, ShieldCheck, Store } from "lucide-react";

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.18c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 5.82 0c2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.26 5.69.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

interface FaqSection {
  title: string;
  icon: typeof Scale;
  items: FaqItem[];
}

const SECTIONS: FaqSection[] = [
  {
    title: "How prices work",
    icon: Scale,
    items: [
      {
        q: "How is the price per kilogram calculated?",
        a: (
          <>
            <p>
              The total price the vendor charges divided by the total weight of the
              product. For a R&nbsp;2,050 listing of 1,000 split pieces with an estimated
              weight of 1,500&nbsp;kg, that&apos;s <strong>R&nbsp;1.37/kg</strong>.
            </p>
            <p>
              Most vendors state the bag weight directly (e.g.{" "}
              <em>&ldquo;18kg bag&rdquo;</em>) or the pallet count (e.g.{" "}
              <em>&ldquo;1700 x 20kg&rdquo;</em>). When they don&apos;t, we estimate
              &mdash; see &ldquo;~est&rdquo; below.
            </p>
          </>
        ),
      },
      {
        q: "What does ~est next to a weight mean?",
        a: (
          <>
            <p>
              The vendor didn&apos;t state the weight, so we estimated it. Two cases:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Piece count</strong> &mdash; we assume ~1.5&nbsp;kg per split
                piece. A &ldquo;1,000 piece&rdquo; bundle becomes 1,500&nbsp;kg.
              </li>
              <li>
                <strong>Volume</strong> &mdash; for &ldquo;0.5 m³&rdquo; or
                &ldquo;50L&rdquo; listings, we multiply by the species&apos; air-dry
                density.
              </li>
            </ul>
            <p>
              Estimated weights are reasonable averages but not vendor-stated. Confirm at
              checkout if the exact kilogram matters.
            </p>
          </>
        ),
      },
      {
        q: "Why does the Sale badge appear on some products?",
        a: (
          <p>
            The vendor&apos;s storefront reports a regular price higher than what
            they&apos;re currently charging. We show the strike-through and label it
            Sale. We don&apos;t verify whether it&apos;s a real time-limited discount or
            a permanent markdown.
          </p>
        ),
      },
      {
        q: "Why don't you include delivery costs in the price per kg?",
        a: (
          <p>
            Most vendors price delivery by suburb, with multiple tiers, and confirm the
            final charge at checkout. Folding that into a single per-kg number would
            require assumptions we can&apos;t back. Each vendor card surfaces their
            stated delivery rule (free over R&nbsp;X, flat fee, zoned, &amp;c.) so you
            can factor it in yourself.
          </p>
        ),
      },
      {
        q: "What about products with delivery zones or other variants?",
        a: (
          <>
            <p>
              Some vendors list one product with a separate price per delivery zone
              (West Coast vs Boland vs Cape Town, for example). For these, we show the
              full <strong>price range</strong> &mdash; e.g. <em>R&nbsp;5,497&ndash;R&nbsp;6,325</em>{" "}
              and <em>R&nbsp;1.22&ndash;R&nbsp;1.40&nbsp;/kg</em> &mdash; so you can see
              the cheapest and most expensive options at a glance.
            </p>
            <p>
              Sorting is always done by the cheapest price in the range, so products
              are ranked by what you&apos;d pay if you happened to be in the cheapest
              zone. Visit the vendor&apos;s page (linked from each row) to pick your
              actual zone and confirm the exact figure.
            </p>
            <p>
              When a variable product&apos;s variants all happen to be the same price
              (no zone variance), you&apos;ll just see a single number.
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: "Vendors and comparison",
    icon: Store,
    items: [
      {
        q: "Where do these prices come from?",
        a: (
          <>
            <p>
              An automated job scrapes each vendor&apos;s public product catalogue daily.
              We currently cover 8 Cape Town vendors:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Mother City Firewood</li>
              <li>The Wood Gurus</li>
              <li>Cape Town Firewood (CTF)</li>
              <li>The Firewood Company</li>
              <li>The Fire Man</li>
              <li>Lancehoudt</li>
              <li>Namibian Hardwood</li>
              <li>The Wood Bros</li>
            </ul>
            <p>
              We&apos;re not affiliated with any of them. There&apos;s no paid placement
              or ranking adjustment &mdash; vendors are ordered purely by the metric you
              chose (price per kg by default).
            </p>
          </>
        ),
      },
      {
        q: "How fresh is the data?",
        a: (
          <p>
            Refreshed every 24 hours. The exact time of the last refresh is shown in the
            header of the Prices and Vendors pages (e.g. &ldquo;Data refreshed 6 hours
            ago&rdquo;). If you need real-time accuracy &mdash; before placing a large
            order, say &mdash; click through to the vendor&apos;s page to confirm.
          </p>
        ),
      },
      {
        q: "Why are some vendor averages on the Vendors page so high?",
        a: (
          <p>
            A vendor that sells both bulk hardwood pallets (R&nbsp;2&ndash;5/kg) and
            small specialty smoking-wood boxes (R&nbsp;100+/kg) will have a high{" "}
            <em>average</em> even though their bulk product is competitive. For a fairer
            sense of a vendor&apos;s typical bulk price, look at the &ldquo;Cheapest per
            kg&rdquo; stat in each vendor&apos;s breakdown card.
          </p>
        ),
      },
      {
        q: "What does Stacking unconfirmed mean?",
        a: (
          <p>
            Only Mother City Firewood and Lancehoudt explicitly state in their delivery
            descriptions that wood is stacked on arrival (instead of dumped on the
            driveway). The other six vendors don&apos;t say one way or the other &mdash;
            so we label them as unconfirmed rather than guessing. If stacking matters to
            you, ask at checkout.
          </p>
        ),
      },
      {
        q: "Why doesn't my favourite vendor appear?",
        a: (
          <p>
            We can only include vendors with a public, machine-readable product
            catalogue (most use Shopify, WooCommerce, or have a sitemap we can parse).
            Adding a new vendor requires writing a small scraper for their site format.
            Suggest one via the{" "}
            <a
              href="https://github.com/ces0491/wood-wiz/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 hover:underline dark:text-amber-400"
            >
              GitHub issue tracker
            </a>
            .
          </p>
        ),
      },
    ],
  },
  {
    title: "Trust and contact",
    icon: ShieldCheck,
    items: [
      {
        q: "Can I trust these prices?",
        a: (
          <p>
            Best-effort. We pull directly from each vendor&apos;s public storefront, so
            the numbers reflect what the vendor advertises at scrape time. Vendor prices
            can change between scrapes, and we occasionally hit edge cases where a
            vendor&apos;s API reports prices differently than what their site displays
            &mdash; we fix these as we find them. Always confirm at checkout for any
            sizeable order.
          </p>
        ),
      },
      {
        q: "Is this open source? Can I report a bug?",
        a: (
          <p>
            Yes &mdash; the full source lives at{" "}
            <a
              href="https://github.com/ces0491/wood-wiz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-700 hover:underline dark:text-amber-400"
            >
              <GithubMark className="size-3.5" /> github.com/ces0491/wood-wiz
            </a>
            . Bug reports, vendor suggestions, and scraper improvements welcome via the
            issue tracker.
          </p>
        ),
      },
    ],
  },
];

export default function FAQ() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          How Wood Wiz works
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          A plain-language guide to where the numbers on this site come from, what they
          mean, and what they don&apos;t.
        </p>
      </header>

      <div className="space-y-10">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.title}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Icon className="size-5 text-amber-700 dark:text-amber-500" aria-hidden />
                {section.title}
              </h2>
              <div className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
                {section.items.map((item) => (
                  <details key={item.q} className="group px-4 py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                      <span>{item.q}</span>
                      <ChevronDown
                        className="size-4 shrink-0 text-stone-500 transition group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <div className="mt-3 space-y-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
