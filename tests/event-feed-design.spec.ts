import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { eventFeedFixture } from './fixtures/event-feed';
import { eventTypes } from '../src/domain/event-definitions';
import { validateBackup } from '../src/domain/backup';
import { contrast } from './color-helpers';

async function restore(page: Page, longNames = false) {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const data = eventFeedFixture(longNames);
  validateBackup(data);
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'feed-design.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  await expect(page.locator('.event-card')).toHaveCount(data.events.length);
  return data;
}

const card = (page: Page, id: string) => page.locator(`[data-event-id="${id}"]`);

/** A taller capture viewport avoids painting sticky match controls over an isolated card export. */
async function captureCard(page: Page, entry: Locator, path: string) {
  const viewport = page.viewportSize()!;
  const height = Math.ceil((await entry.boundingBox())!.height);
  await page.setViewportSize({
    width: viewport.width,
    height: Math.max(viewport.height, height + 1000),
  });
  try {
    await entry.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await entry.screenshot({ path, style: '.match-header, .capture-bar { visibility: hidden; }' });
  } finally {
    await page.setViewportSize(viewport);
  }
}

for (const width of [320, 390, 430])
  for (const colorScheme of ['light', 'dark'] as const)
    test(`${width}px ${colorScheme}: every event state keeps team identity, icon hierarchy and enlarged text`, async ({
      page,
    }, info) => {
      await page.setViewportSize({
        width,
        height: width === 320 ? 568 : width === 390 ? 664 : 932,
      });
      await page.emulateMedia({ colorScheme });
      const fixture = await restore(page, width === 320);
      const first = card(page, 'feed-goal'),
        second = card(page, 'feed-save');
      await expect(first.locator('.event-team-name')).toHaveText(fixture.teams[0].name);
      await expect(second.locator('.event-team-name')).toHaveText(fixture.teams[1].name);
      await expect(first.locator('.event-team-label')).toHaveText('Equipo 1');
      await expect(second.locator('.event-team-label')).toHaveText('Equipo 2');
      await expect(first.locator('.event-team')).toHaveCSS('background-color', 'rgb(255, 214, 0)');
      await expect(second.locator('.event-team')).toHaveCSS('background-color', 'rgb(41, 45, 50)');
      await expect(first).toHaveCSS(
        'background-color',
        colorScheme === 'light' ? 'rgb(255, 253, 240)' : 'rgb(42, 40, 30)',
      );
      await expect(second).toHaveCSS(
        'background-color',
        colorScheme === 'light' ? 'rgb(241, 243, 245)' : 'rgb(35, 39, 43)',
      );
      await expect(page.locator('.event-team')).toHaveCount(fixture.events.length);
      const teamHeadings = await page.locator('.event-team').allTextContents();
      expect(teamHeadings.every((heading) => !/\b(nuestro|rival)\b/i.test(heading))).toBe(true);
      await expect(page.locator('.event-feed')).not.toContainText('Registrado');
      await expect(page.locator('.event-menu')).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Deshacer creación', exact: true }),
      ).toHaveCount(0);
      for (const type of eventTypes) {
        const entry = card(page, 'feed-' + type);
        await expect(entry.locator('.event-symbol')).toHaveAttribute('aria-hidden', 'true');
        await expect(entry.locator('.event-symbol')).toHaveCSS('width', '34px');
        await expect(entry.locator('.event-icon')).toHaveCSS('width', '52px');
        await expect(entry.locator('.event-icon')).toHaveCSS('height', '52px');
        await expect(entry.locator('.event-title')).toHaveCSS('font-size', '16px');
        await expect(entry.locator('time')).toHaveCSS('font-size', '14px');
      }
      for (const [id, reason] of [
        ['missing-event', 'Selecciona un evento'],
        ['missing-team', 'Selecciona un equipo'],
        ['missing-infraction', 'Selecciona el tipo de infracción'],
        ['invalid-change', 'El jugador que sale y el que entra deben ser distintos.'],
        ['missing-note', 'Escribe el texto de la nota'],
      ]) {
        await expect(card(page, id).locator('.event-status')).toHaveText(
          '! Pendiente · no computa',
        );
        await expect(card(page, id).locator('.event-issues')).toContainText(reason);
        await expect(
          card(page, id).getByRole('button', { name: 'Completar', exact: true }),
        ).toHaveCount(1);
      }
      await expect(card(page, 'missing-event').locator('.event-team-name')).toHaveText(
        fixture.teams[0].name,
      );
      await expect(card(page, 'missing-team').locator('.event-team-name')).toHaveText(
        'Equipo pendiente',
      );
      await expect(card(page, 'feed-note').locator('.event-team-name')).toHaveText(
        'Nota del partido',
      );
      await expect(card(page, 'feed-note').locator('.event-team-label')).toHaveCount(0);
      await expect(card(page, 'unidentified-player').locator('.event-player')).toHaveText(
        'Sin identificar',
      );
      await expect(card(page, 'unidentified-player').locator('.event-status')).toHaveCount(0);
      await expect(card(page, 'feed-substitution').locator('.event-player')).toHaveText([
        'Sale: #9 · Zoë',
        'Entra: #0 · Sin nombre',
      ]);
      await expect(card(page, 'unidentified-incoming').locator('.event-player')).toHaveText([
        'Sale: #9 · Zoë',
        'Entra: Sin identificar',
      ]);
      await expect(first.locator('.event-metadata')).toHaveText('7 m');
      await expect(card(page, 'feed-infraction').locator('.event-metadata')).toHaveText('Pasos');
      await expect(card(page, 'feed-disqualification').locator('.event-metadata')).toHaveText(
        'Tarjeta azul',
      );
      if (width === 390 && colorScheme === 'light') {
        await captureCard(page, card(page, 'missing-team'), info.outputPath('pending-team.png'));
        await captureCard(page, card(page, 'missing-event'), info.outputPath('pending-event.png'));
        await captureCard(page, card(page, 'feed-note'), info.outputPath('match-note.png'));
      }
      const colors = await page.locator('.event-card').evaluateAll((cards) =>
        cards.map((card) => {
          const style = (selector: string) => getComputedStyle(card.querySelector(selector)!);
          return {
            body: getComputedStyle(card).backgroundColor,
            text: style('.event-copy').color,
            time: style('time').color,
            header: style('.event-team').backgroundColor,
            headerText: style('.event-team').color,
            icon: style('.event-icon').backgroundColor,
            iconText: style('.event-icon').color,
          };
        }),
      );
      for (const color of colors) {
        expect(contrast(color.text, color.body)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(color.time, color.body)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(color.headerText, color.header)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(color.iconText, color.icon)).toBeGreaterThanOrEqual(3);
      }
      for (const scale of [1, 2]) {
        await page.evaluate((scale) => {
          document.documentElement.style.fontSize = `${scale * 100}%`;
        }, scale);
        await expect(first.locator('.event-title')).toHaveCSS('font-size', `${scale * 16}px`);
        await expect(first.locator('.event-player').first()).toHaveCSS(
          'font-size',
          `${scale * 16}px`,
        );
        await expect(first.locator('time')).toHaveCSS('font-size', `${scale * 14}px`);
        for (const id of ['feed-goal', 'feed-save', 'feed-note']) {
          const transcript = card(page, id).locator('.event-original');
          await expect(transcript).toHaveText(
            fixture.events.find((event) => event.id === id)!.rawText,
          );
          await expect(transcript).toBeVisible();
          await expect(transcript).toHaveCSS('white-space', 'pre-wrap');
          expect(await transcript.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect(
          await page
            .locator('.event-card, .event-team-name, .event-copy')
            .evaluateAll((elements) =>
              elements.every((el) => el.scrollWidth <= el.clientWidth + 1),
            ),
        ).toBe(true);
        await captureCard(page, first, info.outputPath(`team-one-${scale}x.png`));
        if (scale === 1) await captureCard(page, second, info.outputPath('team-two.png'));
      }
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '100%';
      });
      const note = card(page, 'feed-note').locator('.event-details');
      await expect(note).toHaveJSProperty('open', false);
      await note.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(note).toHaveJSProperty('open', true);
      await expect(note.locator('.event-note')).toHaveText(
        fixture.events.find((event) => event.id === 'feed-note')!.note,
      );
      expect(
        await note
          .locator('p')
          .evaluateAll((paragraphs) => paragraphs.every((p) => p.scrollWidth <= p.clientWidth)),
      ).toBe(true);
      const edit = card(page, 'feed-note').getByRole('button', { name: 'Editar', exact: true });
      await edit.click();
      const editor = page.getByRole('dialog', { name: 'Editar evento', exact: true });
      await expect(editor.locator('.event-action-choices button[aria-pressed="true"]')).toHaveText(
        'Nota',
      );
      await expect(editor.locator('.event-action-choices .event-symbol').first()).toHaveCSS(
        'width',
        '28px',
      );
      for (const button of await editor.locator('.event-editor-footer .actions button').all())
        await expect(button).toBeInViewport({ ratio: 1 });
      await page.keyboard.press('Escape');
      await expect(editor).toHaveCount(0);
      await expect(edit).toBeFocused();
      await expect(note).toHaveJSProperty('open', true);
    });

