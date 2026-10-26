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
  await expect(
    page.locator('.match-page-title .badge').filter({ hasText: /^En curso$/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Marcador por minuto del tiempo 1', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Marcador por minuto del tiempo 2', exact: true }),
  ).toBeVisible();
  const share = page.getByRole('button', { name: /^(Enviar PDF a…|Descargar PDF)$/ });
  await expect(share).toBeEnabled({ timeout: 30000 });
  await expect(share).toHaveText('Enviar PDF a…');
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
    page.locator('.match-page-title .badge').filter({ hasText: /^Finalizado$/ }),
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

test('native cancellation does not download; a genuine sharing failure offers the prepared PDF', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
    const state = window as unknown as {
      shareMode: string;
      shareCalls: number;
      activeGesture: boolean;
    };
    state.shareMode = 'cancel';
    state.shareCalls = 0;
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => {
        state.shareCalls++;
        state.activeGesture = navigator.userActivation.isActive;
        if (state.shareMode === 'cancel') throw new DOMException('Cancelled', 'AbortError');
        throw new DOMException('Blocked', 'NotAllowedError');
      },
    });
  });
  let downloads = 0;
  page.on('download', () => downloads++);
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'report.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(reportFixture())),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await page.getByRole('tab', { name: 'Estadísticas', exact: true }).click();
  const share = page.getByRole('button', { name: 'Enviar PDF a…', exact: true });
  await expect(share).toBeEnabled({ timeout: 30000 });
  await share.click();
  await expect(share).toBeEnabled();
  expect(await page.evaluate(() => (window as unknown as { shareCalls: number }).shareCalls)).toBe(
    1,
  );
  expect(
    await page.evaluate(() => (window as unknown as { activeGesture: boolean }).activeGesture),
  ).toBe(true);
  expect(downloads).toBe(0);
  await page.evaluate(() => {
    (window as unknown as { shareMode: string }).shareMode = 'fail';
  });
  await share.click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'No se pudo abrir Enviar a' }),
  ).toBeVisible();
  expect(downloads).toBe(0);
  const next = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar PDF', exact: true }).click();
  const file = await next;
  const path = info.outputPath('share-fallback.pdf');
  await file.saveAs(path);
  expect((await readFile(path)).subarray(0, 5).toString()).toBe('%PDF-');
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
    note:
      index % 15 === 0
        ? `Nota de la jugada ${index}: presión defensiva y salida rápida.\nSegunda línea conservada.`
        : '',
    rawText: index % 15 === 0 ? `Transcripción ${index}: gol nuestro del siete pase de Íker` : '',
  }));
  data.events[60].note = `${'Nota extensa de partido con áéíóú y saltos de línea.\n'.repeat(80)}Fin de nota extensa.`;
  data.events[60].rawText = `${'gol nuestro del siete asistencia de Íker '.repeat(120)}fin de transcripción extensa`;
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
  const share = page.getByRole('button', { name: /^(Enviar PDF a…|Descargar PDF)$/ });
  await expect(share).toBeEnabled({ timeout: 30000 });
  const next = page.waitForEvent('download');
  await share.click();
  await (await next).saveAs(info.outputPath('long-match.pdf'));
});
