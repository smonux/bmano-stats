import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Isolated component journeys use the real source and IndexedDB, without faking ASR accuracy.
export default defineConfig({
  ...base,
  testDir: './tests/review',
  testIgnore: [],
  use: { ...base.use, baseURL: 'http://127.0.0.1:4174' },
  webServer: {
    command: 'npm run dev -- --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
