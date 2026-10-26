import { expect, test } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
for (const width of [320, 390])
  test(`four common-clock timers keep complete digits at ${width}px and restore legacy backup`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 664 });
    await page.addInitScript(() => {
      localStorage.setItem('handball-language', 'es');
      localStorage.setItem('handball-welcome-v1', 'done');
    });
    const fixture = reportFixture(),
      timer = fixture.matches[0].exclusions![0]!;
    const legacy = {
      ...fixture,
      version: 1,
      matches: [
        {
          ...fixture.matches[0],
          exclusions: [99000, 101000, 112000].map((remainingMs, index) => ({
            ...timer,
            id: 'legacy-' + index,
            dorsal: index === 0 ? 0 : index === 1 ? 99 : null,
            teamId: index === 1 ? 'b' : 'a',
            remainingMs,
            running: false,
            startedAt: null,
          })),
        },
      ],
    };
    await page.goto('/#/ajustes');
    await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
      name: 'legacy.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(legacy)),
    });
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const next = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar copia ZIP', exact: true }).click();
    const file = info.outputPath('v2.zip');
    await (await next).saveAs(file);
    const exported = JSON.parse(strFromU8(unzipSync(await readFile(file))['handball-stats.json']));
    expect(exported.version).toBe(2);
    expect(exported.matches[0].exclusions).toHaveLength(4);
    expect(
      exported.matches[0].exclusions
        .slice(0, 3)
        .map((timer: { remainingMs: number }) => timer.remainingMs),
    ).toEqual([99000, 101000, 112000]);
    await page.goto('/#/partidos/report-match');
    const add = page.getByRole('button', { name: 'Iniciar contador', exact: true });
    const time = page.getByRole('button', { name: 'Nuevo tiempo', exact: true });
    expect(Math.abs((await add.boundingBox())!.y - (await time.boundingBox())!.y)).toBeLessThan(2);
    await add.click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Activar/ })
      .click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.exclusion-timer')).toHaveCount(4);
    await expect(add).toHaveCount(0);
    await expect(page.locator('.timer-digits')).toHaveText(['01:39', '01:41', '01:52', '02:00']);
    expect(
      await page
        .locator('.exclusion-grid')
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length),
    ).toBe(2);
    for (const digit of await page.locator('.timer-digits').all()) {
      expect(
        await digit.evaluate((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const lines = [...range.getClientRects()];
          const parent = el.parentElement!.getBoundingClientRect();
          return lines.length === 1 && lines[0].width <= parent.width + 1;
        }),
      ).toBe(true);
    }
    await page.getByRole('button', { name: 'Ver 4 contadores de exclusión', exact: true }).click();
    const captureTop = (await page.locator('.capture-bar').boundingBox())!.y;
    for (const digits of await page.locator('.timer-digits').all()) {
      const bounds = (await digits.boundingBox())!;
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(captureTop);
    }
    await page.screenshot({ path: info.outputPath('four-counters.png') });
    await page.clock.install();
    const base = await page.evaluate(() => Date.now());
    await page.clock.setFixedTime(base);
    const clock = page.locator('.clock-actions');
    await clock.getByRole('button', { name: 'Reanudar', exact: true }).click();
    await expect(clock.getByRole('button', { name: 'Parar', exact: true })).toBeVisible();
    await page.clock.setFixedTime(base + 10000);
    await page.clock.runFor(1000);
    await expect(page.locator('.timer-digits')).toHaveText(['01:29', '01:31', '01:42', '01:50']);
    await clock.getByRole('button', { name: 'Parar', exact: true }).click();
    await expect(clock.getByRole('button', { name: 'Reanudar', exact: true })).toBeVisible();
    await page.clock.setFixedTime(base + 70000);
    await page.clock.runFor(1000);
    await expect(page.locator('.timer-digits')).toHaveText(['01:29', '01:31', '01:42', '01:50']);
    await expect(
      page.locator('.exclusion-timer').getByRole('button', { name: /^(Parar|Reanudar)$/ }),
    ).toHaveCount(0);
    await page
      .getByRole('group', { name: 'Exclusión 2', exact: true })
      .getByRole('button', { name: 'Liberar', exact: true })
      .click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.exclusion-timer')).toHaveCount(3);
    await expect(page.locator('.event-card')).toHaveCount(9);
    await page.reload();
    await expect(page.locator('.timer-digits')).toHaveText(['01:29', '01:42', '01:50']);
    await expect(page.getByLabel('Marcador 3 a 2', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
