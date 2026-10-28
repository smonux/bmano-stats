import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
  ...base,
  testDir: './tests/native',
  testIgnore: [],
  use: { ...base.use, baseURL: 'http://127.0.0.1:4175' },
  projects: [base.projects![0]],
  webServer: {
    command: 'node scripts/serve-native.mjs',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
  },
});
