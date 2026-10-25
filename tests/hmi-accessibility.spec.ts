import { expect, test, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';
async function restore(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
    const viewport = visualViewport!;
    let size: { height: number; top: number } | null = null;
    const height = Object.getOwnPropertyDescriptor(VisualViewport.prototype, 'height')!.get!,
      top = Object.getOwnPropertyDescriptor(VisualViewport.prototype, 'offsetTop')!.get!;
    Object.defineProperty(viewport, 'height', { get: () => size?.height ?? height.call(viewport) });
    Object.defineProperty(viewport, 'offsetTop', { get: () => size?.top ?? top.call(viewport) });
    (window as unknown as { keyboard: (height: number, top: number) => void }).keyboard = (
      height,
      top,
    ) => {
      size = { height, top };
      viewport.dispatchEvent(new Event('resize'));
      viewport.dispatchEvent(new Event('scroll'));
    };
  });
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'a11y.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(reportFixture())),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function keyboard(page: Page, height: number, top = 0) {
  await page.evaluate(
    ({ height, top }) =>
      (window as unknown as { keyboard: (height: number, top: number) => void }).keyboard(
        height,
        top,
      ),
    { height, top },
  );
}
test('all tab groups expose panels and one Tab stop with arrows/Home/End', async ({
  page,
}, info) => {
  await restore(page);
  await page.goto('/#/partidos/report-match');
  const tabs = page.getByRole('tablist', { name: 'Vista del partido', exact: true });
  const events = tabs.getByRole('tab').first(),
    stats = tabs.getByRole('tab').last();
  await events.focus();
  await events.press('ArrowRight');
  await expect(stats).toBeFocused();
  await expect(stats).toHaveAttribute('aria-selected', 'true');
  await expect(events).toHaveAttribute('tabindex', '-1');
  const panel = page.locator('#' + (await stats.getAttribute('aria-controls')));
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute(
    'aria-labelledby',
    (await stats.getAttribute('id')) as string,
  );
  const inner = page.getByRole('tablist', { name: 'Tipo de estadísticas', exact: true });
  await inner.getByRole('tab').first().focus();
  await page.keyboard.press('End');
  await expect(inner.getByRole('tab').last()).toBeFocused();
  await expect(inner.getByRole('tab').last()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(inner.getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');
  await stats.focus();
  await stats.press('ArrowRight');
  await expect(events).toBeFocused();
  await page.screenshot({ path: info.outputPath('tabs-keyboard.png') });
});
for (const form of ['team', 'player', 'counter'])
  test(`${form} form keeps save/cancel visible with keyboard and restores focus`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await restore(page);
    if (form === 'counter') {
      await page.goto('/#/partidos/report-match');
      await page.getByRole('button', { name: 'Iniciar contador', exact: true }).click();
    } else {
      await page.goto(form === 'team' ? '/#/equipos' : '/#/equipos/a');
      await page
        .getByRole('button', { name: form === 'team' ? 'Equipo' : 'Jugador', exact: true })
        .click();
    }
    const dialog = page.getByRole('dialog');
    const save = dialog.locator('.dialog-footer .primary'),
      cancel = dialog.getByRole('button', { name: 'Cancelar', exact: true });
    for (const height of [420, 340, 220]) {
      await keyboard(page, height, 20);
      await expect(save).toBeInViewport({ ratio: 1 });
      await expect(cancel).toBeInViewport({ ratio: 1 });
      await expect
        .poll(() =>
          save.evaluate((el, height) => el.getBoundingClientRect().bottom <= height + 20, height),
        )
        .toBe(true);
      await expect(dialog).toHaveJSProperty('scrollTop', 0);
    }
    if (form === 'counter') {
      const wheel = dialog.getByRole('listbox').first();
      await wheel.focus();
      await expect(wheel.getByRole('option', { selected: true })).toBeInViewport({ ratio: 1 });
    } else {
      const input = dialog.locator('input:not([type="checkbox"])').first();
      await input.focus();
      await expect(input).toBeInViewport({ ratio: 1 });
    }
    await page.screenshot({ path: info.outputPath(`${form}-keyboard.png`) });
    await cancel.click();
    await expect(dialog).toHaveCount(0);
  });

test('a rejected team name stays editable and its error is associated with the field', async ({
  page,
}) => {
  await restore(page);
  await page.goto('/#/equipos');
  await page.getByRole('button', { name: 'Equipo', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const name = dialog.getByRole('textbox', { name: 'Nombre del equipo', exact: true });
  await name.fill('La Jota');
  await dialog.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  const error = dialog.getByRole('alert');
  await expect(error).toContainText('Ya existe');
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAttribute(
    'aria-describedby',
    (await error.getAttribute('id')) as string,
  );
  await name.fill('Equipo nuevo');
  await dialog.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  await expect(dialog).toHaveCount(0);
});
