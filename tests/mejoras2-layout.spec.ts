import { expect, test } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { nameKey } from '../src/domain/identity';
test('compact match heading, readable full names and direct deletion preserve data and focus', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const data = reportFixture();
  for (const team of data.teams) {
    team.name = (team.id + ' Nombre de equipo muy largo '.repeat(5)).slice(0, 100).trim();
    team.nameKey = nameKey(team.name);
  }
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'layout.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 390, height: 664 });
  await expect(page.locator('.match-page-title h1')).toContainText('2026');
  await expect(page.locator('.match-page-title')).not.toContainText('Partido en curso');
  await expect(
    page.getByText('El contador no añade una exclusión al registro.', { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('.match-secondary-actions')).not.toContainText(
    'Nombres de los equipos',
  );
  const button = page.locator('.team-name-button').first();
  await button.focus();
  await button.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Nombres de los equipos', exact: true });
  await expect(dialog.locator('dd')).toHaveText(data.teams.map((team) => team.name));
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(button).toBeFocused();
  await page.screenshot({ path: info.outputPath('compact-layout.png') });
  await page.getByRole('button', { name: 'Eliminar partido', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Eliminar partido', exact: true });
  await expect(confirm).toContainText(data.teams[0].name);
  await expect(confirm).toContainText(data.teams[1].name);
  await confirm.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(confirm).toHaveCount(0);
  await expect(page.locator('.event-card')).toHaveCount(9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
