import { describe, expect, test } from "vitest";
import {
  INSTALL_PROMPT_SNOOZE_MS,
  detectInstallPlatform,
  isDismissalActive,
  isMobileUserAgent,
  needsManualInstallInstructions,
  parseDismissedAt,
  shouldAutoPromptInstall,
  type AutoPromptInput,
} from "./install-app";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
const DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const IPAD_DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

describe("detectInstallPlatform", () => {
  test("iPhone → ios", () => {
    expect(detectInstallPlatform(IPHONE)).toBe("ios");
  });
  test("Android → android", () => {
    expect(detectInstallPlatform(ANDROID)).toBe("android");
  });
  test("desktop → other", () => {
    expect(detectInstallPlatform(DESKTOP)).toBe("other");
  });
  test("iPadOS reports a desktop Safari UA; touch points give it away", () => {
    // Without touch points it looks like a Mac.
    expect(detectInstallPlatform(IPAD_DESKTOP_UA, 0)).toBe("other");
    expect(detectInstallPlatform(IPAD_DESKTOP_UA, 5)).toBe("ios");
  });
});

describe("isMobileUserAgent", () => {
  test("iPhone and Android are mobile", () => {
    expect(isMobileUserAgent(IPHONE)).toBe(true);
    expect(isMobileUserAgent(ANDROID)).toBe(true);
  });
  test("desktop is not mobile", () => {
    expect(isMobileUserAgent(DESKTOP)).toBe(false);
  });
  test("iPad-as-desktop with touch points is mobile", () => {
    expect(isMobileUserAgent(IPAD_DESKTOP_UA, 5)).toBe(true);
  });
});

describe("needsManualInstructions", () => {
  test("iOS always needs manual steps (no beforeinstallprompt)", () => {
    expect(needsManualInstallInstructions("ios", true)).toBe(true);
    expect(needsManualInstallInstructions("ios", false)).toBe(true);
  });
  test("Android needs steps only without a deferred prompt", () => {
    expect(needsManualInstallInstructions("android", true)).toBe(false);
    expect(needsManualInstallInstructions("android", false)).toBe(true);
  });
});

describe("parseDismissedAt", () => {
  test("parses a positive timestamp", () => {
    expect(parseDismissedAt("1700000000000")).toBe(1700000000000);
  });
  test("returns null for absent, non-numeric, or non-positive values", () => {
    expect(parseDismissedAt(null)).toBeNull();
    expect(parseDismissedAt("")).toBeNull();
    expect(parseDismissedAt("nope")).toBeNull();
    expect(parseDismissedAt("0")).toBeNull();
    expect(parseDismissedAt("-5")).toBeNull();
  });
});

describe("isDismissalActive", () => {
  const now = 1_000_000_000_000;
  test("no dismissal → inactive", () => {
    expect(isDismissalActive(null, now)).toBe(false);
  });
  test("within the snooze window → active", () => {
    expect(isDismissalActive(now - 1000, now)).toBe(true);
  });
  test("past the snooze window → inactive", () => {
    expect(isDismissalActive(now - INSTALL_PROMPT_SNOOZE_MS - 1, now)).toBe(false);
  });
  test("a future-dated stamp (clock skew) still counts as active", () => {
    expect(isDismissalActive(now + 5000, now)).toBe(true);
  });
});

describe("shouldAutoPromptInstall", () => {
  const base: AutoPromptInput = {
    isMobile: true,
    isStandalone: false,
    platform: "android",
    dismissedAt: null,
    hasDeferredPrompt: true,
    now: 1_000_000_000_000,
  };

  test("eligible Android with a deferred prompt", () => {
    expect(shouldAutoPromptInstall(base)).toBe(true);
  });
  test("iOS is eligible even without a deferred prompt (manual steps)", () => {
    expect(
      shouldAutoPromptInstall({ ...base, platform: "ios", hasDeferredPrompt: false }),
    ).toBe(true);
  });
  test("Android without a deferred prompt is skipped (e.g. Firefox)", () => {
    expect(shouldAutoPromptInstall({ ...base, hasDeferredPrompt: false })).toBe(false);
  });
  test("desktop is skipped", () => {
    expect(shouldAutoPromptInstall({ ...base, isMobile: false })).toBe(false);
  });
  test("already-installed sessions are skipped", () => {
    expect(shouldAutoPromptInstall({ ...base, isStandalone: true })).toBe(false);
  });
  test("an active dismissal is skipped", () => {
    expect(shouldAutoPromptInstall({ ...base, dismissedAt: base.now - 1000 })).toBe(false);
  });
  test("an expired dismissal is eligible again", () => {
    expect(
      shouldAutoPromptInstall({ ...base, dismissedAt: base.now - INSTALL_PROMPT_SNOOZE_MS - 1 }),
    ).toBe(true);
  });
});
