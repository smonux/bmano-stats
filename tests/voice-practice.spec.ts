import { expect, test, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { serveModels } from './voice-helpers';
import { selectWheelOption } from './wheel-helpers';
import { choose, expand } from './editor-helpers';
import { languages, tr, type Language } from '../src/i18n';
import { contrast } from './color-helpers';
import {
  practiceExpressions,
  practiceGoalExample,
  practicePhrases,
} from '../src/voice/practice/challenges';
import { practiceNames } from '../src/voice/practice/names';

async function locale(page: Page, language: Language = 'es') {
  await page.addInitScript((language) => {
    localStorage.setItem('handball-language', language);
    localStorage.setItem('handball-welcome-v1', 'done');
  }, language);
}

for (const [width, language, scale, dark] of [
  [320, 'es', 1, false],
  [390, 'es', 1, true],
  [430, 'es', 1, false],
  [320, 'en', 2, true],
  [390, 'de', 2, false],
  [430, 'fr', 1, true],
  [390, 'it', 1, false],
  [320, 'nl', 1, false],
  [390, 'pl', 2, true],
] as [number, Language, number, boolean][])
  test(`practice ${width}px ${language} ${scale}x ${dark ? 'dark' : 'light'}: grammar, manual correction and exit stay usable`, async ({
    page,
  }, info) => {
    await locale(page, language);
    await page.setViewportSize({ width, height: width === 320 ? 568 : 664 });
    await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light' });
    await page.goto('/#/practica-voz?desde=%2Fajustes');
    await page.evaluate((scale) => {
      document.documentElement.style.fontSize = `${100 * scale}%`;
    }, scale);
    const t = (source: string) => tr(source, {}, language);
    await expect(
      page.getByRole('heading', { name: t('Registra el partido por voz y gestos.') }),
    ).toBeFocused();
    await expect(page.locator('.practice-methods li')).toHaveCount(2);
    await expect(page.locator('.voice-practice')).toContainText(
      t(
        'La práctica te enseña qué decir y cómo revisar cada jugada para introducir los datos con más precisión durante el partido.',
      ),
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath('welcome.png'), fullPage: true });
    await page.getByRole('button', { name: t('Continuar a la práctica'), exact: true }).click();
    await expect(
      page.getByRole('heading', { name: t('Una jugada. Cuatro piezas.') }),
    ).toBeVisible();
    await expect(page.locator('.practice-grammar li')).toHaveCount(4);
    await expect(page.locator('.practice-tokens strong')).toHaveText([
      ...practiceGoalExample[language],
    ]);
    const colors = await page.locator('.voice-practice').evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      caption: getComputedStyle(element.querySelector('.eyebrow')!).color,
      description: getComputedStyle(element.querySelector('.practice-grammar small')!).color,
    }));
    expect(contrast(colors.caption, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.description, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath('grammar.png'), fullPage: true });
    await page
      .getByRole('button', { name: t('Entendido · Vamos a practicar'), exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: t('Siguiente jugada'), exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: t('Completar manualmente'), exact: true }).click();
    const editor = page.getByRole('dialog', { name: t('Corregir práctica'), exact: true });
    await expect(editor.locator('.event-action-choices button')).toHaveCount(13);
    await expect(
      editor.getByRole('button', { name: t('Comprobar jugada'), exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath('practice-editor.png') });
    await editor.getByRole('button', { name: t('Comprobar jugada'), exact: true }).click();
    await expect(editor).toHaveCount(0);
    const result = page.getByRole('region', { name: t('Resultado del reto'), exact: true });
    await expect(result).toHaveClass(/red/);
    await expect(result).toContainText(t('Necesita revisión'));
    await expect(result).toBeFocused();
    await page.screenshot({ path: info.outputPath('needs-review.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const leave = page.getByRole('button', { name: t('Salir de la práctica'), exact: true });
    await leave.focus();
    await expect(leave).toBeInViewport({ ratio: 1 });
    await leave.press('Enter');
    await expect(page).toHaveURL(/#\/ajustes$/);
  });

for (const [ui, spoken, nextSpoken] of [
  ['es', 'en', 'de'],
  ['en', 'fr', 'pl'],
] as [Language, Language, Language][])
  test(`spoken examples and roster use ${spoken}, then ${nextSpoken}, with a ${ui} interface`, async ({
    page,
  }, info) => {
    await locale(page, ui);
    await page.addInitScript((language) => {
      localStorage.setItem('handball-voice-language', language);
    }, spoken);
    await page.goto('/#/practica-voz?desde=%2Fajustes');
    const t = (source: string) => tr(source, {}, ui);
    const practice = page.locator('.voice-practice');
    await practice.getByRole('button', { name: t('Continuar a la práctica'), exact: true }).click();
    const checkIntroduction = async (language: Language) => {
      await expect(practice.locator('.practice-tokens')).toHaveAttribute('lang', language);
      await expect(practice.locator('.practice-tokens strong')).toHaveText([
        ...practiceGoalExample[language],
      ]);
      await expect(practice.locator('.practice-example-language')).toHaveText(
        tr('Ejemplos en {language}', { language: languages[language] }, ui),
      );
      const expressions = practiceExpressions[language];
      await expect(practice).toContainText(expressions.opponent);
      await expect(practice).toContainText(expressions.assist);
      await expect(practice).toContainText(expressions.beneficiary);
    };
    await checkIntroduction(spoken);
    await page.screenshot({ path: info.outputPath('spoken-language-intro.png'), fullPage: true });
    await practice
      .getByRole('button', { name: t('Entendido · Vamos a practicar'), exact: true })
      .click();
    const sentence = practice.locator('blockquote');
    await expect(sentence).toHaveAttribute('lang', spoken);
    await expect(sentence).toHaveText(`«${practicePhrases[spoken][0]}»`);
    await selectWheelOption(
      practice.getByRole('listbox', { name: t('Idioma de voz'), exact: true }),
      languages[nextSpoken],
    );
    await expect(sentence).toHaveAttribute('lang', nextSpoken);
    await expect(sentence).toHaveText(`«${practicePhrases[nextSpoken][0]}»`);
    await practice.getByRole('button', { name: t('Completar manualmente'), exact: true }).click();
    const editor = page.getByRole('dialog', { name: t('Corregir práctica'), exact: true });
    await choose(editor, t('Evento'), t('Gol'));
    await choose(editor, t('Equipo'), tr('Equipo de práctica {number}', { number: 1 }, ui));
    const names = practiceNames[nextSpoken];
    await choose(editor, t('Jugador principal'), `#7 ${names.scorer}`);
    await expand(editor.locator('.related-participant'));
    await choose(editor, t('Jugador relacionado'), `#9 ${names.assistant}`);
    await editor.getByRole('button', { name: t('Comprobar jugada'), exact: true }).click();
    await expect(editor).toHaveCount(0);
    const result = practice.locator('.practice-result');
    await expect(result).toHaveClass(/green/);
    await expect(result).toContainText(`#7 · ${names.scorer}`);
    await expect(result).toContainText(`#9 · ${names.assistant}`);
    await practice.getByRole('button', { name: t('Recordar la gramática'), exact: true }).click();
    await checkIntroduction(nextSpoken);
    await expect(page.locator('html')).toHaveAttribute('lang', ui);
    await practice.getByRole('button', { name: t('Salir de la práctica'), exact: true }).click();
    await expect(page).toHaveURL(/#\/ajustes$/);
  });

test('REAL Whistle: four synthetic utterances use the production recording pipeline and remain isolated', async ({
  page,
  context,
}, info) => {
  test.setTimeout(240000);
  let modelRequests = 0;
  await serveModels(context, () => {
    modelRequests++;
  });
  await locale(page);
  await context.route('**/practice-audio/*.wav', (route) =>
    route.fulfill({
      path: resolve('tests/fixtures/practice', route.request().url().split('/').at(-1)!),
      contentType: 'audio/wav',
    }),
  );
  // Synthetic audio is supplied as a MediaStream. VoiceRecorder, AudioWorklet,
  // Whistle, keyword generation, command interpretation and evaluator are real.
  await page.addInitScript(() => {
    const probe = window as unknown as {
      practiceFile: string;
      practiceAudioDone: boolean;
      practiceTracks: MediaStreamTrack[];
    };
    probe.practiceTracks = [];
    navigator.mediaDevices.getUserMedia = async () => {
      const audio = new AudioContext();
      await audio.resume();
      const bytes = await (await fetch('/practice-audio/' + probe.practiceFile)).arrayBuffer();
      const buffer = await audio.decodeAudioData(bytes);
      const source = audio.createBufferSource();
      source.buffer = buffer;
      const destination = audio.createMediaStreamDestination();
      source.connect(destination);
      probe.practiceAudioDone = false;
      source.onended = () => {
        probe.practiceAudioDone = true;
      };
      for (const track of destination.stream.getTracks()) {
        probe.practiceTracks.push(track);
        const stop = track.stop.bind(track);
        track.stop = () => {
          stop();
          void audio.close();
        };
      }
      source.start(audio.currentTime + 0.4);
      return destination.stream;
    };
  });
  await page.goto('/#/ajustes');
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
  await page.getByRole('button', { name: 'Practicar voz', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar a la práctica', exact: true }).click();
  await page.getByRole('button', { name: 'Entendido · Vamos a practicar', exact: true }).click();
  const observed: unknown[] = [];
  for (const [index, file] of [
    'goal.wav',
    'assist.wav',
    'penalty.wav',
    'exclusion.wav',
  ].entries()) {
    await page.evaluate(
      (file) => Object.assign(window, { practiceFile: file, practiceAudioDone: false }),
      file,
    );
    const talk = page.locator('.hold-to-talk');
    await expect(talk).toBeEnabled();
    await talk.focus();
    await page.keyboard.down('Space');
    await expect(talk).toHaveClass(/recording/);
    await expect
      .poll(
        () =>
          page.evaluate(
            () => (window as unknown as { practiceAudioDone: boolean }).practiceAudioDone,
          ),
        { timeout: 20000 },
      )
      .toBe(true);
    await page.keyboard.up('Space');
    const result = page.getByRole('region', { name: 'Resultado del reto', exact: true });
    await expect(result).toBeVisible({ timeout: 60000 });
    await expect(result.locator('.practice-transcript')).not.toHaveText('');
    observed.push({
      index,
      transcript: await result.locator('.practice-transcript').textContent(),
      state: await result.getAttribute('class'),
      result: await result.innerText(),
    });
    // Never falsify ASR success: retain the actual output, then use the normal
    // correction route if speech did not match or D intentionally omits #8.
    if (!(await result.getAttribute('class'))!.includes('green')) {
      await page.getByRole('button', { name: 'Completar o corregir', exact: true }).click();
      const editor = page.getByRole('dialog', { name: 'Corregir práctica', exact: true });
      await choose(
        editor,
        'Evento',
        index === 2 ? 'Penalti cometido' : index === 3 ? 'Exclusión' : 'Gol',
      );
      await choose(editor, 'Equipo', `Equipo de práctica ${index < 2 ? 1 : 2}`);
      if (index === 1) {
        await choose(editor, 'Jugador principal', '#7 Marta');
        await choose(editor, 'Jugador relacionado', '#9 Elena');
      } else if (index === 2) {
        await choose(editor, 'Jugador principal', '#12 Sin nombre');
        await choose(editor, 'Jugador relacionado', '#9 Elena');
      } else if (index === 3) await choose(editor, 'Jugador principal', '#8 Sin nombre');
      await editor.getByRole('button', { name: 'Comprobar jugada', exact: true }).click();
      await expect(editor).toHaveCount(0);
    }
    await expect(result).toHaveClass(/green/);
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as unknown as { practiceTracks: MediaStreamTrack[] }).practiceTracks.every(
            (track) => track.readyState === 'ended',
          ),
        ),
      )
      .toBe(true);
    await page.screenshot({ path: info.outputPath(`real-challenge-${index + 1}.png`) });
    if (index === 0) await context.setOffline(true);
    await page
      .getByRole('button', {
        name: index === 3 ? 'Terminar entrenamiento' : 'Siguiente jugada',
        exact: true,
      })
      .click();
  }
  const recognitionPath = info.outputPath('real-recognition.json');
  await writeFile(recognitionPath, JSON.stringify(observed, null, 2));
  await info.attach('real-recognition.json', {
    path: recognitionPath,
    contentType: 'application/json',
  });
  await expect(page.getByText('PRÁCTICA COMPLETADA', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Volver a la aplicación', exact: true }).click();
  await page.getByRole('button', { name: 'Practicar voz', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar a la práctica', exact: true }).click();
  await page.getByRole('button', { name: 'Entendido · Vamos a practicar', exact: true }).click();
  await page.evaluate(() =>
    Object.assign(window, { practiceFile: 'goal.wav', practiceAudioDone: false }),
  );
  await expect(page.locator('.hold-to-talk')).toBeEnabled();
  await page.locator('.hold-to-talk').focus();
  await page.keyboard.down('Space');
  await expect(page.locator('.hold-to-talk')).toHaveClass(/recording/);
  await page.getByRole('button', { name: 'Salir de la práctica', exact: true }).click();
  await page.keyboard.up('Space');
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { practiceTracks: MediaStreamTrack[] }).practiceTracks.every(
          (track) => track.readyState === 'ended',
        ),
      ),
    )
    .toBe(true);
  expect(modelRequests).toBe(1);
  await page.goto('/#/equipos');
  await expect(page.getByText('Tu primer equipo', { exact: true })).toBeVisible();
  await page.goto('/#/partidos');
  await expect(page.locator('.match-card')).toHaveCount(0);
  await page.goto('/#/ajustes');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia ZIP', exact: true }).click();
  const backupPath = info.outputPath('practice-does-not-export.zip');
  await (await download).saveAs(backupPath);
  const backup = JSON.parse(
    strFromU8(unzipSync(await readFile(backupPath))['handball-stats.json']),
  );
  for (const key of ['teams', 'players', 'matches', 'events']) expect(backup[key]).toEqual([]);
});
