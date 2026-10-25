import { choose } from '../editor-helpers';
import { test, expect, type Page } from '@playwright/test';
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Confirmar jugada', exact: true });
const saveButton = (page: Page) =>
  dialog(page).getByRole('button', { name: /^Guardar (evento|pendiente)$/ });
async function open(page: Page, query = '') {
  await page.goto(`/tests/review/index.html${query}`);
  await page.clock.install();
  await page.getByRole('button', { name: 'Mostrar propuesta', exact: true }).click();
  await expect(dialog(page)).toBeVisible();
  await expect(saveButton(page)).toBeFocused();
}
test('golden saves one goal with both players, penalty and original transcription', async ({
  page,
}) => {
  const text = 'Golden nuestro 7 1 penalti';
  await open(page, `?text=${encodeURIComponent(text)}`);
  await expect(dialog(page)).toContainText('#7 · Ana Łukasz');
  await expect(dialog(page)).toContainText('#1 · Íker');
  await expect(dialog(page).locator('.voice-transcript')).toContainText(text);
  await expect(dialog(page)).not.toContainText('Se guardará pendiente');
  await saveButton(page).press('Enter');
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.getByTestId('score')).toHaveText('1:0');
  const events = JSON.parse((await page.getByTestId('events').textContent())!);
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    type: 'goal',
    teamId: 'a',
    primaryPlayerId: 'a7',
    relatedPlayerId: 'a1',
    metadata: { penalty: true },
    rawText: text,
  });
  await page.reload();
  await expect(page.getByTestId('score')).toHaveText('1:0');
  expect(JSON.parse((await page.getByTestId('events').textContent())!)).toHaveLength(1);
});
test('dictated note is editable, waits for explicit saving and never changes the score', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 390 : 1000, height: 664 });
  const text =
    'Nota: El árbitro está advirtiendo a Sara de posible exclusión, tengo que recordarle que no se dirija a él';
  await open(page, `?text=${encodeURIComponent(text)}`);
  await dialog(page).getByText('Transcripción original', { exact: true }).click();
  await expect(dialog(page)).toContainText('Nota del partido');
  await expect(dialog(page)).not.toContainText('Equipo pendiente');
  await expect(dialog(page)).not.toContainText('Se guardará pendiente');
  await dialog(page).getByRole('button', { name: 'Editar', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await expect(editor.getByRole('listbox', { name: 'Equipo', exact: true })).toHaveCount(0);
  await expect(editor.getByLabel('Nota', { exact: true })).toHaveValue(text.slice(6));
  await editor
    .getByLabel('Nota', { exact: true })
    .fill(`${text.slice(6)}\nRecordarlo al descanso.`);
  await page.screenshot({ path: info.outputPath('note-editor.png'), fullPage: true });
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.getByTestId('events')).toContainText('Recordarlo al descanso.');
  await page.reload();
  await expect(page.getByTestId('score')).toHaveText('0:0');
  const events = JSON.parse((await page.getByTestId('events').textContent())!);
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    type: 'note',
    teamId: null,
    primaryPlayerId: null,
    relatedPlayerId: null,
    rawText: text,
    period: 2,
    minute: 9,
  });
  // The diagnostic JSON must not expand the mobile layout viewport behind the modal.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Mostrar propuesta', exact: true }).click();
  await expect(dialog(page)).toBeVisible();
  await page.clock.fastForward(60000);
  await expect(dialog(page)).toBeVisible();
  expect(JSON.parse((await page.getByTestId('events').textContent())!)).toHaveLength(1);
  await page.screenshot({ path: info.outputPath('note-manual-review.png') });
  await saveButton(page).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.getByTestId('score')).toHaveText('0:0');
  expect(JSON.parse((await page.getByTestId('events').textContent())!)).toHaveLength(2);
});
test('waiting never saves; explicit confirmation saves once, preserves the captured position and persists', async ({
  page,
}) => {
  await open(page);
  await expect(dialog(page)).toContainText('#7 · Ana Łukasz');
  await expect(dialog(page)).toContainText('#1 · Íker');
  await expect(dialog(page)).toContainText('2 / 9′');
  await expect(page.getByTestId('score')).toHaveText('0:0');
  await page.clock.fastForward(60000);
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByTestId('events')).toHaveText('[]');
  await expect(page.getByTestId('score')).toHaveText('0:0');
  await expect(saveButton(page)).toHaveText('Guardar evento');
  await expect(dialog(page)).not.toContainText('cinco segundos');
  await expect(dialog(page)).not.toContainText('automático');
  await saveButton(page).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.getByTestId('score')).toHaveText('1:0');
  const events = JSON.parse((await page.getByTestId('events').textContent())!);
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    period: 2,
    minute: 9,
    primaryPlayerId: 'a7',
    relatedPlayerId: 'a1',
    rawText: 'gol nuestro 7 1 penalti',
    metadata: { penalty: true },
  });
  await page.clock.runFor(10000);
  await page.reload();
  await expect(page.getByTestId('score')).toHaveText('1:0');
  expect(JSON.parse((await page.getByTestId('events').textContent())!)).toHaveLength(1);
});
test('pointer and keyboard do not save; editing preserves text and changes the intended event', async ({
  page,
}) => {
  await open(page);
  await dialog(page).getByText('Transcripción original', { exact: true }).click();
  await page.clock.runFor(6000);
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByTestId('events')).toHaveText('[]');
  await dialog(page).getByRole('button', { name: 'Editar', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await expect(editor).toBeVisible();
  await choose(editor, 'Evento', 'Tarjeta amarilla');
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.getByTestId('events')).toContainText('gol nuestro 7 1 penalti');
  await expect(page.getByTestId('score')).toHaveText('0:0');
  await page.getByRole('button', { name: 'Mostrar propuesta', exact: true }).click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Tab');
  await page.clock.runFor(6000);
  await expect(dialog(page)).toBeVisible();
  expect(JSON.parse((await page.getByTestId('events').textContent())!)).toHaveLength(1);
  await saveButton(page).press('Enter');
  await expect(dialog(page)).toHaveCount(0);
  expect(JSON.parse((await page.getByTestId('events').textContent())!)).toHaveLength(2);
});
test('an unresolved event waits and saves pending only on confirmation without inventing a goal', async ({
  page,
}) => {
  await open(page, '?text=por%20nuestro%207');
  await expect(dialog(page)).toContainText('Evento sin indicar');
  await expect(dialog(page)).toContainText('Se guardará pendiente');
  await expect(saveButton(page)).toHaveText('Guardar pendiente');
  await page.clock.fastForward(60000);
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByTestId('events')).toHaveText('[]');
  await saveButton(page).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.getByTestId('score')).toHaveText('0:0');
  expect(JSON.parse((await page.getByTestId('events').textContent())!)[0].type).toBeNull();
});
test('hiding never saves; X, Escape and discard cancel; persistence failures stay visible', async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(6000);
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByTestId('events')).toHaveText('[]');
  await page.evaluate(() =>
    Object.defineProperty(document, 'hidden', { configurable: true, value: false }),
  );
  await page.clock.fastForward(60000);
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByTestId('events')).toHaveText('[]');
  await dialog(page).getByRole('button', { name: 'Cerrar', exact: true }).click();
  for (const action of ['Escape', 'Descartar']) {
    await page.getByRole('button', { name: 'Mostrar propuesta', exact: true }).click();
    await expect(dialog(page)).toBeVisible();
    if (action === 'Escape') await page.keyboard.press('Escape');
    else await dialog(page).getByRole('button', { name: action, exact: true }).click();
    await expect(dialog(page)).toHaveCount(0);
    await page.clock.runFor(6000);
    await expect(page.getByTestId('events')).toHaveText('[]');
  }
  await page.goto('/tests/review/index.html?invalid');
  await page.getByRole('button', { name: 'Mostrar propuesta', exact: true }).click();
  await expect(dialog(page)).toBeVisible();
  await saveButton(page).click();
  await expect(dialog(page).getByRole('alert')).toContainText('El tiempo indicado aún no existe');
  await expect(page.getByTestId('events')).toHaveText('[]');
});
test('substitution shows outgoing/incoming and long names fit a short viewport', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 390 : 1000, height: 520 });
  await open(page, '?text=cambio%207%201&long');
  await dialog(page).getByText('Transcripción original', { exact: true }).click();
  await expect(dialog(page)).toContainText('Sale');
  await expect(dialog(page)).toContainText('Entra');
  await expect(dialog(page)).toContainText('Equipo por defecto');
  expect(await dialog(page).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  const button = saveButton(page);
  const box = await button.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(520);
  await page.screenshot({ path: info.outputPath('compact-review-short.png'), fullPage: true });
});
