import { chromium, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { reportFixture } from '../tests/fixtures/report.ts';

// These are real app renderings in Chromium, not Android/iOS simulator captures.
test('authentic browser references, explicitly not native store screenshots', async () => {
  test.setTimeout(240000);
  const root = 'artifacts/stores/screenshots/browser-reference';
  await mkdir(root, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const manifest: unknown[] = [];
  try {
    for (const language of ['es', 'en', 'de', 'fr', 'it', 'nl', 'pl']) {
      for (const [platform, width, height] of [
        ['android', 360, 640],
        ['iphone', 440, 956],
      ] as const) {
        const context = await browser.newContext({
          viewport: { width, height },
          deviceScaleFactor: 3,
          colorScheme: 'light',
        });
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        await page.addInitScript((language) => {
          localStorage.setItem('handball-language', language);
          localStorage.setItem('handball-voice-language', language);
          localStorage.setItem('handball-welcome-v1', 'done');
        }, language);
        await page.goto('http://127.0.0.1:4175/#/ajustes');
        const fixture = reportFixture();
        fixture.teams[0].name = 'Club Norte';
        fixture.teams[0].nameKey = 'club norte';
        fixture.teams[1].name = 'Club Sur';
        fixture.teams[1].nameKey = 'club sur';
        const file = page.locator('input[type=file]');
        await file.setInputFiles({
          name: 'fictional-store-demo.json',
          mimeType: 'application/json',
          buffer: Buffer.from(JSON.stringify(fixture)),
        });
        const confirmation = page.getByRole('dialog');
        await confirmation.getByRole('button').last().click();
        await confirmation.waitFor({ state: 'hidden' });
        for (const [screen, route, ready] of [
          ['match', '/partidos/report-match', '.scoreboard'],
          ['statistics', '/estadisticas', '.statistics'],
          ['practice', '/practica-voz', '.practice-tokens'],
        ]) {
          await page.goto(`http://127.0.0.1:4175/#${route}`);
          if (screen === 'statistics') await page.getByRole('heading').first().waitFor();
          else await page.locator(ready).first().waitFor();
          await page.evaluate(() => document.fonts.ready);
          const filename = `${language}-${platform}-${screen}.png`;
          await page.screenshot({ path: `${root}/${filename}` });
          manifest.push({
            file: filename,
            language,
            screen,
            width: width * 3,
            height: height * 3,
            source: 'Chromium rendering of packaged app with fictional imported data',
            nativeCapture: false,
            submissionReady: false,
          });
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  await writeFile(
    'artifacts/stores/screenshots/manifest.json',
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        produced: manifest,
        missing: [
          'Native Android emulator/device captures after APK installation',
          'Native iPhone simulator/device captures on macOS',
          'iPad is not a declared native device family',
        ],
        instruction:
          'Do not label these browser references as native screenshots or upload without native UX comparison and owner approval.',
      },
      null,
      2,
    ),
  );
  console.log(
    `${manifest.length} authentic app browser references generated; native screenshots explicitly pending.`,
  );
});
