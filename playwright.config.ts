import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against demo mode (PGlite + demo sign-in + demo payment gateway).
 * Set CHROME_PATH to use a system Chromium instead of Playwright's download.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ["--no-sandbox", "--single-process", "--no-zygote"] } : {},
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 375, height: 800 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
