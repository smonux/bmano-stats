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

test('event wheels keep team, period, players and infraction consistent and save stays visible', async ({
  page,
}, info) => {
  await restoreMatch(page, false);
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog');
  const wheel = (label: string) => editor.getByRole('listbox', { name: label, exact: true });
  await expect(editor.getByRole('combobox')).toHaveCount(0);
  await expect(wheel('Jugador principal')).toHaveAttribute('aria-disabled', 'true');
  await selectWheelOption(wheel('Evento'), 'Gol');
  await selectWheelOption(wheel('Equipo'), 'La Jota');
  await selectWheelOption(wheel('Jugador principal'), '#7 Ana Łukasz');
  await selectWheelOption(wheel('Jugador relacionado'), '#1 Íker');
  await expect(editor.getByLabel('Dorsal principal', { exact: true })).toHaveValue('7');
  await expect(editor.getByLabel('Dorsal relacionado', { exact: true })).toHaveValue('1');

  // Selecting the current team again must not erase the chosen participants.
  await selectWheelOption(wheel('Equipo'), 'La Jota');
  await expect(editor.getByLabel('Dorsal principal', { exact: true })).toHaveValue('7');
  await selectWheelOption(wheel('Equipo'), 'Rival');
  await expect(editor.getByLabel('Dorsal principal', { exact: true })).toHaveValue('');
  await expect(editor.getByLabel('Dorsal relacionado', { exact: true })).toHaveValue('');
  await expect(
    wheel('Jugador principal').getByRole('option', { name: '#7 Ana Łukasz' }),
  ).toHaveCount(0);
  await editor.getByLabel('Dorsal principal', { exact: true }).fill('99');
  await expect(wheel('Jugador principal').getByRole('option', { selected: true })).toHaveText(
    '#99 · Dorsal nuevo',
  );
  await selectWheelOption(wheel('Jugador principal'), '#9 Zoë');

  await wheel('Tiempo').focus();
  await wheel('Tiempo').press('Home');
  await expect(wheel('Tiempo').getByRole('option', { selected: true })).toHaveText('Tiempo 1');

  // Native scroll/snap commits the centered option, just as a finger swipe does.
  await wheel('Evento').evaluate((element) => {
    const options = [...element.querySelectorAll('[role=option]')];
    const index = options.findIndex((option) => option.textContent === 'Infracción');
    element.scrollTo({ top: index * options[0].getBoundingClientRect().height });
  });
  await expect(wheel('Evento').getByRole('option', { selected: true })).toHaveText('Infracción');
  await expect(wheel('Jugador relacionado')).toHaveAttribute('aria-disabled', 'true');
  await wheel('Jugador relacionado').press('ArrowDown');
  await expect(editor.getByLabel('Dorsal relacionado', { exact: true })).toHaveValue('');
  await wheel('Tipo de infracción').focus();
  await wheel('Tipo de infracción').press('End');
  await expect(wheel('Tipo de infracción').getByRole('option', { selected: true })).toHaveText(
    'Pisando',
  );
  await wheel('Tipo de infracción').press('ArrowUp');
  await expect(wheel('Tipo de infracción').getByRole('option', { selected: true })).toHaveText(
    'Dobles',
  );

  const save = editor.getByRole('button', { name: 'Guardar evento', exact: true });
  await editor.locator('.event-editor-fields').evaluate((element) => element.scrollTo(0, 0));
  await expect(save).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: info.outputPath('event-wheels.png'), fullPage: true });
  await save.click();
  const card = page.locator('.event-card');
  await expect(card).toContainText('Rival · #9 Zoë');
  await expect(card).toContainText('T1');
  await expect(card).toContainText('Dobles');
  await page.reload();
  await card.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(wheel('Tiempo').getByRole('option', { selected: true })).toHaveText('Tiempo 1');
  await expect(wheel('Tipo de infracción').getByRole('option', { selected: true })).toHaveText(
    'Dobles',
  );
});

test('catalogue, statistics and exclusion team choices use wheels; original transcript stays in additional information', async ({
  page,
}, info) => {
  await restoreMatch(page, true);
  const spokenGoal = page.locator('.event-card').filter({ hasText: 'T1 · 3′' });
  await spokenGoal.getByRole('button', { name: 'Editar', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Editar evento' });
  const additional = editor.getByRole('region', { name: 'Información adicional (opcional)' });
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

  await page
    .getByRole('group', { name: 'Exclusión 2', exact: true })
    .getByRole('button', { name: 'Activar', exact: true })
    .click();
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
