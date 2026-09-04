"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_REGION, type RegionId, isRegionId } from "./regions";

/**
 * The metro a reader last looked at.
 *
 * Wood Wiz is a thing people check repeatedly \u2014 it is why the site is
 * installable at all \u2014 and the manifest's `start_url` is `/`. Without a
 * memory, every launch of the installed app landed on "Where are you buying
 * wood?" and cost a tap before showing a single price. Remembering the choice
 * makes `/` a redirect for a returning reader and a picker for a new one.
 *
 * Per-viewer convenience, so `localStorage` is the right home: it never has to
 * reach another device, and every read is wrapped because a private window or
 * blocked site data throws on access rather than returning empty.
 */
export const LAST_REGION_KEY = "wood-wiz:last-region";

const listeners = new Set<() => void>();
let cache: RegionId | null | undefined;

function read(): RegionId | null {
  try {
    const raw = localStorage.getItem(LAST_REGION_KEY);
    return raw && isRegionId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function rememberRegion(region: RegionId): void {
  try {
    localStorage.setItem(LAST_REGION_KEY, region);
  } catch {
    // Private mode or blocked storage: the picker simply keeps asking.
  }
  cache = region;
  for (const l of listeners) l();
}

/** Cached so the snapshot is reference-stable; localStorage is not free. */
function getSnapshot(): RegionId | null {
  if (cache === undefined) cache = read();
  return cache;
}

function getServerSnapshot(): RegionId | null {
  return null;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab switching metro should not leave this one disagreeing.
  const onStorage = (e: StorageEvent) => {
    if (e.key === LAST_REGION_KEY) {
      cache = undefined;
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The remembered metro, or null before hydration and for a first-time reader.
 *
 * Null on the server and on the first client render, so prerendered markup and
 * the hydrated tree agree; the real value arrives in the render after.
 */
export function useLastRegion(): RegionId | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Where the nav should point when the URL itself names no metro. */
export function navRegion(remembered: RegionId | null): RegionId {
  return remembered ?? DEFAULT_REGION;
}
