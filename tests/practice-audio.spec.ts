import { expect, test } from '@playwright/test';
import { choose } from './editor-helpers';
import { continuePracticeAudio } from './practice-helpers';

test('audio has its own screen, requests the microphone only on check, and preserves the play and progress', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
    const probe = Object.assign(window, { micCalls: 0, closedTracks: 0, denyMicrophone: false });
    navigator.mediaDevices.getUserMedia = async () => {
      probe.micCalls++;
      if (probe.denyMicrophone) throw new DOMException('Permission denied', 'NotAllowedError');
      return { getTracks: () => [{ stop: () => probe.closedTracks++ }] } as unknown as MediaStream;
    };
  });
  const microphones = () =>
    page.evaluate(() => {
      const probe = window as unknown as { micCalls: number; closedTracks: number };
      return { calls: probe.micCalls, closed: probe.closedTracks };
    });
  await page.goto('/#/practica-voz?desde=%2Fajustes');
  await page.getByRole('button', { name: 'Continuar a la práctica', exact: true }).click();
  const title = page.getByRole('heading', {
    name: 'Configura el audio de la práctica',
    exact: true,
  });
  await expect(title).toBeFocused();
  await expect(page.locator('.practice-sentence')).toHaveCount(0);
  expect(await microphones()).toEqual({ calls: 0, closed: 0 });
  await page.getByRole('button', { name: 'Comprobar micrófono', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Micrófono comprobado', exact: true }),
  ).toBeVisible();
  expect(await microphones()).toEqual({ calls: 1, closed: 1 });
  await page.screenshot({ path: info.outputPath('audio-checked.png'), fullPage: true });
  await continuePracticeAudio(page);
  await page.getByRole('button', { name: 'Entendido · Vamos a practicar', exact: true }).click();
  await expect(page.getByRole('listbox', { name: 'Idioma de voz', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Completar manualmente', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Corregir práctica', exact: true });
  await choose(editor, 'Evento', 'Gol');
  await choose(editor, 'Equipo', 'Equipo de práctica 1');
  await choose(editor, 'Jugador principal', '#7 Marta');
  await editor.getByRole('button', { name: 'Comprobar jugada', exact: true }).click();
  await expect(editor).toHaveCount(0);
  const result = page.locator('.practice-result');
  await expect(result).toHaveClass(/green/);
  const original = await result.innerText();
  await page.getByRole('button', { name: 'Configurar audio', exact: true }).click();
  await expect(title).toBeFocused();
  await continuePracticeAudio(page);
  await expect(result).toHaveText(original, { useInnerText: true });
  await expect(result).toBeFocused();
  await page.getByRole('button', { name: 'Siguiente jugada', exact: true }).click();
  await expect(page.getByText('Jugada 2 de 4', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Configurar audio', exact: true }).click();
  await page.evaluate(() => Object.assign(window, { denyMicrophone: true }));
  await page.getByRole('button', { name: 'Comprobar micrófono', exact: true }).click();
  await expect.poll(microphones).toEqual({ calls: 2, closed: 1 });
  await continuePracticeAudio(page);
  await expect(page.getByText('Jugada 2 de 4', { exact: true })).toBeVisible();
  await expect(result).toHaveCount(0);
  await page.getByRole('button', { name: 'Salir de la práctica', exact: true }).click();
  await expect(page).toHaveURL(/#\/ajustes$/);
});
