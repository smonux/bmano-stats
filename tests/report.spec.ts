import { test, expect } from '@playwright/test';
import { writeFile, readFile } from 'node:fs/promises';
import { reportFixture } from './fixtures/report';
test('active match shares a PDF snapshot; completed match downloads one, also offline', async ({
  page,
  context,
}, info) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        (window as unknown as { sharedReport: File }).sharedReport = data.files![0];
      },
    });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(reportFixture())),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await page.getByRole('tab', { name: 'Estadísticas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Partido en curso', exact: true })).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Marcador por minuto del tiempo 1', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Marcador por minuto del tiempo 2', exact: true }),
  ).toBeVisible();
  const share = page.getByRole('button', { name: 'Compartir PDF del partido', exact: true });
  await expect(share).toBeEnabled({ timeout: 30000 });
  await share.click();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean((window as unknown as { sharedReport?: File }).sharedReport)),
    )
    .toBe(true);
  const active = await page.evaluate(async () => {
    const file = (window as unknown as { sharedReport: File }).sharedReport;
    return {
      name: file.name,
      type: file.type,
      bytes: Array.from(new Uint8Array(await file.arrayBuffer())),
    };
  });
  expect(active.type).toBe('application/pdf');
  expect(active.name).toMatch(/\.pdf$/);
  expect(String.fromCharCode(...active.bytes.slice(0, 5))).toBe('%PDF-');
  await writeFile(info.outputPath('active.pdf'), Buffer.from(active.bytes));
  await page.screenshot({ path: info.outputPath('score-charts.png'), fullPage: true });
  await page.getByRole('button', { name: 'Finalizar partido', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Detalle del partido', exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('tab', { name: 'Estadísticas', exact: true }).click();
  await expect(share).toBeEnabled({ timeout: 30000 });
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false }),
  );
  const next = page.waitForEvent('download');
  await share.click();
  const download = await next;
  await download.saveAs(info.outputPath('completed.pdf'));
  expect((await readFile(info.outputPath('completed.pdf'))).subarray(0, 5).toString()).toBe(
    '%PDF-',
  );
  expect(errors).toEqual([]);
});

test('a long match paginates compact events and handles long names', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'One desktop PDF is enough to verify pagination.');
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false });
  });
  const data = reportFixture();
  data.teams[0].name = 'Club Balonmano La Jota de Zaragoza - Equipo de prueba con nombre largo';
  data.teams[0].nameKey = data.teams[0].name.toLowerCase();
  data.players
    .filter((player) => !player.isUnknown)
    .forEach((player) => {
      player.name += ' - Nombre largo con apellidos y caracteres áéíóú Ł';
    });
  data.events = Array.from({ length: 120 }, (_, index) => ({
    ...structuredClone(data.events[index % data.events.length]),
    id: `long-${index}`,
    orderKey: index,
    period: Math.floor(index / 60) + 1,
    minute: Math.floor((index % 60) / 2) + 1,
  }));
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'long.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await page.getByRole('tab', { name: 'Estadísticas', exact: true }).click();
  const share = page.getByRole('button', { name: 'Compartir PDF del partido', exact: true });
  await expect(share).toBeEnabled({ timeout: 30000 });
  const next = page.waitForEvent('download');
  await share.click();
  await (await next).saveAs(info.outputPath('long-match.pdf'));
});
