import { defineConfig } from "@playwright/test";

const productionBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  outputDir: "output/playwright/test-results",
  reporter: "line",
  use: {
    baseURL: productionBaseURL ?? "http://127.0.0.1:3000",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: productionBaseURL ? undefined : {
    command: "npm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
