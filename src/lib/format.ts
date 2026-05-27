const NBSP = " ";

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
