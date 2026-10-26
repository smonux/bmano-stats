import { expect, test, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { choose } from './editor-helpers';
import { selectShirtNumber } from './wheel-helpers';

async function open(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const fixture = reportFixture();
  fixture.events = [];
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'actions.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  return page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
}

test('creation has no undo and its visible trash icon deletes with confirmation without undoing the player', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 664 });
  const editor = await open(page);
  await choose(editor, 'Evento', 'Gol');
  await selectShirtNumber(editor, 'Dorsal principal', '0');
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.getByLabel('Marcador 1 a 0', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Deshacer creación', exact: true })).toHaveCount(0);
  const card = page.locator('.event-card');
  const remove = card.getByRole('button', { name: 'Eliminar Gol del minuto 9', exact: true });
  await expect(card.locator('.event-menu')).toHaveCount(0);
  await expect(remove).toBeVisible();
  await expect(remove).toHaveText('');
  await expect(remove.locator('svg')).toHaveCount(1);
  const bounds = (await remove.boundingBox())!;
  const edit = (await card.getByRole('button', { name: 'Editar', exact: true }).boundingBox())!;
  expect(bounds.width).toBeGreaterThanOrEqual(48);
  expect(bounds.height).toBeGreaterThanOrEqual(48);
  expect(bounds.x - edit.x - edit.width).toBeGreaterThanOrEqual(8);
  await remove.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('direct-delete.png') });
  await remove.focus();
  await page.keyboard.press('Enter');
  const confirmation = page.getByRole('dialog', { name: 'Eliminar evento', exact: true });
  await expect(confirmation).toContainText('Gol · La Jota');
  await page.keyboard.press('Escape');
  await expect(confirmation).toHaveCount(0);
  await expect(remove).toBeFocused();
  await expect(card).toHaveCount(1);
  await remove.click();
  await confirmation.getByRole('button', { name: 'Eliminar evento', exact: true }).click();
  await expect(confirmation).toHaveCount(0);
  await expect(card).toHaveCount(0);
  await expect(page.getByLabel('Marcador 0 a 0', { exact: true })).toBeVisible();
  await page.reload();
  await expect(card).toHaveCount(0);
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  await choose(editor, 'Evento', 'Gol');
  await expect(editor.getByRole('button', { name: /^#0 / })).toHaveCount(1);
});

for (const width of [320, 390])
  test(`choosing events reveals participant data at ${width}px, with keyboard access and no automatic text focus`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 664 });
    const editor = await open(page);
    const fields = editor.locator('.event-editor-fields');
    const data = editor.getByRole('group', { name: 'Datos del evento', exact: true });
    const pageScroll = await page.evaluate(() => scrollY);
    const goal = editor.getByRole('button', { name: 'Gol', exact: true });
    if (width === 320) {
      await goal.focus();
      await page.keyboard.press('Enter');
    } else await goal.click();
    await expect(data).toBeFocused();
    const area = (await fields.boundingBox())!;
    const heading = (await editor.locator('.participant-team').first().boundingBox())!;
    const firstPlayer = (await editor
      .getByRole('group', { name: 'Jugador principal', exact: true })
      .getByRole('button')
      .first()
      .boundingBox())!;
    expect(heading.y).toBeGreaterThanOrEqual(area.y - 1);
    expect(firstPlayer.y + firstPlayer.height).toBeLessThanOrEqual(area.y + area.height + 1);
    expect(await fields.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => scrollY)).toBe(pageScroll);
    for (const button of await editor.locator('.event-editor-footer .actions button').all())
      await expect(button).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath('event-data.png') });
    await choose(editor, 'Jugador principal', '#7 Ana Łukasz');
    await expect(editor.getByRole('button', { name: '#7 Ana Łukasz', exact: true })).toBeFocused();
    await choose(editor, 'Evento', 'Sustitución');
    await expect(data).toBeFocused();
    await expect(editor.locator('.participant-team').first()).toContainText('Sale');
    await choose(editor, 'Jugador relacionado', '#1 Íker');
    await expect(editor.locator('.draft-summary')).toContainText('Sale: #7');
    await expect(editor.locator('.draft-summary')).toContainText('Entra: #1');
    await choose(editor, 'Evento', 'Pasivo');
    await expect(data).toBeFocused();
    await expect(editor.locator('.participant')).toHaveCount(0);
    await choose(editor, 'Evento', 'Nota');
    await expect(data).toBeFocused();
    const note = editor.getByLabel('Nota', { exact: true });
    await expect(note).toBeInViewport();
    await expect(note).not.toBeFocused();
    await page.keyboard.press('Tab');
    await expect(note).toBeFocused();
    await choose(editor, 'Evento', 'Gol');
    const ourTeam = editor
      .getByRole('group', { name: 'Equipo', exact: true })
      .getByRole('button', { name: 'La Jota', exact: true });
    await expect(ourTeam).toBeFocused();
    await expect(ourTeam).toHaveAttribute('aria-pressed', 'false');
    await choose(editor, 'Equipo', 'Rival');
    await expect(data).toBeFocused();
    await expect(editor.locator('.participant-team').first()).toContainText('Rival');
    await expect(
      editor
        .getByRole('group', { name: 'Jugador principal', exact: true })
        .getByRole('button', { pressed: true }),
    ).toHaveText('Sin identificar');
  });
