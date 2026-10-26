import { choose, editContext } from './editor-helpers';
import { expect, test, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { nameKey } from '../src/domain/identity';

async function restore(page: Page, longNames = false) {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const backup = reportFixture();
  if (longNames) {
    backup.teams[0].name =
      'Club Balonmano La Jota de Zaragoza equipo femenino infantil con nombre completo para identificarlo';
    backup.teams[1].name =
      'Asociación Deportiva Rival de Balonmano equipo masculino cadete con un nombre igualmente extenso';
    for (const team of backup.teams) team.nameKey = nameKey(team.name);
  }
  const timer = backup.matches[0].exclusions![0]!;
  backup.matches[0].exclusions = [
    { ...timer, dorsal: 7 },
    { ...timer, id: 'second', teamId: 'b', dorsal: 9, remainingMs: 120000 },
    { ...timer, id: 'third', dorsal: 99, remainingMs: 0 },
    null,
  ];
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'readability.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
  return backup;
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

function contrast(first: string, second: string) {
  const luminance = (color: string) => {
    const values = color
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  const a = luminance(first),
    b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 664 },
  { width: 1440, height: 1000 },
]) {
  test(`operational text and touch targets stay readable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    const backup = await restore(page, true);
    const minimumFonts: [string, number][] = [
      ['.scoreboard .eyebrow', 14],
      ['.scoreboard h2', 16],
      ['.score', 36],
      ['.minute', 24],
      ['.event-title', 16],
      ['.event-copy p', 16],
      ['.event-copy time', 14],
      ['.event-bottom .caption', 14],
      ['.timer-player', 14],
      ['.timer-digits', 20],
      ['.timer-state', 14],
      ['.capture-bar > button', 16],
      ['.match-tabs button', 16],
    ];
    for (const [selector, size] of minimumFonts) {
      for (const element of await page.locator(selector).all()) {
        expect(
          await element.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
        ).toBeGreaterThanOrEqual(size);
      }
    }
    for (const button of await page
      .locator(
        '.clock-actions button, .match-secondary-actions > button, .exclusion-heading button, .timer-clear, .event-actions > button, .event-menu > summary, .filter-chip, .match-tabs button',
      )
      .all()) {
      const bounds = (await button.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(48);
      expect(bounds.height).toBeGreaterThanOrEqual(48);
    }
    for (const card of await page.locator('.event-card').all()) {
      const summary = card.locator('.event-menu > summary');
      await summary.focus();
      await summary.press('Enter');
      const edit = (await card
        .getByRole('button', { name: /^(Editar|Completar)$/, exact: true })
        .boundingBox())!;
      const remove = (await card.locator('.delete-event').boundingBox())!;
      expect(
        Math.max(remove.x - edit.x - edit.width, remove.y - edit.y - edit.height),
      ).toBeGreaterThanOrEqual(8);
      await summary.press('Enter');
    }
    for (const button of await page.locator('.capture-bar > button').all()) {
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(56);
    }
    const preparationLink = page.locator('.capture-status a');
    const linkBounds = (await preparationLink.boundingBox())!;
    expect(linkBounds.width).toBeGreaterThanOrEqual(44);
    expect(linkBounds.height).toBeGreaterThanOrEqual(44);
    await noOverflow(page);
    const nameButton = page.locator('.team-name-button').first();
    await nameButton.focus();
    await nameButton.press('Enter');
    const names = page.locator('.match-team-names');
    await expect(names.locator('dd')).toHaveText(backup.teams.map((team) => team.name));
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(nameButton).toBeFocused();
    if (viewport.width === 390) {
      const usable = await page.evaluate(
        () =>
          innerHeight -
          document.querySelector('.match-header')!.getBoundingClientRect().height -
          document.querySelector('.capture-bar')!.getBoundingClientRect().height,
      );
      expect(usable).toBeGreaterThan(332);
    }
    await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
    const editor = page.getByRole('dialog');
    for (const label of [/^Guardar pendiente$/, /^Cancelar$/]) {
      const button = editor.getByRole('button', { name: label });
      await expect(button).toBeInViewport({ ratio: 1 });
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(56);
    }
    expect(
      await editor
        .getByRole('button', { name: 'Gol', exact: true })
        .evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    await noOverflow(page);
    await page.screenshot({ path: info.outputPath('readable-editor.png') });
  });
}

test('context wheel remains aligned after text enlargement and native scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await restore(page);
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog');
  await editContext(editor);
  const wheel = editor.getByRole('listbox', { name: 'Tiempo', exact: true });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await expect
    .poll(() =>
      wheel.evaluate((element) => {
        const option = element.querySelector<HTMLElement>('[aria-selected="true"]')!;
        return Math.abs(
          option.getBoundingClientRect().top +
            option.getBoundingClientRect().height / 2 -
            element.getBoundingClientRect().top -
            element.clientHeight / 2,
        );
      }),
    )
    .toBeLessThan(2);
  await wheel.evaluate((element) => {
    element.scrollTo({ top: 0 });
  });
  await expect(wheel.getByRole('option', { selected: true })).toHaveText('Tiempo 1');
  await choose(editor, 'Evento', 'Infracción');
  await choose(editor, 'Equipo', 'La Jota');
  await choose(editor, 'Tipo de infracción', 'Pasos');
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator('.event-card').filter({ hasText: 'T1 · 9′' })).toContainText('Pasos');
  await noOverflow(page);
});

test('200 percent text keeps manual actions accessible on a narrow screen', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await restore(page);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await noOverflow(page);
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog');
  for (const name of ['Guardar pendiente', 'Cancelar']) {
    await expect(editor.getByRole('button', { name, exact: true })).toBeInViewport({ ratio: 1 });
  }
  expect(await editor.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const selected = editor.getByRole('button', { name: 'Gol', exact: true });
  await selected.scrollIntoViewIfNeeded();
  await expect(selected).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: info.outputPath('text-200-percent.png') });
  await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
});

test('leaving a context wheel commits its visible row before immediate save', async ({ page }) => {
  await restore(page);
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog');
  await choose(editor, 'Evento', 'Lanzamiento fallado');
  await choose(editor, 'Equipo', 'La Jota');
  await editContext(editor);
  const wheel = editor.getByRole('listbox', { name: 'Tiempo', exact: true });
  await wheel.focus();
  await wheel.evaluate((element) => {
    element.scrollTop = 0;
    element.dispatchEvent(new Event('scroll'));
    element.blur();
  });
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(
    page.locator('.event-card').filter({ hasText: 'T1 · 9′' }).locator('.event-title'),
  ).toHaveText('Lanzamiento fallado');
  await expect(page.getByLabel('Marcador 3 a 2', { exact: true })).toBeVisible();
});

test('primary and focused controls have measurable contrast and chart labels remain readable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await restore(page);
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog');
  const save = editor.getByRole('button', { name: 'Guardar pendiente', exact: true });
  await page.keyboard.press('Tab');
  await save.focus();
  const colors = await save.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      text: style.color,
      background: style.backgroundColor,
      outline: style.outlineColor,
      outlineWidth: parseFloat(style.outlineWidth),
      outlineStyle: style.outlineStyle,
    };
  });
  expect(contrast(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(colors.outline, colors.background)).toBeGreaterThanOrEqual(3);
  expect(colors.outlineWidth).toBeGreaterThanOrEqual(2);
  expect(colors.outlineStyle).not.toBe('none');
  await editContext(editor);
  const input = editor.getByLabel('Minuto', { exact: true });
  const border = await input.evaluate((element) => ({
    border: getComputedStyle(element).borderTopColor,
    background: getComputedStyle(element).backgroundColor,
  }));
  expect(contrast(border.border, border.background)).toBeGreaterThanOrEqual(3);
  await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('tab', { name: 'Estadísticas', exact: true }).click();
  for (const text of await page.locator('.period-charts svg text').all()) {
    const renderedSize = await text.evaluate((element) => {
      const scale = (element as SVGGraphicsElement).getScreenCTM()!;
      return parseFloat(getComputedStyle(element).fontSize) * Math.hypot(scale.a, scale.b);
    });
    expect(renderedSize).toBeGreaterThanOrEqual(12);
  }
  await noOverflow(page);
});
