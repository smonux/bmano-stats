import { eventTypes, definitions } from '../src/domain/event-definitions';
import { eventChoiceLabels } from '../src/components/event-editor/event-choice-labels';
import { type Locator } from '@playwright/test';

/** Helpers follow the visible routes instead of reaching into collapsed controls. */
export async function choose(editor: Locator, label: string, value: string) {
  if (label === 'Evento') {
    const type = eventTypes.find((type) => definitions[type].label === value);
    await editor
      .getByRole('group', { name: 'Evento', exact: true })
      .getByRole('button', { name: type ? eventChoiceLabels[type] : value, exact: true })
      .click();
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
  await editor.getByLabel('Nota', { exact: true }).scrollIntoViewIfNeeded();
}

/** Explicitly discard an edited draft; callers use ordinary Cancel for untouched forms. */
export async function discardEditor(editor: Locator) {
  await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await editor
    .page()
    .getByRole('dialog', { name: 'Descartar cambios', exact: true })
    .getByRole('button', { name: 'Descartar', exact: true })
    .click();
}
