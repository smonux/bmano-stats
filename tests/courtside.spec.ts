import { test, expect, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { readShirtNumber, selectShirtNumber, selectWheelOption } from './wheel-helpers';

async function restoreMatch(page: Page) {
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(reportFixture())),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/partidos/report-match');
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
});

test('left drawer contains all destinations, closes on navigation and restores focus', async ({
  page,
}, info) => {
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'Abrir menú', exact: true });
  await expect(page.locator('.mobile-nav, .desktop-nav')).toHaveCount(0);
  await opener.click();
  const drawer = page.getByRole('dialog', { name: 'Menú principal', exact: true });
  await expect(drawer.getByRole('link')).toHaveText([
    'Inicio',
    'Equipos',
    'Partidos',
    'Estadísticas',
    'Ajustes',
  ]);
  await expect(opener).toHaveAttribute('aria-expanded', 'true');
  expect((await drawer.boundingBox())!.x).toBe(0);
  await page.screenshot({ path: info.outputPath('navigation.png') });
  await drawer.getByRole('link', { name: 'Equipos', exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Equipos', exact: true })).toBeVisible();
  await opener.click();
  await expect(drawer.getByRole('link', { name: 'Equipos', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(opener).toBeFocused();
  await opener.click();
  await drawer.getByRole('link', { name: 'Ajustes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tus datos', exact: true })).toBeVisible();
});

test('compact exclusion strip and digit wheels preserve optional zero and roster selection', async ({
  page,
}, info) => {
  await restoreMatch(page);
  expect((await page.locator('.clock-row').boundingBox())!.height).toBeLessThanOrEqual(52);
  for (const counter of await page.locator('.exclusion-timer').all()) {
    expect((await counter.boundingBox())!.height).toBeLessThanOrEqual(48);
  }
  await page
    .getByRole('group', { name: 'Exclusión 2', exact: true })
    .getByRole('button', { name: 'Activar', exact: true })
    .click();
  await selectShirtNumber(page.getByRole('dialog'), 'Dorsal (opcional)', '0');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Activar/ })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Exclusión 2', exact: true })).toContainText('#0');
  await page.screenshot({ path: info.outputPath('compact-counters.png') });
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog');
  const wheel = (name: string) => editor.getByRole('listbox', { name, exact: true });
  await selectWheelOption(wheel('Evento'), 'Gol');
  await selectWheelOption(wheel('Equipo'), 'La Jota');
  await selectWheelOption(wheel('Jugador principal'), '#7 Ana Łukasz');
  await expect.poll(() => readShirtNumber(editor, 'Dorsal principal')).toBe('7');
  for (const number of ['0', '99', '7']) {
    await selectShirtNumber(editor, 'Dorsal principal', number);
    await expect(wheel('Jugador principal').getByRole('option', { selected: true })).toHaveText(
      number === '7' ? '#7 Ana Łukasz' : `#${number} · Dorsal nuevo`,
    );
  }
  await page.screenshot({ path: info.outputPath('digits.png') });
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(page.getByLabel('Marcador 4 a 2', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('group', { name: 'Exclusión 2', exact: true })).toContainText('#0');
});

for (const supported of [true, false]) {
  test(`rotation preserves editing when portrait locking is ${supported ? 'supported' : 'refused'}`, async ({
    page,
  }) => {
    await page.addInitScript((supported) => {
      let fullscreen = false;
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => (fullscreen ? document.documentElement : null),
      });
      Object.defineProperty(Element.prototype, 'requestFullscreen', {
        configurable: true,
        value: async () => {
          fullscreen = true;
          document.dispatchEvent(new Event('fullscreenchange'));
        },
      });
      document.exitFullscreen = async () => {
        fullscreen = false;
        document.dispatchEvent(new Event('fullscreenchange'));
      };
      Object.defineProperty(screen.orientation, 'lock', {
        configurable: true,
        value: async () => {
          if (!supported || !fullscreen) throw new DOMException('Cannot lock', 'SecurityError');
        },
      });
    }, supported);
    await restoreMatch(page);
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
    await page.getByRole('button', { name: 'Fijar vertical', exact: true }).click();
    if (supported) {
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
      await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'Orientación vertical fijada', exact: true }),
      ).toBeDisabled();
      await page.keyboard.press('Escape');
    } else {
      await expect(page.getByText(/Este navegador no permite fijar la orientación/)).toBeVisible();
      expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(false);
    }
    await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
    const editor = page.getByRole('dialog');
    await selectWheelOption(editor.getByRole('listbox', { name: 'Evento', exact: true }), 'Gol');
    await selectWheelOption(
      editor.getByRole('listbox', { name: 'Equipo', exact: true }),
      'La Jota',
    );
    await editor.getByRole('textbox', { name: 'Nota', exact: true }).fill('Se conserva al girar');
    const viewport = page.viewportSize()!;
    await page.setViewportSize({ width: viewport.height, height: viewport.width });
    await page.evaluate(() => screen.orientation.dispatchEvent(new Event('change')));
    await expect(editor.getByRole('textbox', { name: 'Nota', exact: true })).toHaveValue(
      'Se conserva al girar',
    );
    await expect(
      editor
        .getByRole('listbox', { name: 'Equipo', exact: true })
        .getByRole('option', { selected: true }),
    ).toHaveText('La Jota');
    await expect(
      editor.getByRole('button', { name: 'Guardar evento', exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
  });
}
