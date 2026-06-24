import { test, expect } from "@playwright/test";

// Critical-path smoke tests — they exercise public routes without needing a
// logged-in session or external services (Razorpay/Supabase writes).

test("home page renders the brand and primary nav", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/BookMyPoojari/i);
  await expect(
    page.getByRole("link", { name: /pandits/i }).first(),
  ).toBeVisible();
});

test("store lists products and a product page opens", async ({ page }) => {
  await page.goto("/store");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("pooja catalog is reachable", async ({ page }) => {
  await page.goto("/poojas");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("become-a-pandit application form is present", async ({ page }) => {
  await page.goto("/become-a-pandit");
  await expect(page.getByRole("button", { name: /submit application/i })).toBeVisible();
  // KYC fields are required.
  await expect(page.locator('select[name="id_type"]')).toBeVisible();
});

test("login page offers OTP entry", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("cart page loads (empty state)", async ({ page }) => {
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: /your cart/i })).toBeVisible();
});
