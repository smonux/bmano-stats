import { test, expect } from '@playwright/test';

test('welcome explains ordered voice grammar and Spanish notes with reachable controls on short screens', async ({
  page,
}, info) => {
  const width = info.project.name === 'mobile' ? 390 : 1000;
  await page.setViewportSize({ width, height: 664 });
  await page.addInitScript(() => localStorage.setItem('handball-language', 'es'));
  await page.goto('/');
  const guide = page.getByRole('dialog', { name: 'Guía de pista', exact: true });
  await expect(guide).toBeVisible();
  await guide
    .getByRole('button', { name: 'Pulsa, habla, revisa y guarda', exact: true })
    .press('Enter');
  await expect(guide).toContainText('Evento → equipo → jugador 1 → jugador 2 → metadatos');
  await expect(guide).toContainText('pulsa Guardar evento para registrarla');
  await expect(guide).not.toContainText('cinco segundos');
  await expect(guide).toContainText('Gol nuestro siete uno penalti');
  await expect(guide).toContainText('Sale el #7 y entra el #9 del equipo 1.');
  await guide.locator('.welcome-grammar').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('voice-grammar.png') });
  await guide
    .getByRole('button', { name: 'También puedes dictar una nota', exact: true })
    .press('Enter');
  await expect(
    guide.getByRole('heading', { name: 'También puedes dictar una nota', exact: true }),
  ).toBeVisible();
  await expect(guide).toContainText('primera palabra empiece por «not» o «coment»');
  const reminder = guide.locator('blockquote').first();
  await expect(reminder).toHaveAttribute('lang', 'es');
  await expect(reminder).toContainText('El árbitro está advirtiendo a Sara de posible exclusión');
  await guide.locator('.welcome-examples').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('voice-notes.png') });
  for (const height of [664, 520]) {
    await page.setViewportSize({ width, height });
    const skip = guide.getByRole('button', {
      name: 'Ir a la aplicación; guía disponible en Ajustes',
      exact: true,
    });
    const next = guide.getByRole('button', { name: 'Siguiente', exact: true });
    for (const control of [skip, next]) {
      const box = (await control.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(height);
    }
    expect(await guide.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
  await guide.locator('.welcome-examples').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('voice-notes-short.png') });
  await guide.getByRole('button', { name: 'Siguiente', exact: true }).press('Enter');
  await expect(
    guide.getByRole('heading', { name: 'Controla los dos minutos', exact: true }),
  ).toBeVisible();
  await guide.getByRole('button', { name: 'Empezar', exact: true }).press('Enter');
  await expect(guide).toHaveCount(0);
  await page.reload();
  await expect(guide).toHaveCount(0);
});
