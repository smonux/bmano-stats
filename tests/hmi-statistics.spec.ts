import { expect, test, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { selectWheelOption } from './wheel-helpers';
import { nameKey } from '../src/domain/identity';

async function expectTeam(page: Page, team: string, goals: string) {
  const statistics = page.locator('.statistics');
  await expect(
    statistics
      .getByRole('listbox', { name: 'Equipo', exact: true })
      .getByRole('option', { selected: true }),
  ).toHaveText(team);
  await expect(statistics.getByRole('heading', { name: team, exact: true })).toBeVisible();
  await expect(
    statistics
      .locator('.metrics > div')
      .filter({ hasText: /^Goles/ })
      .locator('strong'),
  ).toHaveText(goals);
}

test('match statistics start with our team regardless of catalogue order and retain explicit choices on updates', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const backup = reportFixture();
  // IndexedDB reads by ID, not insertion order: our team b must follow opponent a.
  backup.teams[0].name = 'Contrario';
  backup.teams[1].name = 'La Jota';
  for (const team of backup.teams) team.nameKey = nameKey(team.name);
  backup.matches[0].localTeamId = 'b';
  backup.matches[0].visitorTeamId = 'a';
  const secondMatch = {
    ...backup.matches[0],
    id: 'second-match',
    localTeamId: 'a',
    visitorTeamId: 'b',
  };
  backup.matches.push(secondMatch);
  backup.events.push({
    ...backup.events.find((event) => event.id === 'e1')!,
    id: 'second-goal',
    matchId: secondMatch.id,
  });
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'statistics.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await page.getByRole('tab', { name: 'Estadísticas', exact: true }).click();
  await expectTeam(page, 'La Jota', '2');
  await page.screenshot({ path: info.outputPath('statistics-own-team.png'), fullPage: true });

  const teamPicker = page
    .locator('.statistics')
    .getByRole('listbox', { name: 'Equipo', exact: true });
  await expect(teamPicker.getByRole('option')).toHaveText(['Contrario', 'La Jota']);
  await teamPicker.focus();
  await teamPicker.press('Home');
  await expectTeam(page, 'Contrario', '3');
  await page
    .locator('.clock-actions')
    .getByRole('button', { name: 'Reanudar', exact: true })
    .click();
  await expect(
    page.locator('.clock-actions').getByRole('button', { name: 'Parar', exact: true }),
  ).toBeVisible();
  await expectTeam(page, 'Contrario', '3');

  await page.goto('/#/partidos/second-match');
  await page.getByRole('tab', { name: 'Estadísticas', exact: true }).click();
  await expectTeam(page, 'Contrario', '1');
  await page.goto('/#/partidos/report-match');
  await page.getByRole('tab', { name: 'Estadísticas', exact: true }).click();
  await expectTeam(page, 'La Jota', '2');

  // Global statistics still allow a valid catalogue selection and a specific match.
  await page.goto('/#/estadisticas');
  await selectWheelOption(page.getByRole('listbox', { name: 'Equipo', exact: true }), 'La Jota');
  await selectWheelOption(
    page.getByRole('listbox', { name: 'Partido', exact: true }),
    '2026-10-16 · La Jota — Contrario',
  );
  await expectTeam(page, 'La Jota', '2');
  await page.reload();
  await expectTeam(page, 'Contrario', '4'); // The global default remains catalogue order, all matches.
});
