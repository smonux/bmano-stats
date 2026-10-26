import { expect, test, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { nameKey } from '../src/domain/identity';
import { choose, editNote } from './editor-helpers';
import { readShirtNumber, selectShirtNumber } from './wheel-helpers';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
async function open(page: Page, full = false) {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const fixture = reportFixture();
  fixture.events = [];
  fixture.teams[1].name =
    'Equipo contrario de balonmano con nombre muy largo para comprobar la identificación';
  fixture.teams[1].nameKey = nameKey(fixture.teams[1].name);
  fixture.matches[0].exclusions = full
    ? [0, 1, 2, 3].map((slot) => ({
        id: 'occupied-' + slot,
        teamId: 'a',
        dorsal: slot,
        remainingMs: 60000,
        running: true,
        startedAt: null,
      }))
    : [null, null, null, null];
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'counter.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  return fixture;
}
async function exclusion(page: Page, team: string, shirt: string) {
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await choose(editor, 'Evento', 'Exclusión');
  await choose(editor, 'Equipo', team);
  if (shirt !== '') await selectShirtNumber(editor, 'Dorsal principal', shirt);
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator('.event-card')).toHaveCount(1);
}
for (const shirt of ['', '0', '99'])
  test(`explicit counter action preserves team and optional/new shirt ${shirt || 'empty'} independently from undo`, async ({
    page,
  }, info) => {
    const fixture = await open(page);
    const team = shirt === '' ? 'La Jota' : fixture.teams[1].name;
    await exclusion(page, team, shirt);
    await expect(page.locator('.exclusion-timer')).toHaveCount(0);
    const start = page.getByRole('button', {
      name: 'Iniciar contador de esta exclusión',
      exact: true,
    });
    await start.press('Enter');
    let dialog = page.getByRole('dialog');
    await expect(
      dialog
        .getByRole('listbox', { name: 'Equipo', exact: true })
        .getByRole('option', { selected: true }),
    ).toHaveText(team);
    expect(await readShirtNumber(dialog, 'Dorsal (opcional)')).toBe(shirt);
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(start).toBeFocused();
    await start.click();
    dialog = page.getByRole('dialog');
    await page.screenshot({ path: info.outputPath('prefilled-counter.png') });
    await dialog.getByRole('button', { name: /^Activar/ }).dblclick();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('.exclusion-timer')).toHaveCount(1);
    await expect(page.locator('.event-card')).toHaveCount(1);
    const region = page.getByRole('region', { name: 'Cuenta atrás de exclusiones', exact: true });
    await expect(region).toBeFocused();
    await expect(page.locator('.exclusion-timer')).toContainText(
      shirt === '' ? '1 · —' : `2 · #${shirt}`,
    );
    await page.getByRole('button', { name: 'Deshacer creación', exact: true }).click();
    await expect(page.locator('.event-card')).toHaveCount(0);
    await expect(page.locator('.exclusion-timer')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('.exclusion-timer')).toHaveCount(1);
    await expect(page.locator('.event-card')).toHaveCount(0);
    await page.screenshot({ path: info.outputPath('independent-counter.png') });
  });

test('full counters remain accessible without overwriting and timer deletion leaves edited event intact', async ({
  page,
}, info) => {
  await open(page, true);
  await exclusion(page, 'La Jota', '7');
  await page
    .getByRole('button', { name: 'Contadores llenos · Ver contadores', exact: true })
    .click();
  await expect(
    page.getByRole('region', { name: 'Cuenta atrás de exclusiones', exact: true }),
  ).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.exclusion-timer')).toHaveCount(4);
  await page
    .getByRole('group', { name: 'Exclusión 1', exact: true })
    .getByRole('button', { name: 'Liberar', exact: true })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Iniciar contador de esta exclusión', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Activar/ })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.exclusion-timer')).toHaveCount(4);
  await page.locator('.event-card').getByRole('button', { name: 'Editar', exact: true }).click();
  const editor = page.getByRole('dialog');
  await editNote(editor);
  await editor.getByLabel('Nota', { exact: true }).fill('Exclusión revisada');
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator('.exclusion-timer')).toHaveCount(4);
  await page
    .getByRole('group', { name: 'Exclusión 1', exact: true })
    .getByRole('button', { name: 'Liberar', exact: true })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.exclusion-timer')).toHaveCount(3);
  await expect(page.locator('.event-card')).toHaveCount(1);
  await page.locator('.event-card .event-menu > summary').click();
  await page.locator('.event-card .delete-event').click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Eliminar evento', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.event-card')).toHaveCount(0);
  await expect(page.locator('.exclusion-timer')).toHaveCount(3);
  await page.goto('/#/ajustes');
  const next = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia ZIP', exact: true }).click();
  const file = info.outputPath('independent.zip');
  await (await next).saveAs(file);
  const data = JSON.parse(strFromU8(unzipSync(await readFile(file))['handball-stats.json']));
  expect(data.matches[0].exclusions.filter(Boolean)).toHaveLength(3);
  expect(data.events[0].deletedAt).not.toBeNull();
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles(file);
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await expect(page.locator('.exclusion-timer')).toHaveCount(3);
  await expect(page.locator('.event-card')).toHaveCount(0);
});
