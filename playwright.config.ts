import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// En el entorno de la nube hay un Chromium preinstalado; en el Mac se usa el
// de Playwright (instálalo una vez con `npx playwright install chromium`).
const cloudChromium = "/opt/pw-browsers/chromium";
const launchOptions = existsSync(cloudChromium) ? { executablePath: cloudChromium } : {};
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
  },
  projects: [
    {
      name: "iphone",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium", launchOptions },
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
