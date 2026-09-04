"use client";

import { useEffect } from "react";
import type { RegionId } from "@/lib/regions";
import { rememberRegion } from "@/lib/last-region";

/** Records the metro being viewed, so `/` can skip the picker next time. */
export default function RememberRegion({ region }: { region: RegionId }) {
  useEffect(() => {
    rememberRegion(region);
  }, [region]);
  return null;
}
