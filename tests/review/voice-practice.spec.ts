import { expect, test, type Page } from '@playwright/test';
import { serveModels } from '../voice-helpers';
import { selectWheelOption } from '../wheel-helpers';
import { choose } from '../editor-helpers';
import { reportFixture } from '../fixtures/report';

async function locale(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
}
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/data/database.ts';
    const { db } = await import(/* @vite-ignore */ path);
    return JSON.stringify(await db.snapshot());
  });
}
async function fakeCapture(page: Page) {
  // Explicit test doubles for PCM capture and ASR only. Real engine.interpret,
  // recognizeCapture, keywords, semantic evaluation, editor and IndexedDB remain active.
  await page.evaluate(async () => {
    const enginePath = '/src/voice/engine.ts';
    const recorderPath = '/src/voice/recorder.ts';
    const { VoiceEngine } = await import(/* @vite-ignore */ enginePath);
    const { VoiceRecorder } = await import(/* @vite-ignore */ recorderPath);
    const probe = window as unknown as {
      practiceText: string;
      practiceMode: string;
      practiceHints: string[];
      resolvePractice: () => void;
      practiceRecorderCancelled: number;
    };
    probe.practiceMode = 'text';
    probe.practiceRecorderCancelled = 0;
    VoiceRecorder.prototype.start = async function () {
      if (probe.practiceMode === 'denied')
        throw new DOMException('Test denied permission', 'NotAllowedError');
      return true;
    };
    VoiceRecorder.prototype.stop = async () => ({
      samples: new Float32Array(16000),
      sampleRate: 16000,
    });
    VoiceRecorder.prototype.cancel = () => {
      probe.practiceRecorderCancelled++;
    };
    VoiceEngine.prototype.transcribe = async (
      _samples: Float32Array,
      _rate: number,
      hints: string[],
    ) => {
      probe.practiceHints = hints;
      const result = {
        text: probe.practiceText,
        language: 'es',
        durationInSeconds: 1,
        timeToFirstTokenMs: 1,
        tokensPerSecond: 1,
      };
      if (probe.practiceMode === 'deferred')
        await new Promise<void>((resolve) => {
          probe.resolvePractice = resolve;
        });
      return result;
    };
  });
}
async function readFake(page: Page, text: string, mode = 'text') {
  await page.evaluate(
    ({ text, mode }) => Object.assign(window, { practiceText: text, practiceMode: mode }),
    { text, mode },
  );
  const talk = page.locator('.hold-to-talk');
  await expect(talk).toBeEnabled({ timeout: 60000 });
  await talk.focus();
  await page.keyboard.down('Space');
  if (mode !== 'denied') await expect(talk).toHaveClass(/recording/);
  await page.keyboard.up('Space');
}
async function startFromSettings(page: Page) {
  await locale(page);
  await page.goto('/#/ajustes');
  const fixture = reportFixture();
  fixture.matches[0].clock.startedAt = Date.now();
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'practice-real-data.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const preparation = page.getByRole('region', { name: 'Preparación de voz' });
  await selectWheelOption(
    preparation.getByRole('listbox', { name: 'Idioma de voz', exact: true }),
    'Español',
  );
  await preparation
    .getByRole('button', { name: 'Cargar reconocimiento de voz', exact: true })
    .click();
  await expect(preparation.getByText('Reconocimiento listo', { exact: true })).toBeVisible({
    timeout: 60000,
  });
  await fakeCapture(page);
  await page.getByRole('button', { name: 'Practicar voz', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar a la práctica', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Una jugada. Cuatro piezas.' })).toBeVisible();
  await page.getByRole('button', { name: 'Entendido · Vamos a practicar', exact: true }).click();
}

