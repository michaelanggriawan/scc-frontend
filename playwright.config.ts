import { defineConfig, devices } from "@playwright/test";

// Assumes the backend is running on :4000 and the frontend on :3001.
// `npm run test:e2e` will start the frontend automatically (reusing one if
// already up); the backend must be started separately (see README).
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  // First hit to a dev route triggers on-demand compilation; one retry absorbs
  // that cold-start without masking real failures.
  retries: 1,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
