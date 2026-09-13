/**
 * How long a failed vendor's last good prices stay published.
 *
 * A day or two of a blocked scraper shouldn't empty a city page, but prices a
 * week old are stale enough that showing them does more harm than leaving the
 * vendor out. Read by scripts/carry-forward.ts, which applies it, and by the
 * FAQ, which states it.
 */
export const MAX_STALE_DAYS = 7;
