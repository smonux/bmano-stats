import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './scripts',
  testMatch: 'capture-store-screenshots.ts',
  projects: [{ name: 'browser-reference' }],
  workers: 1,
  webServer: {
    command: 'node scripts/serve-native.mjs',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: true,
  },
});
