/**
 * Pure helpers for the "Add to Home Screen" flow.
 *
 * Deliberately free of browser globals so the eligibility rules can be
 * unit-tested and reasoned about without a DOM. Anything touching
 * `window` lives in `use-install-app.ts`.
 */

export type InstallPlatform = "ios" | "android" | "other";

export const INSTALL_PROMPT_DISMISSED_KEY = "wood-wiz:install-dismissed";

/** How long a dismissal suppresses the banner before it may reappear. */
export const INSTALL_PROMPT_SNOOZE_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

export function detectInstallPlatform(
  userAgent: string,
  maxTouchPoints = 0,
): InstallPlatform {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  // iPadOS 13+ reports a desktop Safari UA; touch points are the usual tell.
  if (/macintosh/.test(ua) && maxTouchPoints > 1) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

export function isMobileUserAgent(userAgent: string, maxTouchPoints = 0): boolean {
  if (detectInstallPlatform(userAgent, maxTouchPoints) !== "other") return true;
  return /mobile|silk|kindle|opera mini|windows phone/.test(userAgent.toLowerCase());
}

/**
 * Chromium fires `beforeinstallprompt` and can install programmatically;
 * Safari never does and has to be talked through the Share menu.
 */
export function needsManualInstallInstructions(
  platform: InstallPlatform,
  hasDeferredPrompt: boolean,
): boolean {
  return platform === "ios" || !hasDeferredPrompt;
}

export function parseDismissedAt(raw: string | null): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function isDismissalActive(
  dismissedAt: number | null,
  now: number,
  snoozeMs = INSTALL_PROMPT_SNOOZE_MS,
): boolean {
  if (dismissedAt === null) return false;
  // A device clock reset (or skew) shouldn't silently un-snooze a dismissal,
  // so a future-dated stamp still counts as active.
  return now - dismissedAt < snoozeMs;
}

export type AutoPromptInput = {
  isMobile: boolean;
  isStandalone: boolean;
  platform: InstallPlatform;
  dismissedAt: number | null;
  hasDeferredPrompt: boolean;
  now: number;
};

/**
 * The install banner only appears on a mobile browser that can actually
 * install. Already-installed sessions, desktop, and browsers with no install
 * path (e.g. Android Firefox, which never fires `beforeinstallprompt`) are
 * skipped rather than shown steps they can't follow.
 */
export function shouldAutoPromptInstall(input: AutoPromptInput): boolean {
  if (!input.isMobile) return false;
  if (input.isStandalone) return false;
  if (isDismissalActive(input.dismissedAt, input.now)) return false;
  // iOS can always be walked through the Share menu manually.
  if (input.platform === "ios") return true;
  return input.hasDeferredPrompt;
}
