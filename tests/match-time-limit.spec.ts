import { expect, test, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { editNote } from './editor-helpers';

async function nearLimit(page: Page) {
  await page.setViewportSize({ width: 390, height: 664 });
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const data = reportFixture();
  data.matches[0].clock.elapsedMs = 149 * 60000 + 59000;
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'near-limit.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await expect(page.getByRole('timer', { name: 'Reloj del partido', exact: true })).toHaveText(
    '149:59',
  );
  await page.clock.install();
  const base = await page.evaluate(() => Date.now());
  await page.clock.setFixedTime(base);
  return base;
}

async function expectFinished(page: Page) {
  await expect(page.locator('.match-page-title .badge')).toHaveText('Finalizado');
  await expect(page.getByRole('timer', { name: 'Reloj del partido', exact: true })).toHaveText(
    '150:00',
  );
  await expect(page.locator('.clock-actions')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Nuevo tiempo', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Finalizar partido', exact: true })).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Marcador 3 a 2', { exact: true })).toBeVisible();
  await expect(page.locator('.event-card')).toHaveCount(9);
}

test('150:00 finishes without confirmation, excludes pauses and keeps event corrections after reload', async ({
  page,
}, info) => {
  const base = await nearLimit(page);
  await page.clock.setFixedTime(base + 3600000);
  await page.clock.runFor(1000);
  await expect(page.locator('.match-page-title .badge')).toHaveText('En curso');
  await expect(page.getByRole('timer', { name: 'Reloj del partido', exact: true })).toHaveText(
    '149:59',
  );
  await page.getByRole('button', { name: 'Reanudar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Parar', exact: true })).toBeVisible();
  await page.clock.setFixedTime(base + 3601000);
  await page.clock.runFor(1000);
  await expectFinished(page);
  await expect(page.locator('.timer-digits')).toHaveText('00:59');
  await page.screenshot({ path: info.outputPath('automatic-finish.png') });
  await page.clock.setFixedTime(base + 3700000);
  await page.clock.runFor(1000);
  await expect(page.locator('.timer-digits')).toHaveText('00:59');
  await page.reload();
  await expectFinished(page);
  const card = page.locator('[data-event-id="e3"]');
  await card.getByRole('button', { name: 'Editar', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Editar evento', exact: true });
  await editNote(editor);
  await editor.getByLabel('Nota', { exact: true }).fill('Revisado después del límite automático.');
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expectFinished(page);
});

for (const wake of ['focus', 'reload'] as const)
  test(`an expired match finishes from the catalogue on ${wake}, without opening its screen`, async ({
    page,
  }) => {
    const base = await nearLimit(page);
    await page.getByRole('button', { name: 'Reanudar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Parar', exact: true })).toBeVisible();
    await page.goto('/#/partidos');
    const card = page.locator('.match-card');
    await expect(card).toContainText('En curso');
    // Change wall time without delivering interval callbacks: only wake/load can detect expiry.
    await page.clock.setFixedTime(base + 600000);
    if (wake === 'focus') await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    else await page.reload();
    await expect(card).toContainText('Finalizado');
    await card.click();
    await expectFinished(page);
    await expect(page.locator('.timer-digits')).toHaveText('00:59');
  });
