import { chromium } from '@playwright/test';
import { copyFile, readFile } from 'node:fs/promises';

// Export the chosen vector artwork without changing its composition or colours.
const source = new URL('../handball-stats-icon.svg', import.meta.url);
const svg = await readFile(source);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
try {
  await copyFile(source, new URL('../public/icon.svg', import.meta.url));
  for (const [size, filename] of [
    [180, 'apple-touch-icon.png'],
    [192, 'icon-192.png'],
    [512, 'icon-512.png'],
  ]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<html><body style="margin:0"><img width="${size}" height="${size}" src="data:image/svg+xml;base64,${svg.toString('base64')}"></body></html>`,
    );
    await page.locator('img').evaluate((image) => image.decode());
    await page.screenshot({ path: new URL(`../public/${filename}`, import.meta.url).pathname });
    await page.close();
  }
} finally {
  await browser.close();
}
