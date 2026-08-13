import { test, expect } from "@playwright/test";

/* THE CHECKOUT FORM — the one page on the money path that no test had ever reached.
 *
 * Everything in reflow.spec.ts runs SIGNED OUT, and signed out the cart shows "please sign in"
 * instead of the checkout form. So the delivery fields, the state dropdown, the coupon row, the
 * wallet-credit control and the pay button had never been measured at any width, on the page
 * where an order is actually placed.
 *
 * ⚠️ THIS DELIBERATELY STOPS SHORT OF PAYING. It fills the form and asserts the layout and the
 * arithmetic, and never clicks pay — that would create a real Razorpay order, a real order row
 * and decrement real stock. Testing a checkout must not become placing one.
 *
 * A throwaway probe user signs in through the REAL login form. Injecting a token into
 * localStorage was tried first and silently failed — supabase-js wraps the stored session in its
 * own envelope, so a hand-written value is ignored and the visitor simply stays signed out.
 *
 * TO RUN THESE, create a probe user in the Supabase dashboard (Authentication → Users → Add
 * user, tick "Auto Confirm") and export its credentials:
 *
 *   QA_PROBE_EMAIL=qa-checkout-probe@bookmypoojari.test
 *   QA_PROBE_PASSWORD=<whatever you set>
 *
 * Use a throwaway address on a domain that cannot receive mail (`.test`), and DELETE the user
 * afterwards — the probe signs in as that account, so anything it does is attributed to it.
 * ⚠️ Credentials are read from the environment on purpose. Never hardcode them here: this file
 * is committed, and a password in a repo is a password in everyone's clone forever.
 *
 * With the variables unset these tests SKIP, and say why — they never pass silently.
 */

const PROBE_EMAIL = process.env.QA_PROBE_EMAIL;
const PROBE_PASSWORD = process.env.QA_PROBE_PASSWORD;
const haveProbe = Boolean(PROBE_EMAIL && PROBE_PASSWORD);

const BASKET = [
  { slug: "brass-pooja-thali", name: "Brass Pooja Thali Set", price: 1299, imageUrl: null, quantity: 12 },
  { slug: "akhand-jyoti-wicks", name: "Akhand Jyoti Cotton Wicks (Batti)", price: 129, imageUrl: null, quantity: 3 },
  { slug: "roli-chawal-kalava-set", name: "Roli, Chawal & Kalava Set", price: 99, imageUrl: null, quantity: 1 },
];

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

/* Sign in through the REAL login form rather than injecting a token.
 *
 * Injecting into localStorage was tried first and every test failed, including the control —
 * supabase-js wraps the stored session in its own envelope, so a hand-written value is simply
 * ignored and the visitor stays signed out. Driving the form is slower but it cannot silently
 * be wrong, and it exercises the login path a customer actually uses.
 *
 * The form opens in PHONE + OTP mode; the email fields are behind an "Email" toggle. */
async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/en/login", { waitUntil: "load" });

  /* WAIT FOR HYDRATION BEFORE TOUCHING ANYTHING.
     Isolated on 13-Aug-2026: the ONLY variable that decided whether sign-in worked was a pause
     here. With it, 2 of 2 runs signed in; without it, 0 of 2 — seeding the cart, retrying the
     toggle and retrying the submit all made no difference. Before React attaches, the form is
     fully present and fully inert: it accepts typing, then wipes it on the first render, and the
     submit button does nothing at all WITHOUT SHOWING AN ERROR. The page just sits on /login,
     which is indistinguishable from a rejected password. A blunt wait is the honest fix. */
  await page.waitForTimeout(2500);

  /* RETRY the toggle rather than clicking once. `domcontentloaded` means the markup arrived, not
     that React has attached the handler — so the first click can land on a button that is not
     listening yet and do nothing at all. The email input still resolves (it is in the DOM) but
     sits inside the hidden Phone panel, so `fill` times out against an element that is present
     and not actionable. That is the same flake already documented on the hamburger test, and it
     is why this asserts the field is EDITABLE rather than merely present. */
  const email = page.locator("#login-email");
  await expect(async () => {
    await page.getByRole("button", { name: "Email", exact: true }).click();
    await expect(email).toBeEditable({ timeout: 1500 });
  }).toPass({ timeout: 30000 });

  const password = page.locator('input[type="password"]').first();

  /* FILL, THEN PROVE IT STUCK.
     These are CONTROLLED inputs. Typed before React finishes hydrating, the values are wiped by
     the first render — the fields go back to "" and an EMPTY form is submitted. The page then
     sits on /login showing no error at all, which is indistinguishable from a wrong password,
     and sent this chasing credentials that were provably valid. Isolating it showed the only
     variable that mattered was time: with a pause before typing it worked every time, without
     it, never. Retrying the SUBMIT could not fix it because the damage was already done.
     So: retype until the values survive a moment, and only then submit. */
  await expect(async () => {
    await email.fill(PROBE_EMAIL!);
    await password.fill(PROBE_PASSWORD!);
    await page.waitForTimeout(400);
    await expect(email).toHaveValue(PROBE_EMAIL!, { timeout: 1000 });
    await expect(password).toHaveValue(PROBE_PASSWORD!, { timeout: 1000 });
  }).toPass({ timeout: 30000 });

  await page.locator("form button[type=submit]").first().click();
  // A successful sign-in leaves /login; a rejected one stays, with a visible error.
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
}

