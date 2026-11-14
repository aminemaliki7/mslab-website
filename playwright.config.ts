import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests (Chromium) at desktop, tablet and phone sizes.
 *   npm run build && npm run test:e2e
 * Starts `next start` on port 3100 (separate from a dev server on 3000) against the DEV
 * Supabase project from .env.local. Submission tests write rows with @example.com emails —
 * remove them with supabase/seed/remove_test_submissions.sql.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `npx next start -p ${PORT}`,
        url: `${baseURL}/fr`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
