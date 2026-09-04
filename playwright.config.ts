import { defineConfig, devices } from "@playwright/test";

/**
 * Visual regression against a frozen catalogue.
 *
 * The suite builds and serves the app with `tests/fixtures/products.json`
 * instead of the live data. Without that the scrape rewrites the catalogue
 * every morning and every screenshot baseline is stale by breakfast.
 *
 * The build is part of the server command because `/` and `/[region]` are
 * statically prerendered — the data file is read at build time, so pointing a
 * running server at a fixture would change nothing.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  outputDir: "test-results",

  expect: {
    toHaveScreenshot: {
      // Font hinting differs enough between machines to trip a zero tolerance
      // on text-heavy pages without anything actually having moved.
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },

  use: {
    baseURL: "http://127.0.0.1:3210",
    trace: "retain-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: {
    command: "npm run build && npm run start -- -p 3210",
    // Set here rather than inline in the command so the same config works on
    // Windows and on the Linux runner without a cross-env dependency.
    env: { WOOD_WIZ_DATA: "fixture" },
    url: "http://127.0.0.1:3210",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
