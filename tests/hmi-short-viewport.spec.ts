import { expect, test } from '@playwright/test';
import { nameKey } from '../src/domain/identity';
import { reportFixture } from './fixtures/report';
import { selectWheelOption } from './wheel-helpers';

test('short screens allow team selection by pointer with long names between the header and capture bar', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const backup = reportFixture();
  const ownName =
    'Club Balonmano La Jota de Zaragoza equipo femenino infantil con nombre completo para identificarlo';
  const rivalName =
    'Asociación Deportiva Rival de Balonmano equipo masculino cadete con un nombre igualmente extenso';
  backup.teams[0].name = ownName;
  backup.teams[1].name = rivalName;
  for (const team of backup.teams) team.nameKey = nameKey(team.name);
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'long-names.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await page.getByRole('tab', { name: 'Estadísticas', exact: true }).click();
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 568 });
  const statistics = page.locator('.statistics');
  const picker = statistics.getByRole('listbox', { name: 'Equipo', exact: true });
  await expect(picker.getByRole('option', { selected: true })).toHaveText(ownName);
  await picker.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('statistics-long-names.png'), fullPage: true });

  // Ordinary pointer activation must succeed; a forced click would hide the overlap bug.
  await selectWheelOption(picker, rivalName);
  await expect(picker.getByRole('option', { selected: true })).toHaveText(rivalName);
  await expect(
    statistics
      .locator('.metrics > div')
      .filter({ hasText: /^Goles/ })
      .locator('strong'),
  ).toHaveText('2');
  await page.screenshot({ path: info.outputPath('team-selection-touch.png') });
});
