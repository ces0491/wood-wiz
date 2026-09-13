import type { ProductsFile, Vendor } from "@/lib/types";
import { formatSast } from "@/lib/format";

/**
 * Which of this city's vendors failed to refresh, and what that means for the
 * prices on the page.
 *
 * Takes the city's vendors, not the run status alone: the status covers every
 * vendor on the site, and a Cape Town-only vendor failing is no concern of the
 * Johannesburg page (which used to name it by its raw id).
 */
export default function VendorFailureNotice({
  vendors,
  vendorRunStatus,
}: {
  vendors: Vendor[];
  vendorRunStatus: ProductsFile["vendorRunStatus"];
}) {
  const failed = vendors.filter((v) => vendorRunStatus[v.id]?.ok === false);
  if (failed.length === 0) return null;

  return (
    <ul className="mt-2 space-y-0.5 text-xs text-amber-700 dark:text-amber-300">
      {failed.map((v) => {
        const s = vendorRunStatus[v.id];
        return (
          <li key={v.id}>
            <span aria-hidden>⚠ </span>
            {v.name} couldn&apos;t be refreshed.{" "}
            {s.count > 0 && s.lastOkAt
              ? `Showing their prices from ${formatSast(s.lastOkAt)}.`
              : "Their products are left out until it recovers."}
          </li>
        );
      })}
    </ul>
  );
}
