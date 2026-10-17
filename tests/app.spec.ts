import { selectShirtNumber } from './wheel-helpers';
import { selectWheelOption } from './wheel-helpers';
import { serveModels, prepareMatchVoice, selectEvent } from './voice-helpers';
import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, 'randomUUID', { configurable: true, value: undefined });
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
});
test('manual match lifecycle persists and works offline', async ({ page, context }, testInfo) => {
  test.setTimeout(90000);
  await serveModels(context);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: /Nuevo partido/ }).click();
  for (const label of ['Equipo 1 (nuestro)', 'Equipo 2 (rival)']) {
    const group = page.getByRole('group', { name: label, exact: true });
    await group.getByRole('button', { name: 'Nuevo', exact: true }).click();
    await page
      .getByLabel(label, { exact: true })
      .fill(label === 'Equipo 1 (nuestro)' ? 'Águilas' : 'Leones');
  }
  await expect(page.getByRole('button', { name: 'Iniciar partido' })).toBeDisabled();
  await prepareMatchVoice(page);
  await page.getByRole('button', { name: 'Iniciar partido' }).click();
  await expect(page.getByLabel('Marcador 0 a 0')).toBeVisible();
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('combobox', { name: 'Evento', exact: true })).toHaveCount(0);
  const wheel = dialog.getByRole('listbox', { name: 'Evento', exact: true });
  await wheel.focus();
  await wheel.press('ArrowDown');
  await expect(wheel.getByRole('option', { name: 'Gol', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await wheel.press('ArrowDown');
  await expect(wheel.getByRole('option', { name: 'Parada', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await selectEvent(page, 'Gol');
  await selectWheelOption(dialog.getByRole('listbox', { name: 'Equipo', exact: true }), 'Águilas');
  await dialog.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(page.getByLabel('Marcador 1 a 0')).toBeVisible();
  await expect(page.getByText('Registrado · sin identificar', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  dialog = page.getByRole('dialog');
  await selectShirtNumber(dialog, 'Dorsal principal', '7');
  await dialog.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(page.getByText('Águilas · #7', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar pendiente' }).click();
  await expect(page.getByRole('button', { name: '1 pendientes' })).toBeVisible();
  await expect(page.getByLabel('Marcador 1 a 0')).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo tiempo' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Tiempo 2', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Marcador 1 a 0')).toBeVisible();
  await page.getByRole('button', { name: 'Finalizar partido', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByRole('heading', { name: 'Detalle del partido' })).toBeVisible();
  await page
    .locator('article')
    .filter({ hasText: 'Águilas · #7' })
    .getByRole('button', { name: 'Editar', exact: true })
    .click();
  await page.getByRole('dialog').getByLabel('Minuto', { exact: true }).fill('5');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Guardar evento', exact: true })
    .click();
  await expect(page.locator('body')).not.toHaveText(/Error inesperado/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('partido.png'), fullPage: true });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await context.route('**/*', (route) => route.abort('internetdisconnected'));
  await page.reload();
  await expect(page.getByLabel('Marcador 1 a 0')).toBeVisible();
  // Verify connectivity with a real request, rather than the browser's onLine hint.
  expect(
    await page.evaluate(async () => {
      try {
        await fetch('/__offline_probe', { cache: 'no-store' });
        return false;
      } catch {
        return true;
      }
    }),
  ).toBe(true);
  expect(errors).toEqual([]);
});
