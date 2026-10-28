import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { writeFile, readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { reportFixture } from '../fixtures/report';
import { choose } from '../editor-helpers';
import { selectWheelOption } from '../wheel-helpers';

test('PACKAGED-ASSET BROWSER HARNESS: first launch without cache or internet loads Whistle and cancels audio on background', async ({
  page,
  context,
}, info) => {
  test.setTimeout(120000);
  const external: string[] = [];
  const resources: string[] = [];
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    resources.push(url);
    if (!url.startsWith('http://127.0.0.1:4175/')) {
      external.push(url);
      return route.abort();
    }
    if (url.endsWith('/native-test.wav'))
      return route.fulfill({
        path: resolve('tests/fixtures/practice/goal.wav'),
        contentType: 'audio/wav',
      });
    await route.continue();
  });
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    const probe = window as unknown as {
      micCalls: number;
      done: boolean;
      tracks: MediaStreamTrack[];
    };
    probe.micCalls = 0;
    probe.tracks = [];
    navigator.mediaDevices.getUserMedia = async () => {
      probe.micCalls++;
      const audio = new AudioContext();
      await audio.resume();
      const source = audio.createBufferSource();
      source.buffer = await audio.decodeAudioData(
        await (await fetch('/native-test.wav')).arrayBuffer(),
      );
      const destination = audio.createMediaStreamDestination();
      source.connect(destination);
      probe.done = false;
      source.onended = () => {
        probe.done = true;
      };
      for (const track of destination.stream.getTracks()) {
        probe.tracks.push(track);
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
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Una jugada. Cuatro piezas.' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { micCalls: number }).micCalls)).toBe(0);
  expect(await page.evaluate(() => caches.keys())).toEqual([]);
  await page.getByRole('button', { name: 'Entendido · Vamos a practicar', exact: true }).click();
  await selectWheelOption(
    page.getByRole('listbox', { name: 'Idioma de voz', exact: true }),
    'Español',
  );
  const talk = page.locator('.hold-to-talk');
  try {
    await expect(talk).toBeEnabled({ timeout: 60000 });
  } catch (error) {
    await writeFile(
      info.outputPath('startup-failure.json'),
      JSON.stringify(
        { external, resources, text: await page.locator('body').innerText() },
        null,
        2,
      ),
    );
    throw error;
  }
  await talk.focus();
  await page.keyboard.down('Space');
  await expect(talk).toHaveClass(/recording/);
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { done: boolean }).done))
    .toBe(true);
  await page.keyboard.up('Space');
  const result = page.locator('.practice-result');
  await expect(result).toBeVisible({ timeout: 60000 });
  await expect(result.locator('.practice-transcript')).not.toHaveText('');
  await writeFile(
    info.outputPath('packaged-runtime.json'),
    JSON.stringify({ external, resources, result: await result.innerText() }, null, 2),
  );
  expect(external).toEqual([]);
  expect(resources.filter((url) => url.endsWith('/models/whistle.cact'))).toHaveLength(1);
  expect(resources.some((url) => url.includes('.wasm'))).toBe(true);
  expect(await page.evaluate(() => caches.keys())).toEqual([]);
  await page.getByRole('button', { name: 'Repetir jugada', exact: true }).click();
  await talk.focus();
  await page.keyboard.down('Space');
  await expect(talk).toHaveClass(/recording/);
  await page.evaluate(() => window.dispatchEvent(new Event('handball:inactive')));
  await page.keyboard.up('Space');
  await expect(talk).not.toHaveClass(/recording/);
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { tracks: MediaStreamTrack[] }).tracks.every(
          (track) => track.readyState === 'ended',
        ),
      ),
    )
    .toBe(true);
  await expect(result).toHaveCount(0);
  await page.getByRole('button', { name: 'Completar manualmente', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Corregir práctica' });
  await choose(editor, 'Evento', 'Gol');
  await choose(editor, 'Equipo', 'Equipo de práctica 1');
  await editor.getByRole('button', { name: 'Comprobar jugada', exact: true }).click();
  await expect(result).toHaveClass(/green/);
  await page.getByRole('button', { name: 'Salir de la práctica', exact: true }).click();
  await page.goto('/#/partidos');
  await expect(page.locator('.match-card')).toHaveCount(0);
});

test('PACKAGED-ASSET BROWSER HARNESS: backup survives reload and PDF worker/fonts remain local', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const fixture = reportFixture();
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  const exported = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia ZIP', exact: true }).click();
  const zipPath = info.outputPath('restored.zip');
  await (await exported).saveAs(zipPath);
  const backup = JSON.parse(strFromU8(unzipSync(await readFile(zipPath))['handball-stats.json']));
  const byId = (rows: { id: string }[]) => [...rows].sort((a, b) => a.id.localeCompare(b.id));
  expect(byId(backup.teams)).toEqual(byId(fixture.teams));
  expect(byId(backup.players)).toEqual(byId(fixture.players));
  expect(byId(backup.events)).toEqual(byId(fixture.events));
  await page.goto('/#/partidos/report-match');
  await page.getByRole('tab', { name: 'Estadísticas', exact: true }).click();
  const pdf = page.getByRole('button', { name: /^(Enviar PDF a…|Descargar PDF)$/ });
  await expect(pdf).toBeEnabled({ timeout: 30000 });
  const download = page.waitForEvent('download');
  await pdf.click();
  const pdfPath = info.outputPath('packaged-report.pdf');
  await (await download).saveAs(pdfPath);
  expect((await readFile(pdfPath)).subarray(0, 5).toString()).toBe('%PDF-');
});
