import { expect, test, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { selectWheelOption } from './wheel-helpers';
import { nameKey } from '../src/domain/identity';

async function expectTeam(page: Page, team: string, goals: string) {
  const statistics = page.locator('.statistics');
  if (await statistics.getByRole('group', { name: 'Equipo', exact: true }).count()) {
    await expect(statistics.getByRole('button', { name: team, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  } else {
    await expect(
      statistics
        .getByRole('listbox', { name: 'Equipo', exact: true })
        .getByRole('option', { selected: true }),
    ).toHaveText(team);
  }
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
    .getByRole('group', { name: 'Equipo', exact: true });
  await expect(teamPicker.getByRole('button')).toHaveText(['Equipo 1La Jota', 'Equipo 2Contrario']);
  await teamPicker.getByRole('button', { name: 'Contrario', exact: true }).focus();
  await page.keyboard.press('Enter');
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

test('efficacy explains its sample and each period exposes equivalent chart data', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const backup = reportFixture();
  backup.teams[1].name =
    'Rival con un nombre muy largo para comprobar la tabla y la selección del equipo contrario';
  backup.teams[1].nameKey = nameKey(backup.teams[1].name);
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'stats.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await page.getByRole('tab', { name: 'Estadísticas', exact: true }).click();
  const statistics = page.locator('.statistics');
  await expect(statistics.getByText('3 / 3 · goles / lanzamientos', { exact: true })).toBeVisible();
  const details = statistics.locator('.chart-data');
  await expect(details).toHaveCount(2);
  for (const detail of await details.all()) {
    await expect(detail).not.toHaveAttribute('open');
    await detail.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(detail.getByRole('table')).toBeVisible();
  }
  await expect(details.nth(0).locator('tr[data-kind=goal]')).toHaveCount(3);
  await expect(details.nth(1).locator('tr[data-kind=goal]')).toHaveCount(2);
  await expect(details.nth(1).locator('tr[data-kind=start] td:last-child')).toHaveText(['2', '1']);
  await expect(details.nth(1).locator('tr[data-kind=goal] th')).toHaveText(['2′', '4′']);
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 568 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await details.nth(1).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('table-per-period.png') });
  await statistics.getByRole('tab', { name: 'Jugadores', exact: true }).click();
  await statistics.getByRole('button', { name: /Íker/ }).click();
  await expect(statistics.getByText('Sin lanzamientos registrados', { exact: true })).toBeVisible();
  await expect(
    statistics.locator('.metrics > div').filter({ hasText: 'Eficacia de tiro' }).locator('strong'),
  ).toHaveText('—');
});
