import { expect, test } from '@playwright/test';
import { reportFixture } from './fixtures/report';

test('opponent events mirror their title and icon and both teams are explicitly identified', async ({
  page,
}, info) => {
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
  const ours = page.locator('.event-card.home').filter({ hasText: 'T1 · 3′' });
  const rival = page.locator('.event-card.away').filter({ hasText: 'T1 · 1′' });
  await expect(ours.getByRole('img', { name: 'Equipo 1 (nuestro)', exact: true })).toHaveText('1');
  await expect(rival.getByRole('img', { name: 'Equipo 2 (rival)', exact: true })).toHaveText('2');
  await expect(ours.locator('.event-team-name')).toHaveText('La Jota');
  await expect(rival.locator('.event-team-name')).toContainText('Rival');

  const ourIcon = (await ours.locator('.event-icon').boundingBox())!;
  const ourTitle = (await ours.locator('.event-title').boundingBox())!;
  expect(ourIcon.x + ourIcon.width).toBeLessThan(ourTitle.x);
  const rivalIcon = (await rival.locator('.event-icon').boundingBox())!;
  const rivalTitle = (await rival.locator('.event-title').boundingBox())!;
  const rivalTime = (await rival.locator('time').boundingBox())!;
  expect(rivalTime.x + rivalTime.width).toBeLessThan(rivalTitle.x);
  expect(rivalTitle.x + rivalTitle.width).toBeLessThan(rivalIcon.x);
  await expect(rival.locator('.event-copy')).toHaveCSS('text-align', 'right');
  const unassigned = page.locator('.event-card.unassigned');
  await expect(unassigned).toContainText('Equipo pendiente');
  await expect(unassigned.getByRole('img')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('event-perspective.png'), fullPage: true });

  await rival.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('group', { name: 'Equipo', exact: true })
      .getByRole('button', { pressed: true }),
  ).toContainText('Rival');
});
