import { choose } from './editor-helpers';
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { reportFixture } from './fixtures/report';

test('manual match note is readable, editable and survives reload and ZIP restore', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 390 : 1000, height: 664 });
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const fixture = reportFixture();
  fixture.events = [];
  await page.goto('/#/ajustes');
  const upload = page.getByLabel('Importar copia', { exact: true });
  await upload.setInputFiles({
    name: 'match.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await choose(editor, 'Evento', 'Nota');
  await expect(editor.getByRole('listbox', { name: 'Equipo', exact: true })).toHaveCount(0);
  await expect(
    editor.getByRole('button', { name: 'Guardar pendiente', exact: true }),
  ).toBeVisible();
  const body = `Recordar a Sara que no se dirija al árbitro.\nBuen movimiento de balón. ${'RecordatorioLargo'.repeat(25)}`;
  await editor.getByLabel('Nota', { exact: true }).fill(body);
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).press('Enter');
  await expect(editor).toHaveCount(0);
  const card = page.locator('.event-card');
  await expect(card).toHaveCount(1);
  await expect(card.locator('.event-note')).toHaveText(body);
  await expect(card).toContainText('Nota del partido');
  await expect(card).not.toContainText('Equipo pendiente');
  await expect(page.getByLabel('Marcador 0 a 0')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('note-feed.png'), fullPage: true });
  await page.reload();
  await expect(card.locator('.event-note')).toHaveText(body);
  await card.getByRole('button', { name: 'Editar', exact: true }).click();
  const edit = page.getByRole('dialog', { name: 'Editar evento', exact: true });
  await edit.getByLabel('Nota', { exact: true }).fill('Comentario corregido.');
  await edit.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(edit).toHaveCount(0);
  await expect(card.locator('.event-note')).toHaveText('Comentario corregido.');
  await page.goto('/#/ajustes');
  const next = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia ZIP', exact: true }).click();
  const download = await next;
  const path = info.outputPath('notes.zip');
  await download.saveAs(path);
  const exported = JSON.parse(strFromU8(unzipSync(await readFile(path))['handball-stats.json']));
  expect(exported.players).toEqual([...fixture.players].sort((a, b) => a.id.localeCompare(b.id)));
  expect(exported.events).toHaveLength(1);
  expect(exported.events[0]).toMatchObject({
    type: 'note',
    teamId: null,
    note: 'Comentario corregido.',
  });
  await upload.setInputFiles(path);
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await expect(card.locator('.event-note')).toHaveText('Comentario corregido.');
  await expect(page.getByLabel('Marcador 0 a 0')).toBeVisible();
});
