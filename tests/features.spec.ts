import { selectShirtNumber } from './wheel-helpers';
import { selectWheelOption } from './wheel-helpers';
import { serveModels, prepareMatchVoice } from './voice-helpers';
import { test, expect } from '@playwright/test';
async function spanish(page: import('@playwright/test').Page, skip = true) {
  await page.addInitScript(
    ({ skip }) => {
      if (!localStorage.getItem('handball-language')) {
        localStorage.setItem('handball-language', 'es');
      }
      if (skip) {
        localStorage.setItem('handball-welcome-v1', 'done');
      }
    },
    { skip },
  );
}
async function match(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Nuevo partido/ }).click();
  for (const [label, name] of [
    ['Equipo 1 (nuestro)', 'La Jota'],
    ['Equipo 2 (rival)', 'Rival'],
  ]) {
    const group = page.getByRole('group', { name: label, exact: true });
    await group.getByRole('button', { name: 'Nuevo', exact: true }).click();
    await page.getByLabel(label, { exact: true }).fill(name);
  }
  await prepareMatchVoice(page);
  await page.getByRole('button', { name: 'Iniciar partido' }).click();
  await expect(page.getByLabel('Marcador 0 a 0')).toBeVisible();
}
test('first-use gallery changes language, persists completion and reopens from settings', async ({
  page,
}, info) => {
  await spanish(page, false);
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await selectWheelOption(dialog.getByRole('listbox', { name: 'Idioma', exact: true }), 'English');
  await expect(
    dialog.getByRole('heading', { name: 'Watch the match. Describe the play.' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.screenshot({ path: info.outputPath('welcome-en.png') });
  for (let i = 0; i < 4; i++) {
    await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await expect(dialog.getByText('Track the two minutes', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Get started', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Every play counts.' })).toBeVisible();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Main menu', exact: true })
    .getByRole('link', { name: 'Settings', exact: true })
    .click();
  await page.getByRole('button', { name: 'View welcome guide' }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Skip guide' }).click();
  for (const [language, label] of [
    ['Español', 'Tus datos'],
    ['Deutsch', 'Deine Daten'],
    ['Français', 'Vos données'],
    ['Italiano', 'I tuoi dati'],
    ['Nederlands', 'Je gegevens'],
    ['Polski', 'Twoje dane'],
  ]) {
    await selectWheelOption(page.locator('.language-picker').getByRole('listbox'), language);
    await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
test('three independent suspension timers persist, pause with match clock and signal expiry', async ({
  page,
  context,
}, info) => {
  test.setTimeout(90000);
  await serveModels(context);
  await spanish(page);
  await page.addInitScript(() => {
    const probe = window as unknown as {
      exclusionNotes: { frequency: number; start: number; stop: number }[];
    };
    probe.exclusionNotes = [];
    const createOscillator = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = createOscillator.call(this);
      const note = { frequency: 0, start: 0, stop: 0 };
      probe.exclusionNotes.push(note);
      const start = oscillator.start.bind(oscillator);
      const stop = oscillator.stop.bind(oscillator);
      oscillator.start = (when = 0) => {
        note.frequency = oscillator.frequency.value;
        note.start = when;
        start(when);
      };
      oscillator.stop = (when = 0) => {
        note.stop = when;
        stop(when);
      };
      return oscillator;
    };
  });
  await page.clock.install({ time: new Date('2026-10-16T12:00:00Z') });
  await match(page);
  await expect(page.getByRole('button', { name: 'Sonido activado', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  for (let i = 1; i <= 3; i++) {
    await page
      .getByRole('group', { name: `Exclusión ${i}`, exact: true })
      .getByRole('button', { name: 'Activar', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    if (i < 3) {
      await selectShirtNumber(dialog, 'Dorsal (opcional)', String(i + 6));
    }
    await dialog.getByRole('button', { name: /Activar/ }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('group', { name: `Exclusión ${i}`, exact: true })).toContainText(
      i < 3 ? `#${i + 6}` : '—',
    );
  }
  await page.reload();
  const slots = page.locator('.exclusion-timer');
  await expect(slots).toHaveCount(3);
  await expect(slots.nth(0)).toContainText('#7');
  expect((await page.locator('.match-header').boundingBox())!.height).toBeLessThan(260);
  expect((await slots.nth(0).boundingBox())!.height).toBeLessThan(72);
  await page.clock.fastForward(30000);
  await expect(page.getByRole('timer', { name: 'Reloj del partido' })).toHaveText(/^00:3[0-9]$/);
  await expect(slots.nth(0).locator('.timer-digits')).toHaveText(/^01:(2[5-9]|30)$/);
  await page.locator('.clock-actions').getByRole('button', { name: 'Parar', exact: true }).click();
  await expect(
    page.locator('.clock-actions').getByRole('button', { name: 'Reanudar', exact: true }),
  ).toBeVisible();
  const paused = await slots.nth(0).locator('.timer-digits').textContent();
  await page.clock.fastForward(60000);
  await expect(slots.nth(0).locator('.timer-digits')).toHaveText(paused!);
  await slots.nth(1).getByRole('button', { name: 'Parar', exact: true }).click();
  await expect(slots.nth(1).getByRole('button', { name: 'Reanudar', exact: true })).toBeVisible();
  const individuallyPaused = await slots.nth(1).locator('.timer-digits').textContent();
  await page
    .locator('.clock-actions')
    .getByRole('button', { name: 'Reanudar', exact: true })
    .click();
  await expect(
    page.locator('.clock-actions').getByRole('button', { name: 'Parar', exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(121000);
  await expect(slots.nth(0)).toContainText('Puede volver');
  await expect(slots.nth(2)).toContainText('Puede volver');
  await expect(slots.nth(1).locator('.timer-digits')).toHaveText(individuallyPaused!);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { exclusionNotes: unknown[] }).exclusionNotes.length,
      ),
    )
    .toBe(4);
  const notes = await page.evaluate(
    () =>
      (
        window as unknown as {
          exclusionNotes: { frequency: number; start: number; stop: number }[];
        }
      ).exclusionNotes,
  );
  expect(notes.map((note) => note.frequency)).toEqual([880, 660, 880, 660]);
  expect(
    Math.max(...notes.map((note) => note.stop)) - Math.min(...notes.map((note) => note.start)),
  ).toBeCloseTo(5);
  await page.getByRole('button', { name: 'Sonido activado', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Aviso sonoro', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('exclusions.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await slots.nth(0).getByRole('button', { name: 'Liberar' }).click();
  await expect(slots.nth(0).getByRole('button', { name: 'Activar' })).toBeVisible();
  await expect(page.getByLabel('Marcador 0 a 0')).toBeVisible();
  await expect(page.locator('.event-card')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Voz (mantener)' })).toBeEnabled({
    timeout: 30000,
  });
  await expect(page.getByRole('button', { name: 'Grabar con un toque' })).toHaveCount(0);
  await page.evaluate(async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('cactus-needle-')) {
        await caches.delete(key);
      }
    }
  });
  await page.reload();
  await expect(
    page.getByRole('alert').filter({ hasText: 'El reconocimiento de voz no está preparado' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Voz (mantener)' })).toBeDisabled();
});
