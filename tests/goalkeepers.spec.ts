import { choose } from './editor-helpers';
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { reportFixture } from './fixtures/report';
import { selectEvent } from './voice-helpers';
import { readShirtNumber, selectShirtNumber } from './wheel-helpers';
test('goalkeeper roles are explicit in the roster and saves remember zero across reload and ZIP', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const fixture = reportFixture();
  fixture.events = [];
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'old.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/equipos/a');
  const row = page.locator('.list-row').filter({ hasText: 'Íker' });
  await row.click();
  const role = page.getByRole('checkbox', { name: 'Portero', exact: true });
  await expect(role).not.toBeChecked();
  await role.check();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await row.click();
  await expect(role).not.toBeChecked();
  await role.check();
  await page.getByRole('button', { name: 'Guardar jugador', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(row).toContainText('Portero');
  await page.goto('/#/partidos/report-match');
  for (const shirt of ['1', '0']) {
    await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
    await selectEvent(page, 'Parada');
    const editor = page.getByRole('dialog');
    await choose(editor, 'Equipo', 'La Jota');
    await selectShirtNumber(editor, 'Dorsal principal', shirt);
    await expect.poll(() => readShirtNumber(editor, 'Dorsal principal')).toBe(shirt);
    await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
    await expect(editor).toHaveCount(0);
    await expect(page.locator('.event-card').first()).toContainText(`· #${shirt}`);
  }
  await expect(page.locator('.event-card')).toHaveCount(2);
  await page.reload();
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  await selectEvent(page, 'Parada');
  const editor = page.getByRole('dialog');
  await choose(editor, 'Equipo', 'La Jota');
  expect(await readShirtNumber(editor, 'Dorsal principal')).toBe('0');
  await page.screenshot({ path: info.outputPath('remembered-goalkeeper.png'), fullPage: true });
  await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.goto('/#/ajustes');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia ZIP', exact: true }).click();
  const path = info.outputPath('goalkeepers.zip');
  await (await download).saveAs(path);
  const bytes = await readFile(path);
  const backup = JSON.parse(strFromU8(unzipSync(bytes)['handball-stats.json']));
  const goalkeeper = backup.players.find(
    (player: { dorsal: number; teamId: string }) => player.dorsal === 0 && player.teamId === 'a',
  );
  expect(goalkeeper.isGoalkeeper).toBe(true);
  expect(backup.matches[0].lastGoalkeepers.a).toBe(goalkeeper.id);
  expect(
    backup.players.find((player: { id: string }) => player.id === 'b9').isGoalkeeper,
  ).toBeUndefined();
  await page
    .getByLabel('Importar copia', { exact: true })
    .setInputFiles({ name: 'keep.zip', mimeType: 'application/zip', buffer: bytes });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/equipos/a');
  await expect(page.locator('.list-row').filter({ hasText: 'Íker' })).toContainText('Portero');
});
