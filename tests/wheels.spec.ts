import { choose, editContext, editNote } from './editor-helpers';
import { selectShirtNumber, readShirtNumber } from './wheel-helpers';
import { expect, test, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { selectWheelOption } from './wheel-helpers';

async function restoreMatch(page: Page, includeEvents: boolean) {
  const backup = reportFixture();
  if (!includeEvents) {
    backup.events = [];
  }
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'match.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
});

test('direct event choices keep teams, players, period and infraction consistent', async ({
  page,
}, info) => {
  await restoreMatch(page, false);
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog');
  await expect(editor.getByRole('group', { name: 'Jugador principal', exact: true })).toHaveCount(
    0,
  );
  await choose(editor, 'Evento', 'Gol');
  await choose(editor, 'Equipo', 'La Jota');
  await choose(editor, 'Jugador principal', '#7 Ana Łukasz');
  await choose(editor, 'Jugador relacionado', '#1 Íker');
  await choose(editor, 'Equipo', 'La Jota');
  expect(await readShirtNumber(editor, 'Dorsal principal')).toBe('7');
  await choose(editor, 'Equipo', 'Rival');
  expect(await readShirtNumber(editor, 'Dorsal principal')).toBe('');
  expect(await readShirtNumber(editor, 'Dorsal relacionado')).toBe('');
  await expect(editor.getByRole('button', { name: '#7 Ana Łukasz', exact: true })).toHaveCount(0);
  await selectShirtNumber(editor, 'Dorsal principal', '99');
  await expect(editor.locator('.participant-selection').first()).toContainText('#99');
  await choose(editor, 'Jugador principal', '#9 Zoë');
  await editContext(editor);
  const period = editor.getByRole('listbox', { name: 'Tiempo', exact: true });
  await period.focus();
  await period.press('Home');
  await expect(period.getByRole('option', { selected: true })).toHaveText('Tiempo 1');
  await choose(editor, 'Evento', 'Infracción');
  await expect(editor.locator('.related-participant')).toHaveCount(0);
  await choose(editor, 'Tipo de infracción', 'Pisando');
  const doubles = editor.getByRole('button', { name: 'Dobles', exact: true });
  await doubles.focus();
  await doubles.press('Enter');
  await expect(doubles).toHaveAttribute('aria-pressed', 'true');
  const save = editor.getByRole('button', { name: 'Guardar evento', exact: true });
  await expect(save).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: info.outputPath('direct-choices.png') });
  await save.click();
  await expect(editor).toHaveCount(0);
  const card = page.locator('.event-card');
  await expect(card).toContainText('Rival · #9 Zoë');
  await expect(card).toContainText('T1');
  await expect(card).toContainText('Dobles');
  await page.reload();
  await card.getByRole('button', { name: 'Editar', exact: true }).click();
  await editContext(editor);
  await expect(period.getByRole('option', { selected: true })).toHaveText('Tiempo 1');
  await expect(editor.getByRole('button', { name: 'Dobles', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('catalogue, statistics and exclusion team choices use wheels; original transcript stays in additional information', async ({
  page,
}, info) => {
  await restoreMatch(page, true);
  const spokenGoal = page.locator('.event-card').filter({ hasText: 'T1 · 3′' });
  await spokenGoal.getByRole('button', { name: 'Editar', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Editar evento' });
  const additional = editor.locator('.event-additional');
  await editNote(editor);
  await expect(additional.getByText('Transcripción original', { exact: true })).toHaveCount(1);
  await expect(additional).toContainText('«Gol nuestro dorsal siete»');
  await additional
    .getByRole('textbox', { name: 'Nota', exact: true })
    .fill('Corregido durante el descanso');
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await page.reload();
  await spokenGoal.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(additional).toContainText('«Gol nuestro dorsal siete»');
  await expect(additional.getByRole('textbox', { name: 'Nota', exact: true })).toHaveValue(
    'Corregido durante el descanso',
  );
  await additional.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('additional-transcript.png'), fullPage: true });
  await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();

  await page.getByRole('button', { name: 'Iniciar contador', exact: true }).click();
  const exclusion = page.getByRole('dialog', { name: 'Exclusión 2' });
  await selectWheelOption(exclusion.getByRole('listbox', { name: 'Equipo', exact: true }), 'Rival');
  await exclusion.getByRole('button', { name: 'Activar · 02:00', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Exclusión 2', exact: true })).toContainText(
    '2 · —',
  );

  await page.goto('/#/estadisticas');
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await selectWheelOption(page.getByRole('listbox', { name: 'Equipo', exact: true }), 'Rival');
  await selectWheelOption(
    page.getByRole('listbox', { name: 'Partido', exact: true }),
    '2026-10-16 · La Jota — Rival',
  );
  await expect(
    page
      .locator('.metrics > div')
      .filter({ hasText: /^Goles/ })
      .locator('strong'),
  ).toHaveText('2');

  await page.goto('/#/nuevo');
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await selectWheelOption(
    page.getByRole('listbox', { name: 'Equipo 1 (nuestro)', exact: true }),
    'La Jota',
  );
  await selectWheelOption(
    page.getByRole('listbox', { name: 'Equipo 2 (rival)', exact: true }),
    'Rival',
  );
  await expect(
    page
      .getByRole('listbox', { name: 'Idioma de voz', exact: true })
      .getByRole('option', { selected: true }),
  ).toHaveText('Elige el idioma de voz');
  await expect(page.getByRole('button', { name: 'Iniciar partido', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('team-wheels.png'), fullPage: true });
});
