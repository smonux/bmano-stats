import { expect, test, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { choose, discardEditor, editNote } from './editor-helpers';
import { readShirtNumber, selectShirtNumber } from './wheel-helpers';
async function open(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const fixture = reportFixture();
  fixture.events = [];
  fixture.players.find((player) => player.id === 'a1')!.isGoalkeeper = true;
  fixture.matches[0].lastGoalkeepers = { a: 'a1' };
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'undo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
}
async function create(page: Page, type: string, shirt?: string) {
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await choose(editor, 'Equipo', 'La Jota');
  await choose(editor, 'Evento', type);
  if (shirt) await selectShirtNumber(editor, 'Dorsal principal', shirt);
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
}
test('undo reverses goal/player creation and goalkeeper choice, then disappears on edit/reload', async ({
  page,
}, info) => {
  await open(page);
  await create(page, 'Gol', '0');
  const undo = page.getByRole('button', { name: 'Deshacer creación', exact: true });
  await expect(page.getByLabel('Marcador 1 a 0', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('undo-created.png') });
  await undo.press('Enter');
  await expect(page.getByLabel('Marcador 0 a 0', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Evento manual', exact: true })).toBeFocused();
  await expect(page.locator('.event-card')).toHaveCount(0);
  await create(page, 'Parada', '7');
  await undo.click();
  await expect(page.locator('.event-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await choose(editor, 'Evento', 'Parada');
  await choose(editor, 'Equipo', 'La Jota');
  expect(await readShirtNumber(editor, 'Dorsal principal')).toBe('1');
  await discardEditor(editor);
  await create(page, 'Gol');
  await page.locator('.event-card').getByRole('button', { name: 'Editar', exact: true }).click();
  const editing = page.getByRole('dialog', { name: 'Editar evento', exact: true });
  await editNote(editing);
  await editing.getByLabel('Nota', { exact: true }).fill('Corregido');
  await editing.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editing).toHaveCount(0);
  await expect(undo).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Marcador 1 a 0', { exact: true })).toBeVisible();
  await expect(undo).toHaveCount(0);
});

test('a correction from another window rejects undo without changing either play', async ({
  page,
  context,
}) => {
  await open(page);
  await create(page, 'Gol', '0');
  const second = await context.newPage();
  await second.goto('/#/partidos/report-match');
  await second.locator('.event-card').getByRole('button', { name: 'Editar', exact: true }).click();
  const editor = second.getByRole('dialog', { name: 'Editar evento', exact: true });
  await editNote(editor);
  await editor.getByLabel('Nota', { exact: true }).fill('Editado en otra ventana');
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await page.getByRole('button', { name: 'Deshacer creación', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'No se puede deshacer' })).toBeVisible();
  await expect(page.getByLabel('Marcador 1 a 0', { exact: true })).toBeVisible();
  await expect(page.locator('.event-card')).toHaveCount(1);
  await second.close();
});
