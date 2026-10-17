import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8, zipSync, strToU8 } from 'fflate';
import { DEFAULT_SPEECH_MODEL } from 'cactus-needle';
import { serveModels } from './voice-helpers';
import { reportFixture } from './fixtures/report';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
});

test('downloads only Whistle, reuses it for language changes and reloads offline without Needle', async ({
  page,
  context,
}, info) => {
  test.setTimeout(90000);
  await serveModels(context);
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('.cact')) {
      requests.push(request.url());
    }
  });
  await page.addInitScript(() => localStorage.setItem('handball-needle-depth', '20'));
  await page.goto('/#/ajustes');
  const preparation = page.getByRole('region', { name: 'Preparación de voz' });
  await expect(preparation.getByLabel('Versión de Needle')).toHaveCount(0);
  await expect(preparation.getByLabel('Versión de Whistle')).toHaveCount(0);
  for (const language of ['es', 'en', 'fr', 'pl']) {
    await preparation.getByLabel('Idioma de voz', { exact: true }).selectOption(language);
    await preparation.getByRole('button', { name: 'Cargar Cactus', exact: true }).click();
    await expect(preparation.getByText('Cactus listo', { exact: true })).toBeVisible({
      timeout: 30000,
    });
  }
  expect(requests).toEqual([DEFAULT_SPEECH_MODEL.url]);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await preparation.getByRole('button', { name: 'Cargar Cactus', exact: true }).click();
  await expect(preparation.getByText('Cactus listo', { exact: true })).toBeVisible({
    timeout: 30000,
  });
  expect(requests).toEqual([DEFAULT_SPEECH_MODEL.url]);
  await page.screenshot({ path: info.outputPath('whistle-rules.png'), fullPage: true });
});

test('full ZIP export restores ZIP or legacy JSON only after confirmation', async ({
  page,
}, info) => {
  await page.goto('/#/ajustes');
  const upload = page.getByLabel('Importar copia', { exact: true });
  const fixture = reportFixture();
  await upload.setInputFiles({
    name: 'old-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await expect(page.getByRole('dialog', { name: 'Restaurar copia' })).toContainText(
    '2 equipos, 1 partidos y 9 eventos',
  );
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const next = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia ZIP', exact: true }).click();
  const download = await next;
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
  const path = info.outputPath('backup.zip');
  await download.saveAs(path);
  const files = unzipSync(await readFile(path));
  expect(Object.keys(files)).toEqual(['handball-stats.json']);
  const exported = JSON.parse(strFromU8(files['handball-stats.json']));
  for (const key of ['teams', 'players', 'matches', 'events'] as const) {
    const order = (rows: { id: string }[]) => [...rows].sort((a, b) => a.id.localeCompare(b.id));
    expect(order(exported[key])).toEqual(order(fixture[key]));
  }
  const restored = structuredClone(fixture);
  restored.teams[0].name = 'La Jota restaurada';
  restored.teams[0].nameKey = 'la jota restaurada';
  const bytes = zipSync({ 'handball-stats.json': strToU8(JSON.stringify(restored)) });
  await upload.setInputFiles({
    name: 'backup.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from(bytes),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.goto('/#/partidos/report-match');
  await expect(page.getByRole('heading', { name: 'La Jota', exact: true })).toBeVisible();
  await page.goto('/#/ajustes');
  await upload.setInputFiles({
    name: 'backup.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from(bytes),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await expect(
    page.getByRole('heading', { name: 'La Jota restaurada', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Marcador 3 a 2')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Exclusión 1', exact: true })).toContainText('—');
  await page.goto('/#/ajustes');
  await upload.setInputFiles({
    name: 'invalid.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from([80, 75, 3, 4]),
  });
  await expect(page.getByRole('alert').filter({ hasText: 'Copia no válida' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
