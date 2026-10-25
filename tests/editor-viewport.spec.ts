import { editNote } from './editor-helpers';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';

type ViewportControl = {
  showKeyboard: (height: number, top: number) => void;
};

async function expectActionsVisible(editor: Locator, height: number, top = 0) {
  for (const name of [/^Guardar (evento|pendiente)$/, /^Cancelar$/]) {
    const button = editor.getByRole('button', { name });
    await expect(button).toBeInViewport({ ratio: 1 });
    await expect
      .poll(() =>
        button.evaluate(
          (element, bounds) => {
            const box = element.getBoundingClientRect();
            return box.top >= bounds.top && box.bottom <= bounds.top + bounds.height;
          },
          { height, top },
        ),
      )
      .toBe(true);
  }
  await expect(editor).toHaveJSProperty('scrollTop', 0);
}

async function keyboardViewport(page: Page, height: number, top: number) {
  await page.evaluate(
    ({ height, top }) => {
      (window as unknown as ViewportControl).showKeyboard(height, top);
    },
    { height, top },
  );
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
    const viewport = window.visualViewport!;
    const nativeHeight = Object.getOwnPropertyDescriptor(VisualViewport.prototype, 'height')!.get!;
    const nativeTop = Object.getOwnPropertyDescriptor(VisualViewport.prototype, 'offsetTop')!.get!;
    let keyboard: { height: number; top: number } | null = null;
    Object.defineProperty(viewport, 'height', {
      get: () => keyboard?.height ?? nativeHeight.call(viewport),
    });
    Object.defineProperty(viewport, 'offsetTop', {
      get: () => keyboard?.top ?? nativeTop.call(viewport),
    });
    (window as unknown as ViewportControl).showKeyboard = (height, top) => {
      keyboard = { height, top };
      viewport.dispatchEvent(new Event('resize'));
      viewport.dispatchEvent(new Event('scroll'));
    };
  });
});

for (const mode of ['manual', 'voice event'] as const) {
  test(`${mode}: save and cancel stay visible while fields scroll and the keyboard pans`, async ({
    page,
    context,
  }, info) => {
    const backup = reportFixture();
    backup.events = [backup.events.find((event) => event.id === 'e1')!];
    backup.events[0].rawText = 'Gol nuestro dorsal siete. '.repeat(200);
    await page.goto('/#/ajustes');
    await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
      name: 'match.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.goto('/#/partidos/report-match');
    await page
      .getByRole('button', { name: mode === 'manual' ? 'Evento manual' : 'Editar', exact: true })
      .click();
    const editor = page.getByRole('dialog');
    const fields = editor.locator('.event-editor-fields');
    await expectActionsVisible(editor, page.viewportSize()!.height);
    for (const viewport of [
      { height: 420, top: 0 },
      { height: 340, top: 120 },
      { height: 220, top: 50 },
    ]) {
      await keyboardViewport(page, viewport.height, viewport.top);
      for (const scrollPosition of [0, 500, 100000]) {
        await fields.evaluate((element, top) => element.scrollTo(0, top), scrollPosition);
        await expectActionsVisible(editor, viewport.height, viewport.top);
      }
    }
    if (mode === 'voice event') {
      // A conflict message must not push the actions behind the keyboard either.
      const otherWindow = await context.newPage();
      await otherWindow.goto('/#/partidos/report-match');
      await otherWindow.getByRole('button', { name: 'Editar', exact: true }).click();
      const otherEditor = otherWindow.getByRole('dialog');
      await editNote(otherEditor);
      await otherEditor
        .getByRole('textbox', { name: 'Nota', exact: true })
        .fill('Actualizado en otra ventana');
      await otherEditor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
      await expect(otherEditor).toHaveCount(0);
      await otherWindow.close();
      await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
      await expect(editor.getByRole('alert')).toContainText('otra ventana');
      await expectActionsVisible(editor, 220, 50);
    }
    await page.screenshot({ path: info.outputPath('editor-keyboard.png') });
    await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(editor).toHaveCount(0);
  });
}
