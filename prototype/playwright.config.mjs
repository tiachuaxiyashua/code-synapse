import { defineConfig } from 'playwright/test';

export default defineConfig({
  workers: 1,
  use: {
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'npm run dev -- --port 4173',
    url: 'http://127.0.0.1:4173/semantic-zoom.html?view=features',
    reuseExistingServer: true,
  },
});
