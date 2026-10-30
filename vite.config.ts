import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const version = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
).version;
function buildCommit() {
  const supplied = process.env.RENDER_GIT_COMMIT ?? process.env.GITHUB_SHA;
  if (supplied && /^[a-f0-9]{40,64}$/i.test(supplied)) return supplied.slice(0, 8);
  const git = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
  const hash = git.stdout?.trim();
  return hash && /^[a-f0-9]{40,64}$/i.test(hash) ? hash.slice(0, 8) : '—';
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_COMMIT__: JSON.stringify(buildCommit()),
  },
  build: { outDir: process.env.VITE_NATIVE_BUNDLE === 'true' ? 'dist-native' : 'dist' },
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
  worker: { format: 'es' },
  plugins: [
    react(),
    VitePWA({
      disable: process.env.VITE_NATIVE_BUNDLE === 'true',
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: {
        name: 'Handball Stats',
        short_name: 'Handball',
        description: 'Registra el partido, jugada a jugada.',
        theme_color: '#171717',
        background_color: '#f5f5f2',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'es',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,ttf}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
