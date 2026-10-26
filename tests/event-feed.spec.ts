import { expect, test } from '@playwright/test';
import { reportFixture } from './fixtures/report';

test('every card names its team in a full header and both teams share the approved icon and text layout', async ({
  page,
}, info) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'match.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(reportFixture())),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  const ours = page.locator('[data-event-id="e1"]');
  const rival = page.locator('[data-event-id="e2"]');
  await expect(ours.locator('.event-team-label')).toHaveText('Equipo 1');
  await expect(rival.locator('.event-team-label')).toHaveText('Equipo 2');
  await expect(ours.locator('.event-team-name')).toHaveText('La Jota');
  await expect(rival.locator('.event-team-name')).toContainText('Rival');
  await expect(ours.locator('.event-team')).toHaveCSS('background-color', 'rgb(255, 214, 0)');
  await expect(rival.locator('.event-team')).toHaveCSS('background-color', 'rgb(41, 45, 50)');
  await expect(ours).toHaveAccessibleName('La Jota Equipo 1 Gol');
  await expect(rival).toHaveAccessibleName('Rival Equipo 2 Gol');

  const ourIcon = (await ours.locator('.event-icon').boundingBox())!;
  const ourTitle = (await ours.locator('.event-title').boundingBox())!;
  expect(ourIcon.x + ourIcon.width).toBeLessThan(ourTitle.x);
  const rivalIcon = (await rival.locator('.event-icon').boundingBox())!;
  const rivalTitle = (await rival.locator('.event-title').boundingBox())!;
  expect(rivalIcon.x + rivalIcon.width).toBeLessThan(rivalTitle.x);
  for (const card of [ours, rival]) {
    await expect(card.locator('.event-copy')).toHaveCSS('text-align', 'start');
    await expect(card.locator('.event-icon')).toHaveCSS('width', '52px');
    await expect(card.locator('.event-icon')).toHaveCSS('height', '52px');
    await expect(card.locator('.event-symbol')).toHaveCSS('width', '34px');
    await expect(card.locator('.event-title')).toHaveCSS('font-size', '16px');
    await expect(card.locator('.event-player')).toHaveCSS('font-size', '16px');
    await expect(card.locator('time')).toHaveCSS('font-size', '14px');
    const time = (await card.locator('time').boundingBox())!;
    const copy = (await card.locator('.event-copy').boundingBox())!;
    expect(Math.abs(time.x + time.width - copy.x - copy.width)).toBeLessThanOrEqual(1);
  }
  await expect(page.locator('.event-feed')).not.toContainText('Registrado');
  const unassigned = page.locator('.event-card.unassigned');
  await expect(unassigned).toContainText('Equipo pendiente');
  await expect(unassigned.getByRole('img')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('event-perspective.png'), fullPage: true });

  const homeBounds = (await ours.boundingBox())!,
    awayBounds = (await rival.boundingBox())!;
  expect(Math.abs(homeBounds.x - awayBounds.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(homeBounds.width - awayBounds.width)).toBeLessThanOrEqual(1);
  const homeEdit = (await ours.getByRole('button', { name: 'Editar', exact: true }).boundingBox())!;
  const awayEdit = (await rival
    .getByRole('button', { name: 'Editar', exact: true })
    .boundingBox())!;
  const homeDelete = (await ours.locator('.delete-event').boundingBox())!;
  const awayDelete = (await rival.locator('.delete-event').boundingBox())!;
  expect(Math.abs(homeEdit.x - homeBounds.x - (awayEdit.x - awayBounds.x))).toBeLessThanOrEqual(3);
  expect(
    Math.abs(
      homeBounds.x +
        homeBounds.width -
        homeDelete.x -
        homeDelete.width -
        (awayBounds.x + awayBounds.width - awayDelete.x - awayDelete.width),
    ),
  ).toBeLessThanOrEqual(3);
  await rival.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('group', { name: 'Equipo', exact: true })
      .getByRole('button', { pressed: true }),
  ).toContainText('Rival');
});
