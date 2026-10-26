import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { transformWithOxc } from 'vite';

// Reuse Vite for these self-contained fixtures on Node builds without native TypeScript.
async function loadFixture(path) {
  const url = new URL(path, import.meta.url);
  const { code } = await transformWithOxc(await readFile(url, 'utf8'), url.pathname);
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const { reportFixture } = await loadFixture('../tests/fixtures/report.ts');
const { nameKey } = await loadFixture('../src/domain/identity.ts');

// Each capture uses a fresh browser profile and fictitious local data, never the user's storage.
const [baseURL, outputDirectory] = process.argv.slice(2);
if (!baseURL || !outputDirectory)
  throw new Error('Usage: capture-hmi-layout.mjs URL OUTPUT_DIRECTORY');
const output = resolve(outputDirectory);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const measurements = [];
try {
  for (const [width, height, longNames] of [
    [390, 664, false],
    [390, 664, true],
    [320, 568, true],
    [844, 390, true],
    [1440, 1000, false],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem('handball-language', 'es');
      localStorage.setItem('handball-welcome-v1', 'done');
    });
    const backup = reportFixture();
    if (longNames) {
      backup.teams[0].name =
        'Club Balonmano La Jota de Zaragoza equipo femenino infantil con nombre completo para identificarlo';
      backup.teams[1].name =
        'Asociación Deportiva Rival de Balonmano equipo masculino cadete con un nombre igualmente extenso';
      for (const team of backup.teams) team.nameKey = nameKey(team.name);
    }
    const timer = backup.matches[0].exclusions[0];
    backup.matches[0].exclusions = [
      { ...timer, dorsal: 7 },
      { ...timer, id: 'second-timer', teamId: 'b', dorsal: 9, remainingMs: 120000 },
      { ...timer, id: 'third-timer', dorsal: 99, remainingMs: 0 },
      null,
    ];
    await page.goto(new URL('/#/ajustes', baseURL).href);
    await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
      name: 'hmi-fixture.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.goto(new URL('/#/partidos/report-match', baseURL).href);
    await page.getByLabel('Marcador 3 a 2', { exact: true }).waitFor();
    const label = `${width}x${height}-${longNames ? 'long' : 'short'}`;
    const measure = await page.evaluate(() => {
      const box = (selector) => {
        const element = document.querySelector(selector);
        if (
          !element ||
          !element.getClientRects().length ||
          (element.tagName !== 'SUMMARY' && element.closest('details:not([open])'))
        )
          return null;
        const bounds = element.getBoundingClientRect();
        return {
          width: bounds.width,
          height: bounds.height,
          position: getComputedStyle(element).position,
        };
      };
      const font = (selector) => getComputedStyle(document.querySelector(selector)).fontSize;
      const header = box('.match-header');
      const capture = box('.capture-bar');
      return {
        viewport: { width: innerWidth, height: innerHeight },
        header,
        capture,
        usableHeightWhileScrolling:
          innerHeight - (header.position === 'sticky' ? header.height : 0) - capture.height,
        documentWidth: document.documentElement.scrollWidth,
        fonts: {
          perspective: font('.scoreboard .eyebrow'),
          team: font('.scoreboard h2'),
          score: font('.score'),
          clock: font('.minute'),
          event: font('.event-title'),
          eventBody: font('.event-copy p'),
          status: font('.event-bottom .caption'),
          exclusion: font('.timer-digits'),
        },
        targets: {
          clock: box('.clock-actions button:last-child'),
          edit: box('.event-bottom .text-button'),
          delete: box('.delete-event'),
          more: box('.event-menu > summary'),
          clearTimer: box('.timer-clear'),
          capture: box('.capture-bar > button'),
        },
      };
    });
    measurements.push({ label, ...measure });
    await page.screenshot({ path: `${output}/${label}-top.png` });
    await page.locator('.event-card').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${label}-scroll.png` });
    if (width === 390 && !longNames) {
      await page.getByRole('tab', { name: 'Estadísticas', exact: true }).click();
      await page
        .locator('.period-charts figure')
        .first()
        .evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await page.screenshot({ path: `${output}/chart-390x664.png` });
    }
    await context.close();
  }
  await writeFile(`${output}/measurements.json`, JSON.stringify(measurements, null, 2) + '\n');
  console.log(
    JSON.stringify(
      measurements.map(({ label, header, capture, usableHeightWhileScrolling }) => ({
        label,
        header: header.height,
        capture: capture.height,
        usableHeightWhileScrolling,
      })),
    ),
  );
} finally {
  await browser.close();
}
