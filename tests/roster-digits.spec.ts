import { test, expect } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { selectShirtNumber, readShirtNumber, selectWheelOption } from './wheel-helpers';

test('catalogue creates shirt zero with digit wheels and keeps existing shirt numbers fixed', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(reportFixture())),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/equipos/a');
  await page.getByRole('button', { name: 'Jugador', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await selectShirtNumber(dialog, 'Dorsal', '0');
  await dialog.getByRole('textbox', { name: 'Nombre (opcional)', exact: true }).fill('Cero');
  await dialog.getByRole('button', { name: 'Guardar jugador', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.locator('.list-row').filter({ hasText: 'Cero' }).click();
  dialog = page.getByRole('dialog');
  for (const digit of ['Decenas', 'Unidades']) {
    await expect(
      dialog.getByRole('listbox', { name: `Dorsal · ${digit}`, exact: true }),
    ).toHaveAttribute('aria-disabled', 'true');
  }
  await dialog
    .getByRole('textbox', { name: 'Nombre (opcional)', exact: true })
    .fill('Cero editado');
  await dialog.getByRole('button', { name: 'Guardar jugador', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  dialog = page.getByRole('dialog');
  await selectWheelOption(dialog.getByRole('listbox', { name: 'Evento', exact: true }), 'Gol');
  await selectWheelOption(dialog.getByRole('listbox', { name: 'Equipo', exact: true }), 'La Jota');
  await selectWheelOption(
    dialog.getByRole('listbox', { name: 'Jugador principal', exact: true }),
    '#0 Cero editado',
  );
  await expect.poll(() => readShirtNumber(dialog, 'Dorsal principal')).toBe('0');
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
});
