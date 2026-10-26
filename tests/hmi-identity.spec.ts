import { eventChoiceLabels } from '../src/components/event-editor/event-choice-labels';
import { choose } from './editor-helpers';
import { expect, test } from '@playwright/test';
import { definitions, eventTypes } from '../src/domain/event-definitions';
import { reportFixture } from './fixtures/report';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
});

test('every event keeps its label and perspective with the new decorative vector icons', async ({
  page,
}, info) => {
  const backup = reportFixture();
  const template = backup.events[0];
  backup.events = eventTypes.map((type, index) => ({
    ...template,
    id: `icon-${type}`,
    type,
    teamId: type === 'note' ? null : index % 2 ? 'b' : 'a',
    primaryPlayerId: null,
    relatedPlayerId: null,
    minute: index,
    period: 1,
    orderKey: index,
    metadata: type === 'infraction' ? { infraction: 'Pasos' } : {},
    note: type === 'note' ? 'Recordar hablar con el equipo al descanso.' : '',
  }));
  backup.events.push({
    ...template,
    id: 'unknown-event',
    type: null,
    teamId: null,
    primaryPlayerId: null,
    minute: 20,
    orderKey: 20,
    metadata: {},
  });
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'icons.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');

  for (const [index, type] of eventTypes.entries()) {
    const card = page.locator('.event-card').filter({
      has: page.locator('.event-title', { hasText: new RegExp(`^${definitions[type].label}$`) }),
    });
    await expect(card).toHaveCount(1);
    const icon = card.locator('.event-symbol');
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(icon).toHaveAttribute('stroke', 'currentColor');
    await expect(icon).toHaveCSS(
      'color',
      index % 2 && type !== 'note' ? 'rgb(255, 255, 255)' : 'rgb(23, 23, 23)',
    );
    if (type !== 'note') {
      await expect(card.locator('.event-team-name')).toHaveText(index % 2 ? 'Rival' : 'La Jota');
      await expect(card.locator('.event-team-label')).toHaveText(
        index % 2 ? 'Equipo 2' : 'Equipo 1',
      );
      await expect(card.getByRole('img')).toHaveCount(0); // Visible team text; decorative event icon.
    }
  }
  const pending = page.locator('.event-card').filter({ hasText: 'Evento sin indicar' });
  await expect(pending.locator('.event-symbol')).toHaveCount(0);
  await expect(pending).toContainText('Pendiente · no computa');
  await expect(page.getByLabel('Marcador 1 a 0', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('event-icons.png'), fullPage: true });
  if (info.project.name === 'mobile') {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 664 },
      { width: 430, height: 932 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: info.outputPath(`icons-${viewport.width}x${viewport.height}.png`),
        fullPage: true,
      });
    }
  }
});

test('favicon and install icons use the chosen artwork and remain available offline', async ({
  page,
  context,
}) => {
  await page.goto('/');
  const logo = page.locator('.brand-mark img');
  await expect(logo).toHaveAttribute('alt', '');
  await expect(logo).toHaveJSProperty('naturalWidth', 512);
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await (await page.request.get(manifestUrl!)).json();
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: '/icon.svg', type: 'image/svg+xml' }),
      expect.objectContaining({ src: '/icon-192.png', sizes: '192x192' }),
      expect.objectContaining({ src: '/icon-512.png', sizes: '512x512', purpose: 'any maskable' }),
    ]),
  );
  const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  await page.evaluate(async () => navigator.serviceWorker.ready);
  // An initial visit installs the worker; the next navigation is under its control.
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await context.route('**/*', (route) => route.abort('internetdisconnected'));
  const dimensions = await page.evaluate(async (apple) => {
    const result = [];
    for (const src of ['/icon.svg', '/icon-192.png', '/icon-512.png', apple!]) {
      const icon = new Image();
      icon.src = src;
      await icon.decode();
      result.push([icon.naturalWidth, icon.naturalHeight]);
    }
    return result;
  }, apple);
  expect(dimensions).toEqual([
    [512, 512],
    [192, 192],
    [512, 512],
    [180, 180],
  ]);
});

test('manual selection shows event icons and short labels while keeping the event unselected until chosen', async ({
  page,
}, info) => {
  const backup = reportFixture();
  backup.events = [];
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'manual-icons.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog');
  await expect(editor.locator('.event-action-choices [aria-pressed="true"]')).toHaveCount(0);
  for (const type of eventTypes) {
    const option = editor.getByRole('button', { name: eventChoiceLabels[type], exact: true });
    await expect(option.locator('.event-symbol')).toHaveCount(1);
    await expect(option.locator('.event-symbol')).toHaveAttribute('aria-hidden', 'true');
  }
  await choose(editor, 'Equipo', 'La Jota');
  const goal = editor.getByRole('button', { name: 'Gol', exact: true });
  await goal.focus();
  await goal.press('Enter');
  await expect(goal).toHaveAttribute('aria-pressed', 'true');
  await expect(editor.getByRole('group', { name: 'Datos del evento', exact: true })).toBeFocused();
  await page.screenshot({ path: info.outputPath('manual-event-icons.png') });
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.getByLabel('Marcador 1 a 0', { exact: true })).toBeVisible();
  await expect(page.locator('.event-card .event-symbol')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.event-card .event-symbol')).toHaveCount(1);
});
