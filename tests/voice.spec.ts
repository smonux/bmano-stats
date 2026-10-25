import { selectShirtNumber, readShirtNumber } from './wheel-helpers';
import { selectWheelOption } from './wheel-helpers';
import { serveModels, prepareMatchVoice, selectEvent } from './voice-helpers';
import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const models = process.env.VOICE_MODELS_DIR;
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
});
test('real Whistle and ordered commands: microphone to reviewed event, then reload offline', async ({
  page,
  context,
}, testInfo) => {
  test.skip(!models, 'Set VOICE_MODELS_DIR to a folder containing the pinned whistle.cact model.');
  test.setTimeout(180000);
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    const tracked = window as unknown as { voiceTestTracks: MediaStreamTrack[] };
    tracked.voiceTestTracks = [];
    navigator.mediaDevices.getUserMedia = async (options) => {
      const stream = await original(options);
      tracked.voiceTestTracks.push(...stream.getTracks());
      return stream;
    };
  });
  let modelRequests = 0;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Serve real pinned files locally to avoid CDN/network variability; the SDK checks their hashes.
  await serveModels(context, () => {
    modelRequests++;
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Nuevo partido/ }).click();
  for (const label of ['Equipo 1 (nuestro)', 'Equipo 2 (rival)']) {
    await page
      .getByRole('group', { name: label, exact: true })
      .getByRole('button', { name: 'Nuevo', exact: true })
      .click();
    await page
      .getByLabel(label, { exact: true })
      .fill(label === 'Equipo 1 (nuestro)' ? 'Águilas' : 'Leones');
  }
  const preparation = page.getByRole('region', { name: 'Preparación de voz' });
  await preparation.getByRole('button', { name: 'Comprobar micrófono' }).click();
  await expect(preparation.getByRole('button', { name: 'Micrófono comprobado' })).toBeVisible();
  await prepareMatchVoice(page);
  expect(modelRequests).toBe(1);
  await page.getByRole('button', { name: 'Iniciar partido' }).click();
  const talk = page.getByRole('button', { name: 'Voz (mantener)' });
  await expect(talk).toBeEnabled({ timeout: 30000 });
  await expect(page.getByRole('button', { name: 'Grabar con un toque' })).toHaveCount(0);
  await talk.scrollIntoViewIfNeeded();
  await talk.hover();
  await page.mouse.down();
  await expect(page.getByRole('button', { name: /Grabando ·/ })).toBeVisible();
  // Record one complete, synthetic Spanish utterance from Chromium's fake microphone.
  await page.waitForTimeout(6500);
  await page.evaluate(() => screen.orientation.dispatchEvent(new Event('change')));
  await page.locator('.hold-to-talk').dispatchEvent('pointercancel');
  await page.mouse.up();
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(
    page.getByText('Propuesta lista. Termina la edición manual para revisarla.'),
  ).toBeVisible({ timeout: 60000 });
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  const review = page.getByRole('dialog', { name: 'Confirmar jugada', exact: true });
  await expect(review).toBeVisible({ timeout: 10000 });
  await expect(review.getByText('Transcripción original', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('voz-confirmacion.png'), fullPage: true });
  await review.getByRole('button', { name: 'Editar', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Nuevo evento' });
  await expect(editor).toBeVisible({ timeout: 10000 });
  await expect(editor.getByText(/Transcripción original/)).toBeVisible();
  await expect(editor.getByText(/Whistle:.*Reglas:/)).toBeVisible();
  expect(
    await editor.locator('.event-editor-fields > :last-child').getAttribute('class'),
  ).toContain('voice-diagnostics');
  const diagnosticsSize = await editor
    .locator('.voice-diagnostics')
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const bodySize = await editor
    .getByRole('textbox', { name: 'Nota', exact: true })
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  // Diagnostics stay secondary while respecting the readable caption scale.
  expect(diagnosticsSize).toBeGreaterThanOrEqual(14);
  expect(diagnosticsSize).toBeLessThanOrEqual(bodySize);
  await expect(editor.getByText(/Needle:/)).toHaveCount(0);
  await expect(editor.locator('.voice-warnings, .pending-hint')).toHaveCount(0);
  await expect(
    editor
      .getByRole('listbox', { name: 'Equipo', exact: true })
      .getByRole('option', { selected: true }),
  ).not.toHaveText('—');
  await expect
    .poll(() =>
      editor.getByRole('listbox', { name: 'Evento', exact: true }).evaluate((el) => {
        const selected = el.querySelector('[aria-selected=true]')!;
        const a = selected.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        return Math.abs(a.top + a.height / 2 - b.top - b.height / 2);
      }),
    )
    .toBeLessThan(2);
  const actualProposal = {
    transcripcion: await page.locator('.voice-transcript').first().textContent(),
    tipo: await editor
      .getByRole('listbox', { name: 'Evento', exact: true })
      .getByRole('option', { selected: true })
      .textContent(),
    equipo: await editor
      .getByRole('listbox', { name: 'Equipo', exact: true })
      .getByRole('option', { selected: true })
      .textContent(),
    dorsal: await readShirtNumber(editor, 'Dorsal principal'),
    tiempos: await editor.getByText(/Whistle:.*Reglas:/).textContent(),
    advertencias: await editor.locator('.voice-warnings').allTextContents(),
  };
  await writeFile(
    testInfo.outputPath('propuesta-real.json'),
    JSON.stringify(actualProposal, null, 2),
  );
  await testInfo.attach('propuesta-real.json', {
    body: JSON.stringify(actualProposal),
    contentType: 'application/json',
  });
  // Recognition is a proposal: explicitly review/correct it before committing.
  await selectEvent(page, 'Gol');
  await selectWheelOption(editor.getByRole('listbox', { name: 'Equipo', exact: true }), 'Águilas');
  await selectShirtNumber(editor, 'Dorsal principal', '7');
  await expect(page.getByLabel('Marcador 0 a 0')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('voz-revision.png'), fullPage: true });
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(page.getByLabel('Marcador 1 a 0')).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const downloads = modelRequests;
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Voz (mantener)' })).toBeEnabled({
    timeout: 30000,
  });
  const hold = page.getByRole('button', { name: 'Voz (mantener)' });
  await hold.hover();
  await page.mouse.down();
  await expect(page.getByRole('button', { name: /Grabando ·/ })).toBeVisible();
  await page.waitForTimeout(6500);
  await page.mouse.up();
  await expect(review).toBeVisible({ timeout: 40000 });
  await expect(review.getByText(/Transcripción original/)).toBeVisible();
  await review.getByRole('button', { name: 'Descartar', exact: true }).click();
  await expect(page.getByLabel('Marcador 1 a 0')).toBeVisible();
  expect(modelRequests).toBe(downloads);
  expect(
    await page.evaluate(() => {
      const tracks = (window as unknown as { voiceTestTracks: MediaStreamTrack[] }).voiceTestTracks;
      return tracks.length > 0 && tracks.every((t) => t.readyState === 'ended');
    }),
  ).toBe(true);
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException('Denied by test', 'NotAllowedError');
    };
  });
  await talk.focus();
  await page.keyboard.down('Space');
  await expect(page.getByRole('alert')).toContainText('No hay permiso para el micrófono');
  await page.keyboard.up('Space');
  expect(errors).toEqual([]);
});
