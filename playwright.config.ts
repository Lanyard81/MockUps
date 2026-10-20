import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:4173/MockUps/',
    launchOptions: { executablePath: process.env.PW_CHROMIUM || undefined },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/MockUps/',
    reuseExistingServer: true,
  },
});
