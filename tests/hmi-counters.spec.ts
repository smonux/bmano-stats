import { test, expect, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { nameKey } from '../src/domain/identity';

async function restore(page: Page, count: number, longNames = false) {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const backup = reportFixture();
  backup.events = [];
  const timer = backup.matches[0].exclusions![0]!;
  backup.matches[0].exclusions = [0, 1, 2].map((index) =>
    index < count
      ? {
          ...timer,
          id: 'timer-' + index,
          teamId: index === 1 ? 'b' : 'a',
          dorsal: index === 0 ? 0 : index === 1 ? 99 : null,
          remainingMs: index === 2 ? 0 : 60000,
        }
      : null,
  );
  if (longNames) {
    backup.teams[0].name =
      'Club Balonmano La Jota de Zaragoza equipo femenino infantil con nombre completo para identificarlo';
    backup.teams[1].name =
      'Asociación Deportiva Rival de Balonmano equipo masculino cadete con un nombre igualmente extenso';
    for (const team of backup.teams) team.nameKey = nameKey(team.name);
  }
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'counters.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
}

test('empty counters use a single entry; starting without shirt does not add an event or score', async ({
  page,
}, info) => {
  await restore(page, 0);
  await expect(page.locator('.exclusion-timer')).toHaveCount(0);
  const add = page.getByRole('button', { name: 'Iniciar contador', exact: true });
  await expect(add).toHaveCount(1);
  await expect(
    page.getByText('El contador no añade una exclusión al registro.', { exact: true }),
  ).toBeVisible();
  await add.focus();
  await add.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Activar · 02:00', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.exclusion-timer')).toHaveCount(1);
  await expect(page.locator('.timer-player')).toHaveText('1 · —');
  await expect(
    page.getByRole('button', { name: 'Ver contador de exclusión', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Marcador 0 a 0')).toBeVisible();
  await expect(page.locator('.event-card')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.exclusion-timer')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('one-counter.png') });
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 664 },
  { width: 844, height: 390 },
  { width: 1440, height: 1000 },
])
  test(`three active counters stay reachable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    await restore(page, 3, true);
    await expect(page.locator('.exclusion-timer')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Iniciar contador', exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByRole('group', { name: 'Exclusión 3', exact: true })).toContainText(
      'Puede volver',
    );
    await expect(
      page
        .getByRole('group', { name: 'Exclusión 1', exact: true })
        .getByRole('button', { name: 'Reanudar', exact: true }),
    ).toHaveAttribute('aria-description', /La Jota.*#0.*Pausado.*01:00/);
    const access = page.getByRole('button', { name: 'Ver 3 contadores de exclusión', exact: true });
    await expect(access).toHaveAttribute('aria-description', 'Puede volver');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await access.scrollIntoViewIfNeeded();
    await access.focus();
    await access.press('Enter');
    const section = page.getByRole('region', { name: 'Cuenta atrás de exclusiones', exact: true });
    await expect(section).toBeFocused();
    const header = page.locator('.match-header');
    if (await header.evaluate((element) => getComputedStyle(element).position === 'sticky')) {
      expect((await section.boundingBox())!.y).toBeGreaterThanOrEqual(
        (await header.boundingBox())!.y + (await header.boundingBox())!.height,
      );
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath(`three-${viewport.width}x${viewport.height}.png`),
    });
    await page
      .getByRole('group', { name: 'Exclusión 3', exact: true })
      .getByRole('button', { name: 'Liberar', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Ver 2 contadores de exclusión', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar contador', exact: true })).toBeVisible();
  });