async function signedInCart(page: import("@playwright/test").Page, width: number) {
  await page.setViewportSize({ width, height: 1000 });
  await page.addInitScript((basket) => {
    localStorage.setItem("bmp_cart_v1", JSON.stringify(basket));
  }, BASKET);
  await signIn(page);
  await page.goto("/te/cart", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Brass Pooja Thali Set").first()).toBeVisible({ timeout: 45000 });
}

test.describe("checkout (signed in)", () => {
  /* Every test here signs in through the real form first, and the retry budgets that make that
     reliable are larger than Playwright's 30s default on their own. 2 minutes is generous rather
     than optimistic: a timeout here would look like a broken checkout, which is exactly the
     confusion this file has already produced once. */
  test.describe.configure({ timeout: 120_000 });
  test.skip(
    !haveProbe,
    "QA_PROBE_EMAIL / QA_PROBE_PASSWORD are not set — see the header of this file. Skipped, not passed.",
  );

  for (const { name: widthName, width } of WIDTHS) {
    test(`checkout form does not scroll sideways at ${widthName}`, async ({ page }) => {
      await signedInCart(page, width);

      // The delivery form only exists for a signed-in visitor. If it is absent we are measuring
      // the signed-OUT cart again and the test would pass for entirely the wrong reason.
      await expect(page.locator("select")).toHaveCount(1, { timeout: 20000 });

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
          result.origins.join("; ") || "(no single origin)"
        }`,
      ).toBeLessThanOrEqual(result.viewport + 1);
    });
  }

  test("CONTROL: the visitor really is signed in and the form really rendered", async ({ page }) => {
    await signedInCart(page, 390);
    // Signed out this page shows a sign-in prompt and NO state dropdown. Both assertions have to
    // hold, or every test above was measuring the wrong page.
    await expect(page.locator("select")).toHaveCount(1, { timeout: 20000 });
    const body = await page.locator("body").innerText();
    expect(body.replace(/[\s,]/g, ""), "subtotal 16074 not on the page").toContain("16074");
  });

  test("the pay button exists, is reachable, and is NOT clicked", async ({ page }) => {
    await signedInCart(page, 360);
    /* The Telugu label is "₹16,074 చెల్లించండి" — matched on the STEM, not a guessed verb
       ending, which is what an earlier regex got wrong. */
    const pay = page.locator("button").filter({ hasText: /చెల్లించ|Pay now|Pay ₹/ }).last();
    await expect(pay).toBeVisible({ timeout: 20000 });
    const box = await pay.boundingBox();
    const vw = await page.evaluate(() => document.documentElement.clientWidth);
    expect(box, "no pay button found").not.toBeNull();
    expect(
      Math.round(box!.x + box!.width),
      `the pay button ends at ${Math.round(box!.x + box!.width)}px in a ${vw}px viewport`,
    ).toBeLessThanOrEqual(vw);
    // Deliberately never clicked — see the header of this file.
  });
});
