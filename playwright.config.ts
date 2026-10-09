import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    channel: 'chrome', // Chrome sistem; Playwright 1.64 minta Chromium r1248 yang belum terpasang (tidak mengunduh browser)
    baseURL: 'http://localhost:5273',
    viewport: { width: 960, height: 540 },
    launchOptions: {
      args: [
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist',
      ],
    },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5273',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
