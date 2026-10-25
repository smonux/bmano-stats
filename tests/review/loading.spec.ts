import { expect, test } from '@playwright/test';

test('creation waits for authoritative data instead of flashing match not found', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Cada jugada cuenta.', exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
    // Delay delivery of real IndexedDB reads, not the transaction or navigation.
    const dataModule = '/src/data/database.ts';
    const { db, repo } = (await import(
      /* @vite-ignore */ dataModule
    )) as typeof import('../../src/data/database');
    const routeModule = '/src/hooks/useRoute.ts';
    const { navigate } = (await import(
      /* @vite-ignore */ routeModule
    )) as typeof import('../../src/hooks/useRoute');
    const original = db.snapshot.bind(db);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    db.snapshot = async () => {
      const snapshot = await original();
      await gate;
      return snapshot;
    };
    Object.assign(window, { releaseSnapshot: release });
    const match = await repo.createMatch({ name: 'La Jota' }, { name: 'Rival' }, '2026-10-25');
    navigate('/partidos/' + match.id);
  });
  await expect(page.getByText('Partido no encontrado', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Abriendo tus datos…', { exact: true })).toBeVisible();
  await page.evaluate(() =>
    (window as unknown as { releaseSnapshot: () => void }).releaseSnapshot(),
  );
  await expect(page.locator('.scoreboard')).toBeVisible();
  await expect(page.getByText('Partido no encontrado', { exact: true })).toHaveCount(0);
  await page.goto('/#/partidos/missing');
  await expect(
    page.getByRole('heading', { name: 'Partido no encontrado', exact: true }),
  ).toBeVisible();
});
