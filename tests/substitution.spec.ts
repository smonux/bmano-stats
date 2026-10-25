import { choose } from './editor-helpers';
import { selectShirtNumber } from './wheel-helpers';
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { selectEvent } from './voice-helpers';
import { reportFixture } from './fixtures/report';

test('substitution editor preserves two teammates, statistics, PDF and ZIP restore', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const data = reportFixture();
  data.events = [];
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'match.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  await selectEvent(page, 'Sustitución');
  const dialog = page.getByRole('dialog');
  await choose(dialog, 'Equipo', 'La Jota');
  await expect(dialog.getByRole('region', { name: 'Sale · La Jota', exact: true })).toContainText(
    'La Jota',
  );
  await expect(dialog.getByRole('region', { name: 'Entra · La Jota', exact: true })).toContainText(
    'La Jota',
  );
  await selectShirtNumber(dialog, 'Dorsal principal', '6');
  await selectShirtNumber(dialog, 'Dorsal relacionado', '6');
  await expect(
    dialog.getByRole('button', { name: 'Guardar pendiente', exact: true }),
  ).toBeEnabled();
  await expect(
    dialog.getByRole('button', { name: 'Guardar pendiente', exact: true }),
  ).toBeVisible();
  await selectShirtNumber(dialog, 'Dorsal relacionado', '9');
  await page.screenshot({ path: info.outputPath('substitution-editor.png'), fullPage: true });
  await dialog.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(page.locator('.event-card').filter({ hasText: 'Sustitución' })).toContainText(
    'La Jota · Sale #6 → Entra #9',
  );
  await expect(page.getByLabel('Marcador 0 a 0')).toBeVisible();
  await page.reload();
  await expect(page.locator('.event-card')).toContainText('Sale #6 → Entra #9');
  await page.getByRole('tab', { name: 'Estadísticas', exact: true }).click();
  await expect(
    page.locator('.stat-list div').filter({ hasText: 'Sustituciones' }).locator('dd'),
  ).toHaveText('1');
  await page.getByRole('tab', { name: 'Jugadores', exact: true }).click();
  await page.locator('.player-stat').filter({ hasText: /^6/ }).click();
  await expect(
    page.locator('.stat-list div').filter({ hasText: 'Salidas' }).locator('dd'),
  ).toHaveText('1');
  await expect(
    page.locator('.stat-list div').filter({ hasText: 'Entradas' }).locator('dd'),
  ).toHaveText('0');
  await page.getByRole('button', { name: 'Todos los jugadores', exact: true }).click();
  await page.locator('.player-stat').filter({ hasText: /^9/ }).click();
  await expect(
    page.locator('.stat-list div').filter({ hasText: 'Entradas' }).locator('dd'),
  ).toHaveText('1');
  const share = page.getByRole('button', { name: 'Descargar PDF', exact: true });
  await expect(share).toBeEnabled({ timeout: 30000 });
  const nextPdf = page.waitForEvent('download');
  await share.click();
  await (await nextPdf).saveAs(info.outputPath('substitution.pdf'));
  await page.goto('/#/ajustes');
  const nextZip = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia ZIP', exact: true }).click();
  const zip = await nextZip;
  const path = info.outputPath('substitution.zip');
  await zip.saveAs(path);
  const bytes = await readFile(path);
  const restored = JSON.parse(strFromU8(unzipSync(bytes)['handball-stats.json']));
  expect(restored.events).toHaveLength(1);
  expect(restored.events[0].type).toBe('substitution');
  for (const key of ['primaryPlayerId', 'relatedPlayerId']) {
    expect(
      restored.players.find((player: { id: string }) => player.id === restored.events[0][key])
        .teamId,
    ).toBe('a');
  }
  await page
    .getByLabel('Importar copia', { exact: true })
    .setInputFiles({ name: 'match.zip', mimeType: 'application/zip', buffer: bytes });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await expect(page.locator('.event-card')).toContainText('Sale #6 → Entra #9');
  expect(errors).toEqual([]);
});
