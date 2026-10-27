import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { reportFixture } from './fixtures/report';
import { nameKey } from '../src/domain/identity';
import { validateBackup } from '../src/domain/backup';
import { matchScore } from '../src/presentation/matches';
import { tr, type Language } from '../src/i18n';

const cases: [number, number, Language, number][] = [
  [320, 568, 'de', 0],
  [360, 640, 'fr', 7],
  [390, 664, 'es', 30],
  [390, 844, 'pl', 7],
  [430, 932, 'nl', 30],
  [844, 390, 'it', 0],
  [768, 1024, 'en', 30],
  [1440, 1000, 'es', 7],
];
async function restore(page: Page, language: Language, roster: number) {
  await page.addInitScript((language) => {
    localStorage.setItem('handball-language', language);
    localStorage.setItem('handball-welcome-v1', 'done');
  }, language);
  const data = reportFixture();
  for (const team of data.teams) {
    team.name = (team.id + ' ' + 'NombreEquipo'.repeat(12)).slice(0, 100);
    team.nameKey = nameKey(team.name);
  }
  data.players = data.players.filter((player) => player.isUnknown);
  for (const team of data.teams)
    for (let index = 0; index < roster; index++)
      data.players.push({
        id: team.id + index,
        teamId: team.id,
        dorsal: index,
        name: ('NombreCompleto' + index + 'Apellido'.repeat(15)).slice(0, 100),
        isUnknown: false,
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null,
      });
  const template = data.events[0];
  data.events = Array.from({ length: 200 }, (_, index) => {
    const type =
      index % 5 === 4 ? null : index % 5 === 1 ? 'note' : index % 5 === 2 ? 'loss' : 'goal';
    return {
      ...template,
      id: 'matrix-' + index,
      type,
      teamId: type === 'note' || type === null ? null : index % 2 ? 'b' : 'a',
      primaryPlayerId: null,
      relatedPlayerId: null,
      period: 1 + Math.floor(index / 100),
      minute: index % 30,
      orderKey: index,
      metadata: {},
      note: 'Observación del partido.\n' + 'Texto largo '.repeat(30),
      rawText: 'Transcripción original ' + index + ' ' + 'palabra '.repeat(40),
    };
  });
  const timer = data.matches[0].exclusions![0]!;
  data.matches[0].exclusions = [
    timer,
    { ...timer, id: 'second', teamId: 'b', dorsal: 0, remainingMs: 120000 },
    { ...timer, id: 'third', dorsal: 99, remainingMs: 0 },
    null,
  ];
  validateBackup(data);
  await page.goto('/#/ajustes');
  await page.getByLabel(tr('Importar copia', {}, language), { exact: true }).setInputFiles({
    name: 'matrix.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: tr('Confirmar', {}, language), exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  return data;
}
for (const [width, height, language, roster] of cases)
  test(`matrix ${width}x${height} ${language} roster ${roster}: 200 plays, full names and touch/keyboard access`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    const data = await restore(page, language, roster);
    const t = (source: string) => tr(source, {}, language);
    await expect(page.locator('.event-card')).toHaveCount(200);
    await expect(
      page.getByLabel(
        tr(
          'Marcador {a} a {b}',
          { a: matchScore(data, data.matches[0])[0], b: matchScore(data, data.matches[0])[1] },
          language,
        ),
        { exact: true },
      ),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator('.team-name-button').first().click();
    await expect(page.locator('.match-team-names dd')).toHaveText(
      data.teams.map((team) => team.name),
    );
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const last = page.locator('.event-card').last();
    const edit = last.getByRole('button', {
      name: new RegExp(`^(${t('Editar')}|${t('Completar')})$`),
    });
    await edit.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(edit).toBeFocused();
    const visibleAction = await edit.boundingBox();
    const frame = await page.evaluate(() => {
      const header = document.querySelector('.match-header')!;
      return {
        top:
          getComputedStyle(header).position === 'sticky'
            ? header.getBoundingClientRect().bottom
            : 0,
        bottom: document.querySelector('.capture-bar')!.getBoundingClientRect().top,
      };
    });
    expect(visibleAction!.y).toBeGreaterThanOrEqual(frame.top);
    expect(visibleAction!.y + visibleAction!.height).toBeLessThanOrEqual(frame.bottom);
    const details = last.locator('.event-details');
    await expect(last.locator('.event-original')).toHaveText(data.events[0].rawText);
    await expect(last.locator('.event-original')).toBeVisible();
    await details.locator('summary').press('Enter');
    await expect(details).toHaveJSProperty('open', true);
    await expect(details.locator('.event-note')).toHaveText(data.events[0].note);
    await page.screenshot({ path: info.outputPath('matrix.png') });
    const measurement = await page.evaluate(() => {
      const header = document.querySelector('.match-header')!,
        bar = document.querySelector('.capture-bar')!;
      return {
        width: innerWidth,
        height: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        header: header.getBoundingClientRect().height,
        headerPosition: getComputedStyle(header).position,
        capture: bar.getBoundingClientRect().height,
      };
    });
    await writeFile(
      info.outputPath('measurement.json'),
      JSON.stringify({ ...measurement, language, roster, events: 200 }, null, 2),
    );
    await page.getByRole('button', { name: t('Evento manual'), exact: true }).click();
    const editor = page.getByRole('dialog');
    await expect(editor.locator('.team-choices [aria-pressed=true]')).toHaveCount(1);
    await expect(editor.locator('.event-action-choices [aria-pressed=true]')).toHaveCount(0);
    for (const button of await editor.locator('.event-editor-footer .actions button').all())
      await expect(button).toBeInViewport({ ratio: 1 });
    expect(await editor.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(editor).toHaveCount(0);
  });

test('200 percent text keeps save feedback, counter action and capture reachable without undo', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await restore(page, 'es', 7);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog');
  await editor
    .getByRole('group', { name: 'Equipo', exact: true })
    .getByRole('button')
    .first()
    .click();
  await editor
    .getByRole('group', { name: 'Evento', exact: true })
    .getByRole('button', { name: '2 min', exact: true })
    .click();
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('feedback-text-200.png') });
  for (const button of await page.locator('.capture-bar > button').all())
    await expect(button).toBeInViewport({ ratio: 1 });
  for (const button of await page.locator('.capture-feedback > button').all()) {
    await button.focus();
    // Native scroll positions round fractional CSS pixels; allow at most one pixel at an edge.
    await expect(button).toBeInViewport({ ratio: 0.99 });
    const box = (await button.boundingBox())!;
    const region = (await page.locator('.capture-feedback').boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(region.y - 1);
    expect(box.y + box.height).toBeLessThanOrEqual(region.y + region.height + 1);
  }
  await expect(page.getByRole('button', { name: 'Deshacer creación', exact: true })).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Iniciar contador de esta exclusión', exact: true })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
