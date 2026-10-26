import { expect, test } from '@playwright/test';
import { reportFixture } from './fixtures/report';
const labels = [
  'Gol',
  'Parada',
  'Fallo',
  'Pérdida',
  'Recuperación',
  'Penalti',
  '2 min',
  'Amarilla',
  'Roja',
  'Pasivo',
  'Infracción',
  'Cambio',
  'Nota',
];
for (const width of [320, 390])
  test(`direct three-column editor at ${width}px chooses our team and preserves explicit event saving`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 568 });
    await page.addInitScript(() => {
      localStorage.setItem('handball-language', 'es');
      localStorage.setItem('handball-welcome-v1', 'done');
    });
    const data = reportFixture();
    data.events = [];
    await page.goto('/#/ajustes');
    await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
      name: 'editor.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(data)),
    });
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.goto('/#/partidos/report-match');
    await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
    const editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
    const choices = editor.getByRole('group', { name: 'Evento', exact: true });
    await expect(choices.getByRole('button')).toHaveText(labels);
    expect(
      await choices
        .locator('.choice-options')
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length),
    ).toBe(3);
    expect(
      await choices.getByRole('button').evaluateAll((buttons) =>
        buttons.every((button) => {
          const rect = button.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44 && button.scrollWidth <= button.clientWidth;
        }),
      ),
    ).toBe(true);
    await expect(choices.getByRole('button', { pressed: true })).toHaveCount(0);
    await expect(
      editor
        .getByRole('group', { name: 'Equipo', exact: true })
        .getByRole('button', { name: 'La Jota', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(editor.getByRole('button', { name: 'Más acciones', exact: true })).toHaveCount(0);
    await expect(editor.locator('.editor-transcript')).toHaveCount(0);
    await expect(editor.getByLabel('Nota', { exact: true })).toBeVisible();
    await expect(editor.getByLabel('Nota', { exact: true })).not.toBeFocused();
    expect(
      await editor
        .getByLabel('Nota', { exact: true })
        .evaluate((el) => el.closest('details') === null),
    ).toBe(true);
    await expect(
      editor.getByRole('button', { name: 'Guardar pendiente', exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await expect(page.getByLabel('Marcador 0 a 0', { exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath('editor-grid.png') });
    await choices
      .getByRole('button', { name: 'Recuperación', exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      choices.getByRole('button', { name: 'Recuperación', exact: true }),
    ).toBeInViewport();
    await page.screenshot({ path: info.outputPath('editor-actions.png') });
    await choices.getByRole('button', { name: 'Gol', exact: true }).click();
    await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
    await expect(editor).toHaveCount(0);
    await expect(page.getByLabel('Marcador 1 a 0', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
    await expect(
      editor
        .getByRole('group', { name: 'Evento', exact: true })
        .getByRole('button', { pressed: true }),
    ).toHaveCount(0);
    await editor.getByRole('button', { name: 'Guardar pendiente', exact: true }).click();
    await expect(editor).toHaveCount(0);
    await expect(page.getByLabel('Marcador 1 a 0', { exact: true })).toBeVisible();
    await expect(page.locator('.event-card')).toHaveCount(2);
    await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
    await editor
      .getByRole('group', { name: 'Evento', exact: true })
      .getByRole('button', { name: 'Amarilla', exact: true })
      .click();
    await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
    await expect(editor).toHaveCount(0);
    await expect(page.locator('.event-card').first()).toContainText('Tarjeta amarilla');
    await expect(page.getByLabel('Marcador 1 a 0', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.locator('.event-card')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

test('pending edits retain an unassigned team and expose note and collapsed original transcript independently', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const data = reportFixture();
  const pending = data.events.find((event) => event.type === null)!;
  pending.note = 'Revisar al descanso.\nPreguntar al banquillo.';
  pending.rawText = 'acción sin identificar\n' + 'transcripción original muy larga '.repeat(20);
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'pending.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  const card = page.locator('[data-event-id="e9"]');
  await card.getByRole('button', { name: 'Completar', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Editar evento', exact: true });
  await expect(
    editor
      .getByRole('group', { name: 'Equipo', exact: true })
      .getByRole('button', { pressed: true }),
  ).toHaveCount(0);
  const note = editor.getByLabel('Nota', { exact: true });
  await expect(note).toHaveValue(pending.note);
  await note.scrollIntoViewIfNeeded();
  const transcript = editor.locator('.editor-transcript');
  const summary = transcript.locator('summary');
  await expect(transcript).not.toHaveAttribute('open');
  await expect(transcript.locator('.voice-transcript')).not.toBeVisible();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(transcript).toHaveAttribute('open', '');
  await expect(transcript.locator('.voice-transcript')).toHaveText('«' + pending.rawText + '»');
  expect(
    await transcript
      .locator('.voice-transcript')
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await expect(
    editor.getByRole('button', { name: 'Guardar pendiente', exact: true }),
  ).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: info.outputPath('editor-note-transcript.png') });
  await page.keyboard.press('Enter');
  await expect(transcript).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
  await note.fill(pending.note + '\nRevisado.');
  await editor.getByRole('button', { name: 'Guardar pendiente', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(card).toContainText('Equipo pendiente');
  await page.reload();
  await card.getByRole('button', { name: 'Completar', exact: true }).click();
  await expect(note).toHaveValue(pending.note + '\nRevisado.');
  await expect(
    editor
      .getByRole('group', { name: 'Equipo', exact: true })
      .getByRole('button', { pressed: true }),
  ).toHaveCount(0);
  await expect(transcript).not.toHaveAttribute('open');
  await expect(page.getByLabel('Marcador 3 a 2', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(editor).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'Completar', exact: true })).toBeFocused();
});
