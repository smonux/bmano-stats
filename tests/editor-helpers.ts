import { type Locator } from '@playwright/test';

/** Helpers follow the visible routes instead of reaching into collapsed controls. */
export async function choose(editor: Locator, label: string, value: string) {
  if (label === 'Evento') {
    const frequent = ['Gol', 'Parada', 'Pérdida', 'Lanzamiento fallado'];
    if (
      !frequent.includes(value) &&
      (await editor.locator('.more-actions').getAttribute('aria-expanded')) === 'false'
    ) {
      await editor.locator('.more-actions').click();
    }
    const group = editor.getByRole('group', {
      name: frequent.includes(value) ? 'Evento' : 'Más acciones',
      exact: true,
    });
    await group.getByRole('button', { name: value, exact: true }).click();
    return;
  }
  if (label === 'Jugador relacionado') await expand(editor.locator('.related-participant'));
  await editor
    .getByRole('group', { name: label, exact: true })
    .getByRole('button', { name: value, exact: true })
    .click();
}

export async function expand(details: Locator) {
  if (!(await details.evaluate((element) => (element as HTMLDetailsElement).open)))
    await details.locator(':scope > summary').click();
}
export async function editContext(editor: Locator) {
  const button = editor.locator('.event-context > button');
  if ((await button.getAttribute('aria-expanded')) === 'false') await button.click();
}
export async function editNote(editor: Locator) {
  await expand(editor.locator('.event-additional'));
}
