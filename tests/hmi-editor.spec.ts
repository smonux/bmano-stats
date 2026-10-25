import { expect, test, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { choose, editContext } from './editor-helpers';
import { readShirtNumber, selectShirtNumber } from './wheel-helpers';
import { validateBackup } from '../src/domain/backup';
import { nameKey } from '../src/domain/identity';

async function open(page: Page, rosterSize = 7, longNames = false) {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const backup = reportFixture();
  backup.events = [];
  backup.players = backup.players.filter((player) => player.isUnknown);
  for (const teamId of ['a', 'b'])
    for (let index = 0; index < rosterSize; index++)
      backup.players.push({
        id: `${teamId}-${index}`,
        teamId,
        dorsal: index,
        name: longNames
          ? `NombreCompleto${index} ${'apellido '.repeat(15)}`.slice(0, 100)
          : `Persona ${index}`,
        isUnknown: false,
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null,
      });
  if (longNames)
    for (const team of backup.teams) {
      team.name = (team.id + ' ' + 'Nombre de equipo '.repeat(6)).slice(0, 100).trim();
      team.nameKey = nameKey(team.name);
    }
  validateBackup(backup);
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'editor.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  return backup;
}

test('manual starts neutral and a goal without a shirt takes four activations without scrolling', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const data = await open(page);
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog');
  await expect(editor.locator('[aria-pressed="true"]')).toHaveCount(0);
  await expect(editor.locator('.draft-issues')).toContainText('Selecciona un evento');
  await expect(editor.locator('.draft-issues')).toContainText('Selecciona un equipo');
  const team = editor
    .getByRole('group', { name: 'Equipo', exact: true })
    .getByRole('button', { name: data.teams[0].name, exact: true });
  await expect(team).toBeInViewport({ ratio: 1 });
  await team.click();
  const goal = editor.getByRole('button', { name: 'Gol', exact: true });
  await expect(goal).toBeInViewport({ ratio: 1 });
  await goal.click();
  await expect(editor.locator('.event-editor-fields')).toHaveJSProperty('scrollTop', 0);
  await expect(
    editor
      .getByRole('group', { name: 'Jugador principal', exact: true })
      .getByRole('button', { pressed: true }),
  ).toHaveText('Sin identificar');
  await page.screenshot({ path: info.outputPath('four-activations.png') });
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.getByLabel('Marcador 1 a 0')).toBeVisible();
  await page.reload();
  await expect(page.locator('.event-card')).toContainText('sin identificar');
});

for (const count of [0, 7, 30])
  test(`roster ${count}: long names, zero and 99 remain usable and team changes clear participants`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 320, height: 568 });
    const data = await open(page, count, true);
    await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
    const editor = page.getByRole('dialog');
    await choose(editor, 'Equipo', data.teams[0].name);
    await choose(editor, 'Evento', 'Gol');
    const group = editor.getByRole('group', { name: 'Jugador principal', exact: true });
    await expect(group.getByRole('button')).toHaveCount(count + 2);
    if (count) {
      const zero = group.getByRole('button', {
        name: '#0 ' + data.players.find((p) => p.id === 'a-0')!.name,
        exact: true,
      });
      await zero.focus();
      await zero.press('Enter');
      await expect(editor.locator('.draft-summary')).toContainText(
        data.players.find((p) => p.id === 'a-0')!.name,
      );
      await expect(group.locator('.player-short-name').first()).toHaveCSS('font-size', '13px');
    }
    if (count === 30) {
      await choose(
        editor,
        'Jugador principal',
        '#10 ' + data.players.find((player) => player.id === 'a-10')!.name,
      );
      expect(await readShirtNumber(editor, 'Dorsal principal')).toBe('10');
    }
    await selectShirtNumber(editor, 'Dorsal principal', '99');
    expect(await readShirtNumber(editor, 'Dorsal principal')).toBe('99');
    await choose(editor, 'Equipo', data.teams[1].name);
    expect(await readShirtNumber(editor, 'Dorsal principal')).toBe('');
    await expect(editor.getByRole('group', { name: 'Dorsal principal', exact: true })).toHaveCount(
      0,
    );
    await choose(editor, 'Evento', 'Pasivo');
    await expect(editor.locator('.participant')).toHaveCount(0);
    await expect(editor.getByRole('checkbox')).toHaveCount(0);
    await choose(editor, 'Evento', 'Nota');
    await expect(editor.getByRole('group', { name: 'Equipo', exact: true })).toHaveCount(0);
    await expect(editor.getByLabel('Nota', { exact: true })).toBeVisible();
    await editor.getByLabel('Nota', { exact: true }).fill('Recordar durante el descanso');
    await expect(
      editor.getByRole('button', { name: 'Guardar evento', exact: true }),
    ).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`roster-${count}.png`) });
  });

test('substitution summary identifies both participants, permits unidentified and never assumes a lineup', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog');
  await choose(editor, 'Equipo', 'La Jota');
  await choose(editor, 'Evento', 'Sustitución');
  await expect(editor.getByRole('button', { name: 'Guardar evento', exact: true })).toBeEnabled();
  await choose(editor, 'Jugador principal', '#0 Persona 0');
  await choose(editor, 'Jugador relacionado', '#0 Persona 0');
  await expect(editor.locator('.draft-issues')).toContainText('deben ser distintos');
  await choose(editor, 'Jugador relacionado', '#1 Persona 1');
  await expect(editor.locator('.draft-summary')).toContainText('Sale: #0 Persona 0');
  await expect(editor.locator('.draft-summary')).toContainText('Entra: #1 Persona 1');
  await editContext(editor);
  await editor.getByLabel('Minuto', { exact: true }).fill('6');
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.event-card')).toContainText('Sale #0 Persona 0 → Entra #1 Persona 1');
});

test('captured minute survives the running clock and rapid repeated submit creates one event', async ({
  page,
}) => {
  await page.clock.install();
  await open(page);
  await page
    .locator('.clock-actions')
    .getByRole('button', { name: 'Reanudar', exact: true })
    .click();
  await expect(
    page.locator('.clock-actions').getByRole('button', { name: 'Parar', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog');
  await choose(editor, 'Equipo', 'La Jota');
  await choose(editor, 'Evento', 'Gol');
  await page.clock.runFor(70000);
  await expect(editor.locator('.event-context > button')).toContainText('9′');
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(editor).toHaveCount(0);
  await expect(page.locator('.event-card')).toHaveCount(1);
  await expect(page.locator('.event-card time')).toHaveText('T2 · 9′');
  await expect(page.getByLabel('Reloj del partido', { exact: true })).toHaveText('10:10');
  await page.reload();
  await expect(page.getByLabel('Marcador 1 a 0', { exact: true })).toBeVisible();
  await expect(page.locator('.event-card')).toHaveCount(1);
});
