import { expect, test } from '@playwright/test';
import { reportFixture } from './fixtures/report';

test('active matches precede navigation and settings distinguish local backups from sharing', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  await page.goto('/#/ajustes');
  await expect(page.getByRole('heading', { name: 'Datos y copias', exact: true })).toBeVisible();
  await expect(page.getByText(/Borrar los datos del navegador elimina/)).toBeVisible();
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'data.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(reportFixture())),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia ZIP', exact: true }).click();
  await download;
  await expect(page.getByText(/Descarga iniciada/)).toBeVisible();
  await page.goto('/');
  const match = page.locator('.match-card').first(),
    navigation = page.locator('.dashboard-grid');
  expect((await match.boundingBox())!.y).toBeLessThan((await navigation.boundingBox())!.y);
  await page.screenshot({ path: info.outputPath('active-first.png'), fullPage: true });
  await match.click();
  await expect(page.locator('.scoreboard')).toBeVisible();
  await page.goto('/#/ajustes');
  await expect(page.getByRole('button', { name: 'Ver bienvenida', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Practicar voz', exact: true }).click();
  const guide = page.locator('.voice-practice');
  await expect(
    guide.getByRole('heading', { name: 'Registra el partido por voz y gestos.' }),
  ).toBeVisible();
  await guide.getByRole('button', { name: 'Continuar a la práctica', exact: true }).click();
  await expect(guide.getByRole('heading', { name: 'Una jugada. Cuatro piezas.' })).toBeVisible();
  await expect(guide.locator('.practice-grammar li')).toHaveCount(4);
  await page.screenshot({ path: info.outputPath('recoverable-guide.png') });
  await guide.getByRole('button', { name: 'Salir de la práctica', exact: true }).press('Enter');
  await expect(guide).toHaveCount(0);
});
