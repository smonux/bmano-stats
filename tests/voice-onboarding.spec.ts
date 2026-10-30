import { test, expect } from '@playwright/test';
import { choose } from './editor-helpers';
import { selectWheelOption } from './wheel-helpers';

test('a fresh launch starts voice training, can be skipped by keyboard and stays dismissed after reload', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1000, height: 664 });
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    Object.assign(window, { onboardingMicrophones: 0 });
    navigator.mediaDevices.getUserMedia = async () => {
      (window as unknown as { onboardingMicrophones: number }).onboardingMicrophones++;
      throw new Error('Onboarding must not request a microphone before recording');
    };
  });
  await page.goto('/');
  const practice = page.locator('.voice-practice');
  await expect(
    practice.getByRole('heading', { name: 'Registra el partido por voz y gestos.' }),
  ).toBeFocused();
  await expect(
    practice.getByRole('heading', { name: 'Registra el partido por voz y gestos.' }),
  ).toBeInViewport({ ratio: 1 });
  const language = practice.locator('.practice-language summary');
  await language.focus();
  await language.press('Enter');
  await selectWheelOption(
    practice.getByRole('listbox', { name: 'Idioma', exact: true }),
    'English',
  );
  await expect(
    practice.getByRole('heading', { name: 'Record the match with voice and gestures.' }),
  ).toBeVisible();
  await selectWheelOption(
    practice.getByRole('listbox', { name: 'Language', exact: true }),
    'Español',
  );
  await language.press('Enter');
  await expect(practice.locator('.practice-grammar')).toHaveCount(0);
  await expect(practice).toContainText('introducir los datos con más precisión');
  const continueButton = practice.getByRole('button', {
    name: 'Continuar a la práctica',
    exact: true,
  });
  await continueButton.focus();
  await expect(continueButton).toBeInViewport({ ratio: 1 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('first-launch-welcome.png'), fullPage: true });
  await continueButton.press('Enter');
  await expect(practice.getByRole('heading', { name: 'Una jugada. Cuatro piezas.' })).toBeVisible();
  await expect(practice.locator('.practice-grammar li')).toHaveText([
    /Evento/,
    /Equipo/,
    /Jugador 1/,
    /Jugador 2/,
  ]);
  await expect(practice).toContainText('«Gol nuestro» ya sirve');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const microphoneRequests = () =>
    page.evaluate(
      () => (window as unknown as { onboardingMicrophones: number }).onboardingMicrophones,
    );
  expect(await microphoneRequests()).toBe(0);
  await page.reload();
  await expect(
    practice.getByRole('heading', { name: 'Registra el partido por voz y gestos.' }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath('first-launch-training.png'), fullPage: true });
  const skip = practice.getByRole('button', { name: 'Salir de la práctica', exact: true });
  await skip.focus();
  await expect(skip).toBeInViewport({ ratio: 1 });
  await skip.press('Enter');
  await expect(practice).toHaveCount(0);
  await expect(page.locator('.dashboard-grid')).toBeVisible();
  expect(await microphoneRequests()).toBe(0);
  await page.reload();
  await expect(practice).toHaveCount(0);
  await expect(page.locator('.dashboard-grid')).toBeVisible();
  await page.goto('/#/ajustes');
  await page.getByRole('button', { name: 'Practicar voz', exact: true }).click();
  await expect(practice).toBeVisible();
});

test('first-launch training can finish all four challenges manually without voice preparation', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('handball-language', 'es'));
  await page.goto('/');
  const practice = page.locator('.voice-practice');
  await practice.getByRole('button', { name: 'Continuar a la práctica', exact: true }).click();
  await practice
    .getByRole('button', { name: 'Entendido · Vamos a practicar', exact: true })
    .click();
  for (let index = 0; index < 4; index++) {
    await expect(practice.getByText(`Jugada ${index + 1} de 4`, { exact: true })).toBeVisible();
    await practice.getByRole('button', { name: 'Completar manualmente', exact: true }).click();
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
    await expect(practice.locator('.practice-result')).toHaveClass(/green/);
    await practice
      .getByRole('button', {
        name: index === 3 ? 'Terminar entrenamiento' : 'Siguiente jugada',
        exact: true,
      })
      .click();
  }
  await expect(practice).toContainText('4 de 4 retos completados · 4 con ayuda.');
  await practice.getByRole('button', { name: 'Volver a la aplicación', exact: true }).click();
  await expect(practice).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('handball-voice-practice-v1'))).toBe(
    'done',
  );
  await page.reload();
  await expect(practice).toHaveCount(0);
  await expect(page.locator('.dashboard-grid')).toBeVisible();
});

test('legacy welcome dismissal is respected, while explicit practice can still be reopened', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  await page.goto('/#/nuevo');
  await expect(page.getByRole('heading', { name: 'Nuevo partido', exact: true })).toBeVisible();
  await expect(page.locator('.voice-practice')).toHaveCount(0);
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  await page.getByRole('link', { name: 'Practicar voz', exact: true }).click();
  await expect(page.locator('.voice-practice')).toBeVisible();
  await page.getByRole('button', { name: 'Salir de la práctica', exact: true }).click();
  await expect(page).toHaveURL(/#\/nuevo$/);
});
