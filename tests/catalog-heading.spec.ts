import { expect, test, type Locator } from '@playwright/test';
import { tr, type Language } from '../src/i18n';

const cases: [number, Language, number][] = [
  [320, 'es', 1],
  [390, 'es', 1],
  [430, 'es', 1],
  [320, 'es', 2],
  [390, 'pl', 2],
  [1440, 'de', 1],
];

async function expectWholeLabel(button: Locator) {
  const layout = await button.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const text = [...element.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
    )!;
    const range = document.createRange();
    range.selectNodeContents(text);
    const lines = [...range.getClientRects()].filter((rect) => rect.width > 0);
    return {
      lines: lines.length,
      inside: lines.every((rect) => rect.left >= bounds.left && rect.right <= bounds.right),
      width: bounds.width,
      height: bounds.height,
    };
  });
  expect(layout.lines).toBe(1);
  expect(layout.inside).toBe(true);
  expect(layout.width).toBeGreaterThanOrEqual(44);
  expect(layout.height).toBeGreaterThanOrEqual(44);
}

for (const [width, language, scale] of cases)
  test(`catalog ${width}px ${language} ${scale}x: team and player actions keep whole words`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 800 });
    await page.addInitScript((language) => {
      localStorage.setItem('handball-language', language);
      localStorage.setItem('handball-welcome-v1', 'done');
    }, language);
    await page.goto('/#/equipos');
    await page.evaluate((scale) => {
      document.documentElement.style.fontSize = `${scale * 100}%`;
    }, scale);
    const t = (source: string) => tr(source, {}, language);
    const add = page.locator('.page-heading > .primary');
    await expect(add).toHaveAccessibleName(t('Equipo'));
    await expectWholeLabel(add);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await add.focus();
    await expect(add).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath('add-team.png') });
    await add.press('Enter');
    const teamDialog = page.getByRole('dialog', { name: t('Nuevo equipo'), exact: true });
    await expect(teamDialog).toBeVisible();
    const name = 'Club de Balonmano Zaragoza ' + 'NombreLargo'.repeat(6);
    await teamDialog.getByRole('textbox', { name: t('Nombre del equipo'), exact: true }).fill(name);
    await teamDialog.getByRole('button', { name: t('Crear equipo'), exact: true }).click();
    await expect(teamDialog).toHaveCount(0);
    await expect(page.locator('.page-heading h1')).toHaveText(name);
    await expect(add).toHaveAccessibleName(t('Jugador'));
    await expectWholeLabel(add);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await add.focus();
    await expect(add).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath('add-player-long-team.png') });
    await add.press('Enter');
    const playerDialog = page.getByRole('dialog', { name: t('Jugador'), exact: true });
    await expect(playerDialog).toBeVisible();
    await playerDialog.press('Escape');
    await expect(playerDialog).toHaveCount(0);
    await expect(add).toBeFocused();
  });
