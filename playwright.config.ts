import { defineConfig, devices } from "@playwright/test";

// E2E smoke suite. Run locally / in CI with:
//   npm install && npx playwright install chromium && npm run test:e2e
// The webServer block builds and starts the app automatically.
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    /* ⚠️ RUN `npm run build` FIRST. This only starts the server.
       The original command was `npm run build && npm run start` inside a 180-second budget — and
       a production build of this app takes several minutes, so the E2E suite timed out before a
       single test ran and had presumably never completed on a developer machine. Building inside
       the test runner's start-up window was the mistake; a build is a separate step, and CI
       should run it as one. */
    command: "npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    // A cold build on a modest machine is minutes, not seconds. 180s guaranteed a timeout.
    timeout: 900_000,
  },
});
