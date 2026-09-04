import { expect, test, type Page } from "@playwright/test";

/**
 * The check that earns its keep is the layout invariant, not the pixel diff.
 *
 * Adding the city switcher pushed the mobile nav to 456px inside a 375px
 * viewport, so every city page scrolled sideways on a phone. Nothing in the
 * markup said so — the HTML was valid and every class was plausible. Only a
 * real layout engine at a real width shows it.
 *
 * So each route is asserted at three widths in both themes for horizontal
 * overflow, and the screenshots are a second line of defence for the things an
 * assertion can't name.
 */

const ROUTES = [
  { name: "picker", path: "/" },
  { name: "cape-town", path: "/cape-town" },
  { name: "johannesburg", path: "/johannesburg" },
  { name: "cape-town-vendors", path: "/cape-town/vendors" },
  { name: "johannesburg-vendors", path: "/johannesburg/vendors" },
  { name: "faq", path: "/faq" },
] as const;

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const SCHEMES = ["light", "dark"] as const;

/** `/` redirects a reader who has already chosen, which would skip the picker. */
async function visitFresh(page: Page, path: string) {
  await page.goto(path);
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {
      /* storage blocked; nothing to clear */
    }
  });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

for (const scheme of SCHEMES) {
  for (const vp of VIEWPORTS) {
    test.describe(`${vp.name} ${scheme}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height }, colorScheme: scheme });

      for (const route of ROUTES) {
        test(`${route.name} has no horizontal overflow`, async ({ page }) => {
          await visitFresh(page, route.path);

          const doc = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }));
          expect(
            doc.scrollWidth,
            `${route.path} scrolls sideways at ${vp.width}px`,
          ).toBeLessThanOrEqual(doc.clientWidth + 1);
        });

        test(`${route.name} keeps its content inside its containers`, async ({ page }) => {
          await visitFresh(page, route.path);

          // An element wider than the box it sits in, with nothing set to
          // scroll or clip it, is content spilling out of a card or column.
          const spills = await page.evaluate(() => {
            const out: string[] = [];
            for (const el of Array.from(document.querySelectorAll("body *"))) {
              if (el.clientWidth === 0) continue;
              if (el.scrollWidth <= el.clientWidth + 2) continue;
              const style = getComputedStyle(el);
              if (style.overflowX !== "visible") continue;
              if (style.display === "inline") continue;
              out.push(
                `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 60)}"> ` +
                  `${el.scrollWidth}px in ${el.clientWidth}px`,
              );
            }
            return out;
          });
          expect(spills, `${route.path} at ${vp.width}px`).toEqual([]);
        });
      }
    });
  }
}

test.describe("appearance", () => {
  for (const scheme of SCHEMES) {
    for (const vp of VIEWPORTS) {
      for (const route of ROUTES) {
        test(`@pixel ${route.name} ${vp.name} ${scheme}`, async ({ page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.emulateMedia({ colorScheme: scheme });
          await visitFresh(page, route.path);

          await expect(page).toHaveScreenshot(
            `${route.name}-${vp.name}-${scheme}.png`,
            {
              fullPage: true,
              // "Data refreshed X ago" is computed from the reader's clock
              // after hydration, so it moves on its own every day even with a
              // frozen catalogue.
              mask: [page.locator("time")],
            },
          );
        });
      }
    }
  }
});
