"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  INSTALL_PROMPT_DISMISSED_KEY,
  type InstallPlatform,
  detectInstallPlatform,
  isMobileUserAgent,
  parseDismissedAt,
  shouldAutoPromptInstall,
} from "@/lib/install-app";

/**
 * Chromium-only, not in lib.dom yet. Fired when the browser considers the app
 * installable; calling `preventDefault` suppresses the mini-infobar and lets
 * us drive the prompt from our own UI instead.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * `beforeinstallprompt` can fire before React mounts. Capturing it at module
 * scope means a late-mounting component still sees it; without this the event
 * is simply lost and the native install path silently degrades to instructions.
 */
let capturedPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    capturedPrompt = event as BeforeInstallPromptEvent;
  });
}

/** How long to wait for a late `beforeinstallprompt` before deciding. */
const AUTO_PROMPT_DELAY_MS = 2500;

// -- UA snapshot -------------------------------------------------------------
// Read once and cached: the value can never change for the lifetime of the
// document, and a stable object identity keeps useSyncExternalStore from
// looping (it compares snapshots by reference).

type UaSnapshot = { platform: InstallPlatform; isMobile: boolean };

const SERVER_UA: UaSnapshot = { platform: "other", isMobile: false };
let uaSnapshot: UaSnapshot | null = null;

function getUaSnapshot(): UaSnapshot {
  if (uaSnapshot) return uaSnapshot;
  const ua = navigator.userAgent;
  const touch = navigator.maxTouchPoints ?? 0;
  uaSnapshot = {
    platform: detectInstallPlatform(ua, touch),
    isMobile: isMobileUserAgent(ua, touch),
  };
  return uaSnapshot;
}

/** The UA never changes, so this store never notifies. */
function subscribeNever(): () => void {
  return () => {};
}

// -- standalone (installed) detection ----------------------------------------

function isStandaloneNow(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari predates display-mode and only exposes this legacy flag.
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function subscribeStandalone(onChange: () => void): () => void {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", onChange);
  window.addEventListener("appinstalled", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

export type UseInstallApp = {
  platform: InstallPlatform;
  isMobile: boolean;
  isStandalone: boolean;
  /** True when there is any install path available on this device. */
  canInstall: boolean;
  /** True when we must show manual steps because no native prompt exists. */
  needsInstructions: boolean;
  /** Triggers the native prompt. Returns false when unavailable or declined. */
  promptInstall: () => Promise<boolean>;
  /** Snoozes the banner for {@link INSTALL_PROMPT_SNOOZE_MS}. */
  dismiss: () => void;
};

export function useInstallApp(options?: { onAutoPrompt?: () => void }): UseInstallApp {
  const { platform, isMobile } = useSyncExternalStore(
    subscribeNever,
    getUaSnapshot,
    () => SERVER_UA,
  );
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    isStandaloneNow,
    () => false,
  );

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => capturedPrompt,
  );

  // Keep the callback in a ref so a caller passing an inline arrow doesn't
  // restart the auto-prompt timer on every render.
  const onAutoPrompt = options?.onAutoPrompt;
  const onAutoPromptRef = useRef(onAutoPrompt);
  useEffect(() => {
    onAutoPromptRef.current = onAutoPrompt;
  }, [onAutoPrompt]);

  // Pick up an event that fires after mount.
  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      capturedPrompt = event as BeforeInstallPromptEvent;
      setDeferredPrompt(capturedPrompt);
    };
    const onInstalled = () => {
      capturedPrompt = null;
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, String(Date.now()));
    } catch {
      // Private mode / storage disabled. The banner simply reappears next visit.
    }
  }, []);

  const promptInstall = useCallback(async () => {
    const event = deferredPrompt ?? capturedPrompt;
    if (!event) return false;
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      // The event is single-use; a second prompt() call throws.
      capturedPrompt = null;
      setDeferredPrompt(null);
      return outcome === "accepted";
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  // Automatic first-visit reveal, delayed so we don't race a late
  // beforeinstallprompt to a "no native prompt available" decision.
  useEffect(() => {
    if (isStandalone || !isMobile) return;
    const timer = window.setTimeout(() => {
      let dismissedAt: number | null = null;
      try {
        dismissedAt = parseDismissedAt(localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY));
      } catch {
        // Unreadable storage: treat as never dismissed.
      }
      const eligible = shouldAutoPromptInstall({
        isMobile,
        isStandalone,
        platform,
        dismissedAt,
        hasDeferredPrompt: (deferredPrompt ?? capturedPrompt) !== null,
        now: Date.now(),
      });
      if (eligible) onAutoPromptRef.current?.();
    }, AUTO_PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isMobile, isStandalone, platform, deferredPrompt]);

  const hasDeferredPrompt = (deferredPrompt ?? capturedPrompt) !== null;

  return {
    platform,
    isMobile,
    isStandalone,
    canInstall: !isStandalone && (hasDeferredPrompt || platform === "ios"),
    needsInstructions: !hasDeferredPrompt,
    promptInstall,
    dismiss,
  };
}
