import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:4173/PageWright/',
    // Wide enough that every toolbar button shows; the narrow case has its own test.
    viewport: { width: 1700, height: 1000 },
    // The first-run tour is dismissed in every test except the one that is about the tour.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:4173',
          localStorage: [{ name: 'pagewright.tourDone', value: '1' }],
        },
      ],
    },
    launchOptions: { executablePath: process.env.PW_CHROMIUM || undefined },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/PageWright/',
    reuseExistingServer: true,
  },
});
