"use client";

import { useSyncExternalStore } from "react";
import { formatRelative, formatSast } from "@/lib/format";

/**
 * Renders when the data was last refreshed.
 *
 * `/` and `/vendors` are statically prerendered, so anything derived from
 * `Date.now()` at render time is frozen at build and served for as long as
 * that deploy lives — a build-time "less than an hour ago" was still claiming
 * that a day later. Worse on `/`, where the browser recomputed it during
 * hydration and disagreed with the HTML.
 *
 * So the prerendered markup carries the absolute stamp, which stays true
 * however old the deploy is, and the friendlier relative form is a post-mount
 * upgrade — it needs the reader's clock, which the build doesn't have. The
 * absolute stamp stays on as the title either way.
 */

/** Nothing to subscribe to: this flips once, when hydration hands over. */
const subscribeNever = () => () => {};
const onClient = () => true;
const onServer = () => false;

export default function RefreshedAt({ iso }: { iso: string }) {
  const hydrated = useSyncExternalStore(subscribeNever, onClient, onServer);
  const absolute = formatSast(iso);

  return (
    <time dateTime={iso} title={absolute}>
      {hydrated ? formatRelative(iso) : absolute}
    </time>
  );
}
