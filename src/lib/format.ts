const NBSP = "\u00A0";

export function formatZar(n: number, maxFractionDigits?: number): string {
  const negative = n < 0;
  const abs = Math.abs(n);
  const decimals = maxFractionDigits !== undefined ? maxFractionDigits : abs < 10 ? 2 : 0;
  const fixed = abs.toFixed(decimals);
  const [whole, frac] = fixed.split(".");
  const wholeWithThousands = whole.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const decimal = frac ? `.${frac}` : "";
  return `${negative ? "-" : ""}R${NBSP}${wholeWithThousands}${decimal}`;
}

export function formatKg(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}${NBSP}t`;
  if (n >= 100) return `${Math.round(n)}${NBSP}kg`;
  return `${n.toFixed(n < 10 ? 2 : 1)}${NBSP}kg`;
}

export function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return "less than an hour ago";
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Fixed +02:00 offset rather than a locale/timezone lookup. Two reasons: the
// audience is Cape Town only, and the value has to render identically on the
// server (UTC on Vercel) and in the browser or hydration mismatches. South
// Africa has never observed DST, so the offset is a constant, not a guess.
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

/** "10 Aug 2026, 06:19 SAST" — deterministic, no Intl, no local clock. */
export function formatSast(iso: string): string {
  const d = new Date(new Date(iso).getTime() + SAST_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} SAST`
  );
}