test('high contrast and reading the cards preserve labels, keyboard controls and every stored collection', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await page.emulateMedia({ forcedColors: 'active' });
  const fixture = await restore(page);
  for (const entry of [card(page, 'feed-goal'), card(page, 'feed-save')]) {
    await expect(entry.locator('.event-team-label')).toHaveText(/Equipo [12]/);
    const remove = entry.locator('.delete-event');
    await expect(remove).toHaveText('');
    const box = (await remove.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
    await remove.focus();
    await page.keyboard.press('Enter');
    const confirmation = page.getByRole('dialog', { name: 'Eliminar evento', exact: true });
    await page.keyboard.press('Escape');
    await expect(confirmation).toHaveCount(0);
    await expect(remove).toBeFocused();
  }
  await card(page, 'feed-save').screenshot({ path: info.outputPath('forced-colors.png') });
  await page.goto('/#/ajustes');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia ZIP', exact: true }).click();
  const path = info.outputPath('unchanged.zip');
  await (await download).saveAs(path);
  const backup = JSON.parse(strFromU8(unzipSync(await readFile(path))['handball-stats.json']));
  for (const key of ['teams', 'players', 'matches', 'events'] as const)
    expect(backup[key]).toEqual([...fixture[key]].sort((a, b) => a.id.localeCompare(b.id)));
});
