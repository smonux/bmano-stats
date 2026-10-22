import { test, expect } from '@playwright/test';
import { reportFixture } from './fixtures/report';
test('new match recalls our last team only, also after reload', async ({ page }, info) => {
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
  await page.goto('/#/nuevo');
  const ours = page.getByRole('listbox', { name: 'Equipo 1 (nuestro)', exact: true });
  const rival = page.getByRole('listbox', { name: 'Equipo 2 (rival)', exact: true });
  await expect(ours.getByRole('option', { selected: true })).toHaveText('La Jota');
  await expect(rival.getByRole('option', { selected: true })).toHaveText('Seleccionar equipo');
  await page.reload();
  await expect(ours.getByRole('option', { selected: true })).toHaveText('La Jota');
  await expect(rival.getByRole('option', { selected: true })).toHaveText('Seleccionar equipo');
  await page.screenshot({ path: info.outputPath('our-last-team.png'), fullPage: true });
});
