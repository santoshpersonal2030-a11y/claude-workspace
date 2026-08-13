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

/* The full device ladder, 13-Aug-2026. It previously stopped at 768, so TABLET LANDSCAPE and
   EVERY DESKTOP WIDTH were untested — and "it works on my screen" is not a size anyone else has.
   A fixed-width element only reveals itself at the width it is wider than, which is why the
   ladder has no gaps between the smallest phone and a maximised desktop. */
const WIDTHS = [
  { name: "320 (WCAG minimum)", width: 320 },
  { name: "360 (common Android)", width: 360 },
  { name: "390 (common iPhone)", width: 390 },
  { name: "768 (tablet portrait)", width: 768 },
  { name: "820 (iPad Air portrait)", width: 820 },
  { name: "1024 (iPad landscape)", width: 1024 },
  { name: "1280 (small laptop)", width: 1280 },
  { name: "1440 (common laptop)", width: 1440 },
  { name: "1920 (maximised desktop)", width: 1920 },
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
  // Added 12-Aug-2026 with the page itself. Its h1 concatenates a Telugu pooja name and a city
  // — the longest single line on the site — and a Telugu pooja name has no space in it, so the
  // word alone can set the minimum width. That is exactly the shape of the 23px overflow found
  // on the pooja detail page, which needed BOTH min-w-0 and break-words to fix.
  { name: "city x pooja", path: "/te/poojas/satyanarayan-katha/in/varanasi" },
  { name: "contact", path: "/te/contact" },
  { name: "become a pandit", path: "/te/become-a-pandit" },
  /* Added 13-Aug-2026. The store LIST was covered but the product PAGE was not, and it is where
     the catalogue funnels — price, GST, stock state and the add-to-cart control all sit on it.
     This is also the longest product name in the catalogue, so it is the one that overflows
     first. The cart is next to it because a layout that breaks at checkout costs an order, not
     a scroll. */
  { name: "product detail", path: "/te/store/akhand-jyoti-wicks" },
  { name: "cart", path: "/te/cart" },
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

  /* And it must actually open, not merely be present.
     The click is RETRIED rather than fired once. `domcontentloaded` means the markup has
     arrived, not that React has hydrated and attached the onClick — so on a loaded machine the
     first click can land on a button that is not listening yet and simply do nothing. That made
     this test fail in a full 46-test run on 12-Aug-2026 and pass every time in isolation, which
     is the signature of a flake, not of a broken page. Raising the timeout would have hidden it;
     retrying the click is what actually models "a person taps until the menu opens". */
  await expect(async () => {
    await burger.click();
    await expect(page.locator("#mobile-nav")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
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

/* ───────────────────────────────────────────────────────────────────────────────────────────
   A CART WITH THINGS IN IT — added 13-Aug-2026.

   Until now the cart was only ever measured EMPTY, which renders "your cart is empty" and a
   link. That is not the cart: the real one has product names, quantity steppers, four-digit
   prices, a totals block and a login prompt, and it is the last page between a customer and
   their money. An empty cart passing at 320px said nothing about any of that.

   The basket below is the worst case the real catalogue can produce — the longest product name,
   the highest price (four digits, so the widest number), and a quantity of 12 so the line total
   is the widest it gets. Seeded straight into localStorage because the cart is client-side
   (`bmp_cart_v1`), which is faster and far less brittle than clicking through the store.
   ─────────────────────────────────────────────────────────────────────────────────────────── */
const WORST_CASE_BASKET = [
  { slug: "brass-pooja-thali", name: "Brass Pooja Thali Set", price: 1299, imageUrl: null, quantity: 12 },
  { slug: "akhand-jyoti-wicks", name: "Akhand Jyoti Cotton Wicks (Batti)", price: 129, imageUrl: null, quantity: 3 },
  { slug: "roli-chawal-kalava-set", name: "Roli, Chawal & Kalava Set", price: 99, imageUrl: null, quantity: 1 },
];

for (const { name: widthName, width } of WIDTHS) {
  test(`cart WITH ITEMS does not scroll sideways at ${widthName}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript((basket) => {
      localStorage.setItem("bmp_cart_v1", JSON.stringify(basket));
    }, WORST_CASE_BASKET);
    await page.goto("/te/cart", { waitUntil: "domcontentloaded" });

    // The cart hydrates from localStorage on the client, so wait for a real line to exist.
    // Without this the test would measure the empty cart again and pass for the wrong reason.
    /* 45s, not 15s. The cart hydrates from localStorage on the CLIENT, and in a full
       258-test parallel run WebKit has been measured taking longer than 15s to get there —
       the same test passes alone in 5s. That is machine load, not a page defect, and the
       failure it produced ("toBeVisible failed") looked exactly like a broken cart. */
    await expect(page.getByText("Brass Pooja Thali Set").first()).toBeVisible({ timeout: 45000 });

    const result = await page.evaluate(() => {
      const d = document.documentElement;
      const viewport = d.clientWidth;
      const origins: string[] = [];
      for (const el of Array.from(document.querySelectorAll("body *"))) {
        const r = el.getBoundingClientRect();
        if (r.right <= viewport + 1) continue;
        const parent = el.parentElement;
        const parentRight = parent ? parent.getBoundingClientRect().right : viewport;
        if (parentRight <= viewport + 1) {
          origins.push(
            `${el.tagName.toLowerCase()}.${String(el.className || "").slice(0, 40)} → ${Math.round(r.right)}px`,
          );
        }
      }
      return { viewport, content: d.scrollWidth, origins: origins.slice(0, 4) };
    });

    expect(
      result.content,
      `needs ${result.content}px in a ${result.viewport}px viewport. Sticking out: ${
        result.origins.join("; ") || "(no single origin found)"
      }`,
    ).toBeLessThanOrEqual(result.viewport + 1);
  });
}

/* CONTROL for the basket itself. If the seed silently failed — wrong key, wrong shape, cleared
   on navigation — every test above would measure an EMPTY cart and pass while proving nothing.
   This asserts the cart really is populated and that the money on screen is the money expected. */
test("CONTROL: the seeded basket really reaches the cart, with the right total", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript((basket) => {
    localStorage.setItem("bmp_cart_v1", JSON.stringify(basket));
  }, WORST_CASE_BASKET);
  await page.goto("/te/cart", { waitUntil: "domcontentloaded" });

  /* 45s, not 15s. The cart hydrates from localStorage on the CLIENT, and in a full
       258-test parallel run WebKit has been measured taking longer than 15s to get there —
       the same test passes alone in 5s. That is machine load, not a page defect, and the
       failure it produced ("toBeVisible failed") looked exactly like a broken cart. */
    await expect(page.getByText("Brass Pooja Thali Set").first()).toBeVisible({ timeout: 45000 });

  // 1299×12 + 129×3 + 99×1 = 16074. If the page does not show it, the cart is not really loaded.
  const body = (await page.locator("body").innerText()).replace(/[\s,]/g, "");
  expect(body, "the cart did not show the expected subtotal of 16074").toContain("16074");

  // And the empty state must NOT be on screen — proof we are not measuring the empty cart.
  const stillEmpty = await page.getByText(/cart is empty/i).count();
  expect(stillEmpty, "the cart still rendered its empty state").toBe(0);
});
