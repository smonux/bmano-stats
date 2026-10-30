import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { tr, type Language } from '../src/i18n';
import { contrast } from './color-helpers';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
for (const [language, width, scale, dark] of [
  ['es', 320, 1, false],
  ['de', 390, 2, true],
  ['pl', 430, 1, true],
] as [Language, number, number, boolean][])
  test(`drawer identifies the build at ${width}px, ${language}, ${scale}x`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 568 });
    await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light' });
    await page.addInitScript((language) => {
      localStorage.setItem('handball-language', language);
      localStorage.setItem('handball-welcome-v1', 'done');
    }, language);
    await page.goto('/');
    await page.evaluate(
      (scale) => (document.documentElement.style.fontSize = `${scale * 100}%`),
      scale,
    );
    const menu = page.getByRole('button', { name: tr('Abrir menú', {}, language), exact: true });
    await menu.click();
    const drawer = page.getByRole('dialog', {
      name: tr('Menú principal', {}, language),
      exact: true,
    });
    const build = drawer.getByRole('group', { name: tr('Versión de la aplicación', {}, language) });
    await build.scrollIntoViewIfNeeded();
    await expect(build).toBeInViewport({ ratio: 1 });
    await expect(build.locator('span')).toHaveText(`v${version}`);
    await expect(build.locator('code')).toHaveText(/^[a-f0-9]{8}$/i);
    if (process.env.EXPECTED_BUILD_COMMIT)
      await expect(build.locator('code')).toHaveText(process.env.EXPECTED_BUILD_COMMIT.slice(0, 8));
    const colors = await build.evaluate((element) => ({
      background: getComputedStyle(element.closest('dialog')!).backgroundColor,
      small: getComputedStyle(element.querySelector('small')!).color,
      smallSize: parseFloat(getComputedStyle(element.querySelector('small')!).fontSize),
      versionSize: parseFloat(getComputedStyle(element).fontSize),
    }));
    expect(contrast(colors.small, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(colors.smallSize).toBeLessThan(colors.versionSize);
    expect(await drawer.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath('drawer-version.png') });
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(menu).toBeFocused();
  });
