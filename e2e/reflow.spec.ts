import { test, expect } from "@playwright/test";

/* LAYOUT REFLOW — WCAG 1.4.10.
 *
 * A page must not require horizontal scrolling. This is the one class of defect that neither
 * audit in qa/ can see: both read HTML, and horizontal overflow only exists once a page is
 * measured at a width by a real layout engine. Both reported a confident zero for weeks while
 * EVERY page on this site scrolled sideways at 360px — the header needed 436px and clipped the
 * hamburger button, which on a phone is the entire navigation.
 *
 * That was found by hand on 05-Aug-2026 and fixed. Nothing would have caught the next one.
 * This is that guard.
 *
 *   npx playwright install chromium     (once)
 *   npm run test:e2e
 *
 * 320px is the WCAG minimum. 360 and 390 are the sizes most Indian phones actually report.
 */

const WIDTHS = [
  { name: "320 (WCAG minimum)", width: 320 },
  { name: "360 (common Android)", width: 360 },
  { name: "390 (common iPhone)", width: 390 },
  { name: "768 (tablet)", width: 768 },
];

/* One page per kind of layout, in the widest language. Telugu is deliberate: it is the longest
   copy of the three, so it is the one that overflows first. Testing English would pass while
   Telugu visitors scrolled sideways. */
const PAGES = [
  { name: "home", path: "/te" },
  { name: "pooja catalog", path: "/te/poojas" },
  { name: "pooja detail", path: "/te/poojas/satyanarayan-katha" },
  { name: "festival page", path: "/te/festivals/diwali" },
  { name: "muhurat finder", path: "/te/muhurat/find" },
  { name: "store", path: "/te/store" },
  { name: "panchang", path: "/te/panchang" },
  { name: "login", path: "/te/login" },
];

for (const { name: pageName, path } of PAGES) {
  for (const { name: widthName, width } of WIDTHS) {
    test(`${pageName} does not scroll sideways at ${widthName}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path, { waitUntil: "domcontentloaded" });

      const result = await page.evaluate(() => {
        const d = document.documentElement;
        /* documentElement.clientWidth, NOT window.innerWidth. innerWidth INFLATES when the page
           overflows, so comparing scrollWidth against it hides the very bug being looked for. */
        const viewport = d.clientWidth;
        const content = d.scrollWidth;

        // Name the element that sticks out, so a failure says what to fix rather than just "436".
        const origins: string[] = [];
        for (const el of Array.from(document.querySelectorAll("body *"))) {
          const r = el.getBoundingClientRect();
          if (r.right <= viewport + 1) continue;
          const parent = el.parentElement;
          const parentRight = parent ? parent.getBoundingClientRect().right : viewport;
          // The ORIGIN of the overflow: this sticks out but its parent does not.
          if (parentRight <= viewport + 1) {
            origins.push(
              `${el.tagName.toLowerCase()}.${String(el.className || "").slice(0, 40)} → ${Math.round(r.right)}px`,
            );
          }
        }
        return { viewport, content, origins: origins.slice(0, 4) };
      });

      expect(
        result.content,
        `needs ${result.content}px in a ${result.viewport}px viewport.` +
          (result.origins.length ? ` Sticking out: ${result.origins.join("; ")}` : ""),
      ).toBeLessThanOrEqual(result.viewport);
    });
  }
}

/* The hamburger is the whole navigation on a phone. It was clipped off the right edge on every
   page and the site still "worked" by every other measure. */
test("the menu button is fully reachable at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/te/poojas", { waitUntil: "domcontentloaded" });

  const burger = page.locator('button[aria-controls="mobile-nav"]');
  await expect(burger).toBeVisible();

  const box = await burger.boundingBox();
  const viewport = await page.evaluate(() => document.documentElement.clientWidth);
  expect(box, "no hamburger button found").not.toBeNull();
  expect(
    Math.round(box!.x + box!.width),
    `the menu button ends at ${Math.round(box!.x + box!.width)}px in a ${viewport}px viewport`,
  ).toBeLessThanOrEqual(viewport);

  // And it must actually open, not merely be present.
  await burger.click();
  await expect(page.locator("#mobile-nav")).toBeVisible();
  await expect(burger).toHaveAttribute("aria-expanded", "true");
});

/* A control. If the measurement were broken — comparing a number against itself, say — every
   test above would pass no matter what the page did. This deliberately overflows a page and
   asserts the measurement notices. */
test("CONTROL: the measurement detects overflow that is really there", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/te/poojas", { waitUntil: "domcontentloaded" });

  const before = await page.evaluate(() => document.documentElement.scrollWidth);

  await page.evaluate(() => {
    const wide = document.createElement("div");
    wide.style.cssText = "width:3000px;height:10px";
    wide.id = "deliberate-overflow";
    document.body.appendChild(wide);
  });

  const after = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(before, "the page already overflowed before the control was planted").toBeLessThanOrEqual(
    360,
  );
  expect(after, "planted a 3000px element and the measurement did not move").toBeGreaterThan(before);
});
