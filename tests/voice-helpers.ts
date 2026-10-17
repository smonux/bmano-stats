import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { DEFAULT_SPEECH_MODEL } from 'cactus-needle';
export async function serveModels(context: BrowserContext, request?: () => void) {
  const models = process.env.VOICE_MODELS_DIR;
  test.skip(
    !models,
    'Set VOICE_MODELS_DIR to verify the required pre-match preparation using real pinned models.',
  );
  for (const model of [DEFAULT_SPEECH_MODEL])
    await context.route(model.url, (route) => {
      request?.();
      return route.fulfill({
        path: resolve(models!, `${model.name}.cact`),
        contentType: 'application/octet-stream',
        headers: { 'access-control-allow-origin': '*' },
      });
    });
  await context.route('**/*needle3*.cact', (route) => {
    request?.();
    return route.abort('blockedbyclient');
  });
}
export async function prepareMatchVoice(page: Page) {
  const preparation = page.getByRole('region', { name: 'Preparación de voz' });
  await expect(preparation.getByRole('alert').first()).toContainText('Cactus no está cargado');
  await preparation.getByLabel('Idioma de voz', { exact: true }).selectOption('es');
  await expect(preparation.getByLabel('Versión de Needle', { exact: true })).toHaveCount(0);
  await preparation.getByRole('button', { name: 'Cargar Cactus', exact: true }).click();
  await expect(preparation.getByText('Cactus listo', { exact: true })).toBeVisible({
    timeout: 60000,
  });
}
export async function selectEvent(page: Page, label: string) {
  await page
    .getByRole('dialog')
    .getByRole('listbox', { name: 'Evento', exact: true })
    .getByRole('option', { name: label, exact: true })
    .click();
}
