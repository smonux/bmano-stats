import { choose } from './editor-helpers';
import { selectWheelOption } from './wheel-helpers';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { DEFAULT_MODEL, DEFAULT_SPEECH_MODEL } from 'cactus-needle';
export async function serveModels(context: BrowserContext, request?: () => void) {
  const models = process.env.VOICE_MODELS_DIR;
  test.skip(
    !models,
    'Set VOICE_MODELS_DIR to verify the required pre-match preparation using real pinned models.',
  );
  for (const model of [DEFAULT_SPEECH_MODEL, DEFAULT_MODEL]) {
    await context.route(model.url, (route) => {
      request?.();
      return route.fulfill({
        path: resolve(models!, `${model.name}.cact`),
        contentType: 'application/octet-stream',
        headers: { 'access-control-allow-origin': '*' },
      });
    });
  }
  await context.route('**/models/needle3-*.cact', (route) => {
    request?.();
    return route.continue();
  });
}
export async function prepareMatchVoice(page: Page) {
  const preparation = page.getByRole('region', { name: 'Preparación de voz' });
  await expect(preparation.getByRole('alert').first()).toContainText(
    'El reconocimiento de voz no está preparado',
  );
  await selectWheelOption(
    preparation.getByRole('listbox', { name: 'Idioma de voz', exact: true }),
    'Español',
  );
  await expect(
    preparation.getByRole('listbox', { name: 'Versión de Needle', exact: true }),
  ).toHaveCount(0);
  await expect(
    preparation.getByRole('listbox', { name: 'Equipo por defecto', exact: true }),
  ).toHaveCount(0);
  await preparation
    .getByRole('button', { name: 'Cargar reconocimiento de voz', exact: true })
    .click();
  await expect(preparation).toHaveCount(0, {
    timeout: 60000,
  });
}
export async function selectEvent(page: Page, label: string) {
  await choose(page.getByRole('dialog'), 'Evento', label);
}