test('FAKE capture/ASR: four semantic challenges, real editor, grammar return and no domain writes', async ({
  page,
  context,
}, info) => {
  test.setTimeout(180000);
  await serveModels(context);
  await startFromSettings(page);
  const before = await snapshot(page);
  await page.evaluate(async () => {
    const path = '/src/data/database.ts';
    const { db } = await import(/* @vite-ignore */ path);
    for (const table of [db.teams, db.players, db.matches, db.events]) {
      for (const hook of ['creating', 'updating', 'deleting'])
        table.hook(hook, () => {
          throw new Error('Practice attempted a real domain write');
        });
    }
  });
  const result = page.getByRole('region', { name: 'Resultado del reto', exact: true });
  await readFake(page, 'Gol nuestro');
  await expect(result).toHaveClass(/green/);
  await expect(result).toContainText('Reconocido por voz');
  await expect(result).toContainText('Sin identificar');
  const hints = await page.evaluate(
    () => (window as unknown as { practiceHints: string[] }).practiceHints,
  );
  expect(hints).toEqual(expect.arrayContaining(['Marta', 'Elena', '7', '9', '12', '8']));
  expect(hints).not.toContain('15');
  expect(hints).not.toContain('Gol nuestro de Marta, pase de Elena');
  await page.getByRole('button', { name: 'Completar o corregir', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Corregir práctica', exact: true })
    .getByRole('button', { name: 'Comprobar jugada', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(result).toContainText('Reconocido por voz');
  await page.getByRole('button', { name: 'Siguiente jugada', exact: true }).click();
  await expect(page.locator('blockquote')).toHaveText('«Gol nuestro de Marta, pase de Elena»');
  await readFake(page, 'Gol nuestro de Marta, pase de Elena');
  await expect(result).toHaveClass(/green/);
  await expect(result).toContainText('Reconocido por voz');
  await expect(result).toContainText('#7 · Marta · Equipo de práctica 1');
  await expect(result).toContainText('#9 · Elena · Equipo de práctica 1');
  await page.screenshot({ path: info.outputPath('named-teammates-green.png') });
  await page.getByRole('button', { name: 'Repetir jugada', exact: true }).click();
  await readFake(page, 'Gol nuestro Marta');
  await expect(result).toHaveClass(/amber/);
  await expect(result).toContainText('Para completar el reto falta: Asistente');
  await expect(page.getByRole('button', { name: 'Siguiente jugada', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Recordar la gramática', exact: true }).click();
  await page.getByRole('button', { name: 'Volver a mi jugada', exact: true }).click();
  await expect(result).toContainText('Gol nuestro Marta');
  await page.getByRole('button', { name: 'Completar o corregir', exact: true }).click();
  let editor = page.getByRole('dialog', { name: 'Corregir práctica', exact: true });
  await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(result).toHaveClass(/amber/);
  await expect(
    page.getByRole('button', { name: 'Completar o corregir', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Completar o corregir', exact: true }).click();
  await choose(editor, 'Jugador relacionado', '#9 Elena');
  await editor.getByRole('button', { name: 'Comprobar jugada', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(result).toHaveClass(/green/);
  await expect(result).toContainText('Completado con ayuda');
  await page.getByRole('button', { name: 'Siguiente jugada', exact: true }).click();
  await readFake(page, 'Penalti nuestro doce');
  await expect(result).toHaveClass(/amber/);
  await expect(result).toContainText('No coincide con el reto; revisa: Equipo');
  await page.getByRole('button', { name: 'Repetir jugada', exact: true }).click();
  await readFake(page, 'Penalti cometido por ellos, número doce, provocado por Elena');
  await expect(result).toHaveClass(/green/);
  await expect(result).toContainText('#12 · Equipo de práctica 2');
  await expect(result).toContainText('#9 · Elena · Equipo de práctica 1');
  await page.getByRole('button', { name: 'Siguiente jugada', exact: true }).click();
  await readFake(page, 'Exclusión de ellos');
  await expect(result).toHaveClass(/amber/);
  await expect(result).toContainText('Para completar el reto falta: Excluido');
  await page.screenshot({ path: info.outputPath('exclusion-amber.png') });
  await page.getByRole('button', { name: 'Completar o corregir', exact: true }).click();
  editor = page.getByRole('dialog', { name: 'Corregir práctica', exact: true });
  await choose(editor, 'Jugador principal', '#8 Sin nombre');
  await editor.getByRole('button', { name: 'Comprobar jugada', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(result).toHaveClass(/green/);
  await page.getByRole('button', { name: 'Terminar entrenamiento', exact: true }).click();
  await expect(
    page.getByText('4 de 4 retos completados · 2 con ayuda.', { exact: true }),
  ).toBeVisible();
  expect(await snapshot(page)).toBe(before);
  await page.screenshot({ path: info.outputPath('practice-complete.png') });
  await page.getByRole('button', { name: 'Volver a practicar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Registra el partido por voz y gestos.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Salir de la práctica', exact: true }).click();
  await expect(page).toHaveURL(/#\/ajustes$/);
  await expect(page.getByRole('button', { name: 'Practicar voz', exact: true })).toBeFocused();
  expect(await snapshot(page)).toBe(before);
});

test('FAKE capture/ASR: denial, silence, cancellation and late results never grant progress', async ({
  page,
  context,
}) => {
  test.setTimeout(180000);
  await serveModels(context);
  await startFromSettings(page);
  const before = await snapshot(page);
  const next = page.getByRole('button', { name: 'Siguiente jugada', exact: true });
  await readFake(page, '', 'denied');
  await expect(page.getByRole('alert').filter({ hasText: 'No hay permiso' })).toBeVisible();
  await expect(next).toBeDisabled();
  await readFake(page, '');
  await expect(
    page.getByRole('alert').filter({ hasText: 'No se ha reconocido voz' }),
  ).toBeVisible();
  await expect(next).toBeDisabled();
  await readFake(page, 'no identificado');
  await expect(page.locator('.practice-result')).toHaveClass(/red/);
  await expect(next).toBeDisabled();
  await page.getByRole('button', { name: 'Repetir jugada', exact: true }).click();
  await readFake(page, 'Gol nuestro', 'deferred');
  await expect(
    page.getByRole('button', { name: 'Cancelar reconocimiento', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Recordar la gramática', exact: true }).click();
  await page.evaluate(() =>
    (window as unknown as { resolvePractice: () => void }).resolvePractice(),
  );
  await page.getByRole('button', { name: 'Volver a mi jugada', exact: true }).click();
  await expect(page.locator('.practice-result')).toHaveCount(0);
  await expect(next).toBeDisabled();
  await page.getByRole('button', { name: 'Salir de la práctica', exact: true }).click();
  expect(await snapshot(page)).toBe(before);
});

test('missing model: optional entry, manual practice, actual red/green validation and no microphone request', async ({
  page,
}) => {
  await locale(page);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new Error('Unexpected microphone request');
    };
  });
  await page.goto('/#/nuevo');
  await page.getByRole('button', { name: 'Ahora no', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Iniciar solo con entrada manual', exact: true }),
  ).toBeVisible();
  await page.goto('/#/ajustes');
  const before = await snapshot(page);
  await page.getByRole('button', { name: 'Practicar voz', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar a la práctica', exact: true }).click();
  await page.getByRole('button', { name: 'Entendido · Vamos a practicar', exact: true }).click();
  await expect(page.locator('.hold-to-talk')).toBeDisabled();
  await page.getByRole('button', { name: 'Completar manualmente', exact: true }).click();
  let editor = page.getByRole('dialog', { name: 'Corregir práctica', exact: true });
  await editor.getByRole('button', { name: 'Comprobar jugada', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator('.practice-result')).toHaveClass(/red/);
  await page.getByRole('button', { name: 'Completar o corregir', exact: true }).click();
  editor = page.getByRole('dialog', { name: 'Corregir práctica', exact: true });
  await choose(editor, 'Evento', 'Gol');
  await choose(editor, 'Equipo', 'Equipo de práctica 1');
  await editor.getByRole('button', { name: 'Comprobar jugada', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator('.practice-result')).toHaveClass(/green/);
  expect(await snapshot(page)).toBe(before);
  await page.getByRole('button', { name: 'Salir de la práctica', exact: true }).click();
  await page.reload();
  expect(await snapshot(page)).toBe(before);
});

test('return from practice restores the running match, clock, events and counters', async ({
  page,
}) => {
  await locale(page);
  await page.clock.install({ time: new Date() });
  await page.goto('/#/ajustes');
  const fixture = reportFixture();
  fixture.matches[0].clock.startedAt = Date.now();
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'running-match.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await expect(page.getByLabel('Marcador 3 a 2', { exact: true })).toBeVisible();
  const before = await snapshot(page);
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  await page.getByRole('link', { name: 'Practicar voz', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Registra el partido por voz y gestos.' }),
  ).toBeVisible();
  await page.clock.fastForward(5000);
  await page.getByRole('button', { name: 'Salir de la práctica', exact: true }).click();
  await expect(page).toHaveURL(/#\/partidos\/report-match$/);
  await expect(page.getByLabel('Marcador 3 a 2', { exact: true })).toBeVisible();
  await expect(page.locator('.event-card')).toHaveCount(fixture.events.length);
  await expect(page.getByRole('timer', { name: 'Reloj del partido', exact: true })).toHaveText(
    /^09:0[5-9]$/,
  );
  expect(await snapshot(page)).toBe(before);
});
