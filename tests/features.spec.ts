import { serveModels, prepareMatchVoice } from './voice-helpers';
import { test, expect } from '@playwright/test';
async function spanish(page: import('@playwright/test').Page, skip = true) {
  await page.addInitScript(
    ({ skip }) => {
      if (!localStorage.getItem('handball-language')) {
        localStorage.setItem('handball-language', 'es');
      }
      if (skip) {
        localStorage.setItem('handball-welcome-v1', 'done');
      }
    },
    { skip },
  );
}
async function match(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Nuevo partido/ }).click();
  for (const [label, name] of [
    ['Equipo 1 (nuestro)', 'La Jota'],
    ['Equipo 2 (rival)', 'Rival'],
  ]) {
    const group = page.getByRole('group', { name: label, exact: true });
    await group.getByRole('button', { name: 'Nuevo', exact: true }).click();
    await page.getByLabel(label, { exact: true }).fill(name);
  }
  await prepareMatchVoice(page);
  await page.getByRole('button', { name: 'Iniciar partido' }).click();
  await expect(page.getByLabel('Marcador 0 a 0')).toBeVisible();
}
test('first-use gallery changes language, persists completion and reopens from settings', async ({
  page,
}, info) => {
  await spanish(page, false);
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Idioma', { exact: true }).selectOption('en');
  await expect(
    dialog.getByRole('heading', { name: 'Watch the match. Describe the play.' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.screenshot({ path: info.outputPath('welcome-en.png') });
  for (let i = 0; i < 4; i++) {
    await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await expect(dialog.getByText('Track the two minutes', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Get started', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Every play counts.' })).toBeVisible();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Settings and backups' }).click();
  await page.getByRole('button', { name: 'View welcome guide' }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Skip guide' }).click();
  for (const [code, label] of [
    ['es', 'Tus datos'],
    ['de', 'Deine Daten'],
    ['fr', 'Vos données'],
    ['it', 'I tuoi dati'],
    ['nl', 'Je gegevens'],
    ['pl', 'Twoje dane'],
  ]) {
    await page.locator('.language-picker select').selectOption(code);
    await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
test('three independent suspension timers persist, pause with match clock and signal expiry', async ({
  page,
  context,
}, info) => {
  test.setTimeout(90000);
  await serveModels(context);
  await spanish(page);
  await page.clock.install({ time: new Date('2026-10-16T12:00:00Z') });
  await match(page);
  for (let i = 1; i <= 3; i++) {
    await page
      .getByRole('group', { name: `Exclusión ${i}`, exact: true })
      .getByRole('button', { name: 'Activar', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    if (i < 3) {
      await dialog.getByLabel('Dorsal (opcional)', { exact: true }).fill(String(i + 6));
    }
    await dialog.getByRole('button', { name: /Activar/ }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('group', { name: `Exclusión ${i}`, exact: true })).toContainText(
      i < 3 ? `#${i + 6}` : '—',
    );
  }
  await page.reload();
  const slots = page.locator('.exclusion-timer');
  await expect(slots).toHaveCount(3);
  await expect(slots.nth(0)).toContainText('#7');
  expect((await page.locator('.match-header').boundingBox())!.height).toBeLessThan(260);
  expect((await slots.nth(0).boundingBox())!.height).toBeLessThan(72);
  await page.clock.fastForward(30000);
  await expect(page.getByRole('timer', { name: 'Reloj del partido' })).toHaveText(/^00:3[0-9]$/);
  await expect(slots.nth(0).locator('.timer-digits')).toHaveText(/^01:(2[5-9]|30)$/);
  await page.locator('.clock-actions').getByRole('button', { name: 'Parar', exact: true }).click();
  await expect(
    page.locator('.clock-actions').getByRole('button', { name: 'Reanudar', exact: true }),
  ).toBeVisible();
  const paused = await slots.nth(0).locator('.timer-digits').textContent();
  await page.clock.fastForward(60000);
  await expect(slots.nth(0).locator('.timer-digits')).toHaveText(paused!);
  await slots.nth(1).getByRole('button', { name: 'Parar', exact: true }).click();
  await expect(slots.nth(1).getByRole('button', { name: 'Reanudar', exact: true })).toBeVisible();
  const individuallyPaused = await slots.nth(1).locator('.timer-digits').textContent();
  await page
    .locator('.clock-actions')
    .getByRole('button', { name: 'Reanudar', exact: true })
    .click();
  await expect(
    page.locator('.clock-actions').getByRole('button', { name: 'Parar', exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(121000);
  await expect(slots.nth(0)).toContainText('Puede volver');
  await expect(slots.nth(2)).toContainText('Puede volver');
  await expect(slots.nth(1).locator('.timer-digits')).toHaveText(individuallyPaused!);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('exclusions.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await slots.nth(0).getByRole('button', { name: 'Liberar' }).click();
  await expect(slots.nth(0).getByRole('button', { name: 'Activar' })).toBeVisible();
  await expect(page.getByLabel('Marcador 0 a 0')).toBeVisible();
  await expect(page.locator('.event-card')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mantén pulsado para hablar' })).toBeEnabled({
    timeout: 30000,
  });
  await expect(page.getByRole('button', { name: 'Grabar con un toque' })).toHaveCount(0);
  await page.evaluate(async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('cactus-needle-')) {
        await caches.delete(key);
      }
    }
  });
  await page.reload();
  await expect(page.getByRole('alert').filter({ hasText: 'Cactus no está cargado' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mantén pulsado para hablar' })).toBeDisabled();
});
