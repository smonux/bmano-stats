import { expect, test } from '@playwright/test';
import { reportFixture } from '../fixtures/report';

async function nativeBack(page: import('@playwright/test').Page) {
  // Exercise the real handler/React dialog path; this is not an Android device event.
  await page.evaluate(async () => {
    const path = '/src/native/lifecycle.ts';
    const { handleNativeBack } = await import(/* @vite-ignore */ path);
    handleNativeBack(true);
  });
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
});
test('native back handler cancels restore through the existing dialog without importing data', async ({
  page,
}) => {
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(reportFixture())),
  });
  await expect(page.getByRole('dialog', { name: 'Restaurar copia' })).toBeVisible();
  await nativeBack(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/ajustes$/);
  await page.goto('/#/partidos');
  await expect(page.locator('.match-card')).toHaveCount(0);
});
test('native back handler closes the menu and restores focus without changing the page', async ({
  page,
}) => {
  await page.goto('/#/ajustes');
  const menu = page.getByRole('button', { name: 'Abrir menú', exact: true });
  await menu.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await nativeBack(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(menu).toBeFocused();
  await expect(page).toHaveURL(/#\/ajustes$/);
});
