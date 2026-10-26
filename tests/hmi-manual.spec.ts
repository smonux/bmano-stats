import { expect, test } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { selectWheelOption } from './wheel-helpers';

test('manual start is explicit, validates teams/date, works offline and leaves PTT unavailable', async ({
  page,
  context,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'data.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(reportFixture())),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/nuevo');
  const manual = page.getByRole('button', { name: 'Iniciar solo con entrada manual', exact: true });
  const normal = page.getByRole('button', { name: 'Iniciar partido', exact: true });
  const rival = page.getByRole('listbox', { name: 'Equipo 2 (rival)', exact: true });
  await expect(manual).toBeDisabled();
  await page.getByRole('button', { name: 'Elige el equipo rival', exact: true }).click();
  await expect(rival).toBeFocused();
  await selectWheelOption(rival, 'La Jota');
  await expect(manual).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Elige un rival diferente', exact: true }),
  ).toBeVisible();
  await selectWheelOption(rival, 'Rival');
  await expect(manual).toBeEnabled();
  await expect(normal).toBeDisabled();
  await page.getByLabel('Fecha', { exact: true }).fill('');
  await expect(manual).toBeDisabled();
  await page.getByRole('button', { name: 'Elige la fecha', exact: true }).click();
  await expect(page.getByLabel('Fecha', { exact: true })).toBeFocused();
  await page.getByLabel('Fecha', { exact: true }).fill('2026-10-25');
  await page.getByLabel('Fecha', { exact: true }).press('Enter');
  await expect(page).toHaveURL(/#\/nuevo$/);
  await expect(normal).toBeDisabled();
  await page.screenshot({ path: info.outputPath('explicit-manual.png'), fullPage: true });
  await context.setOffline(true);
  await manual.press('Enter');
  await expect(page.locator('.scoreboard')).toBeVisible();
  await expect(page.getByLabel('Marcador 0 a 0', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Voz (mantener)', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await expect(editor).toBeVisible();
  await expect(editor.locator('.event-action-choices [aria-pressed=true]')).toHaveCount(0);
  await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await context.setOffline(false);
  await page.reload();
  await expect(page.locator('.scoreboard')).toBeVisible();
});

test('manual creation keeps invalid duplicate names editable and creates only the visible teams', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  await page.goto('/#/nuevo');
  for (const label of ['Equipo 1 (nuestro)', 'Equipo 2 (rival)']) {
    await page
      .getByRole('group', { name: label, exact: true })
      .getByRole('button', { name: 'Nuevo', exact: true })
      .click();
    await page
      .getByRole('textbox', { name: label, exact: true })
      .fill('Equipo con nombre largo de Zaragoza');
  }
  const manual = page.getByRole('button', { name: 'Iniciar solo con entrada manual', exact: true });
  await manual.click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Ya existe un equipo con ese nombre' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#\/nuevo$/);
  await page
    .getByRole('textbox', { name: 'Equipo 2 (rival)', exact: true })
    .fill('Contrario con nombre muy largo para el partido de hoy');
  await manual.click();
  await expect(page.locator('.scoreboard')).toBeVisible();
  await expect(page.locator('.scoreboard h2')).toHaveText([
    'Equipo con nombre largo de Zaragoza',
    'Contrario con nombre muy largo para el partido de hoy',
  ]);
  await page.screenshot({ path: info.outputPath('manual-created.png') });
});
