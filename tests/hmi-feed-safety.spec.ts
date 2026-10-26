import { nameKey } from '../src/domain/identity';
import { selectShirtNumber } from './wheel-helpers';
import { expect, test, type Page } from '@playwright/test';
import { reportFixture } from './fixtures/report';
import { choose } from './editor-helpers';

async function restore(page: Page, mode: 'pending' | 'mixed' | 'delete' | 'long' = 'mixed') {
  await page.addInitScript(() => {
    localStorage.setItem('handball-language', 'es');
    localStorage.setItem('handball-welcome-v1', 'done');
  });
  const backup = reportFixture();
  const empty = backup.events.find((event) => event.id === 'e9')!;
  const ours = {
    ...backup.events.find((event) => event.id === 'e1')!,
    note: 'Nota visible\n' + 'TextoLargo'.repeat(80),
    rawText: 'Gol nuestro siete\nTranscripción original',
  };
  const theirs = {
    ...backup.events.find((event) => event.id === 'e2')!,
    note: '   ',
    rawText: 'Gol rival nueve',
  };
  backup.events =
    mode === 'delete' || mode === 'long'
      ? [ours, theirs]
      : [
          { ...empty, id: 'missing-event', teamId: 'a' },
          { ...empty, id: 'missing-team', type: 'goal' },
          {
            ...empty,
            id: 'missing-infraction',
            type: 'infraction',
            teamId: 'a',
            primaryPlayerId: 'a7',
          },
          {
            ...empty,
            id: 'invalid-substitution',
            type: 'substitution',
            teamId: 'a',
            primaryPlayerId: 'a7',
            relatedPlayerId: 'a7',
            note: 'Salida y entrada por corregir',
          },
          ours,
          theirs,
        ];
  if (mode === 'pending') backup.events = [empty];
  if (mode === 'long') {
    for (const team of backup.teams) {
      team.name = (team.id + ' Nombre de equipo muy largo '.repeat(8)).slice(0, 100).trim();
      team.nameKey = nameKey(team.name);
    }
    for (const player of backup.players.filter((player) => !player.isUnknown))
      player.name = 'Nombre personal muy largo '.repeat(8).slice(0, 100);
  }
  await page.goto('/#/ajustes');
  await page.getByLabel('Importar copia', { exact: true }).setInputFiles({
    name: 'feed.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // Use the app's navigation so Back/Forward exercise real history entries.
  await page.goto('/#/partidos');
  await page.locator('.match-card').first().click();
  await expect(
    page.locator('.match-page-title .badge').filter({ hasText: /^En curso$/ }),
  ).toBeVisible();
  return backup;
}
const card = (page: Page, id: string) => page.locator(`[data-event-id="${id}"]`);

test('pending reasons reuse domain validation and reading details stays separate from editing', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await restore(page);
  for (const [id, reason] of [
    ['missing-event', 'Selecciona un evento'],
    ['missing-team', 'Selecciona un equipo'],
    ['missing-infraction', 'Selecciona el tipo de infracción'],
    ['invalid-substitution', 'El jugador que sale y el que entra deben ser distintos.'],
  ]) {
    await expect(card(page, id).locator('.event-issues')).toContainText(reason);
    await expect(
      card(page, id).getByRole('button', { name: 'Completar', exact: true }),
    ).toBeVisible();
    await expect(card(page, id).getByRole('button', { name: 'Editar', exact: true })).toHaveCount(
      0,
    );
  }
  const details = card(page, 'e1').locator('.event-details');
  await expect(details).toHaveJSProperty('open', false);
  await details.locator('summary').focus();
  await details.locator('summary').press('Enter');
  await expect(details).toHaveJSProperty('open', true);
  await expect(details.locator('.event-note')).toContainText('TextoLargo');
  await expect(details.locator('.event-original')).toHaveText(
    'Gol nuestro siete\nTranscripción original',
  );
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const rival = card(page, 'e2').locator('.event-details');
  await rival.locator('summary').click();
  await expect(rival.getByText('Transcripción original', { exact: true })).toBeVisible();
  await expect(rival.locator('.event-note')).toHaveCount(0);
  await expect(card(page, 'missing-event').locator('.event-details')).toHaveCount(0);
  const pendingDetails = card(page, 'invalid-substitution').locator('.event-details');
  await pendingDetails.locator('summary').click();
  await expect(pendingDetails.locator('.event-note')).toHaveText('Salida y entrada por corregir');
  await page
    .locator('.clock-actions')
    .getByRole('button', { name: 'Reanudar', exact: true })
    .click();
  await expect(details).toHaveJSProperty('open', true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await details.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('reading-details.png') });
});

for (const input of ['keyboard', 'touch'])
  test(`completing the last pending item with ${input} updates empty state, count and focus`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await restore(page, 'pending');
    await page.getByRole('button', { name: '1 pendientes', exact: true }).click();
    const complete = page.getByRole('button', { name: 'Completar', exact: true });
    if (input === 'touch') await complete.click();
    else {
      await complete.focus();
      await complete.press('Enter');
    }
    const editor = page.getByRole('dialog', { name: 'Editar evento', exact: true });
    await choose(editor, 'Equipo', 'La Jota');
    await choose(editor, 'Evento', 'Gol');
    await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
    await expect(editor).toHaveCount(0);
    await expect(page.getByText('Sin eventos pendientes', { exact: true })).toBeVisible();
    const filter = page.locator('.filter-chip');
    await expect(filter).toContainText('0 pendientes');
    await expect(filter).toBeFocused();
    const box = (await filter.boundingBox())!,
      header = (await page.locator('.match-header').boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(header.y + header.height);
    await expect(page.locator('.capture-feedback')).toContainText('Evento guardado');
    await expect(page.getByLabel('Marcador 1 a 0')).toBeVisible();
    await page.screenshot({ path: info.outputPath('last-pending-focus.png') });
    await page.reload();
    await expect(page.getByLabel('Marcador 1 a 0')).toBeVisible();
  });

test('unchanged editor closes directly; changed editor protects Cancel, X, Escape and restores focus', async ({
  page,
}) => {
  await restore(page, 'pending');
  const manual = page.getByRole('button', { name: 'Evento manual', exact: true });
  await manual.click();
  let editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(manual).toBeFocused();
  await manual.click();
  editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await choose(editor, 'Evento', 'Nota');
  await editor
    .getByRole('textbox', { name: 'Nota', exact: true })
    .fill('No perder este recordatorio');
  for (const method of ['Cancelar', 'Cerrar', 'Escape']) {
    if (method === 'Escape') await editor.press('Escape');
    else await editor.getByRole('button', { name: method, exact: true }).click();
    const guard = page.getByRole('dialog', { name: 'Descartar cambios', exact: true });
    await expect(guard).toBeVisible();
    await expect(
      guard.getByRole('button', { name: 'Continuar editando', exact: true }),
    ).toBeFocused();
    await guard.getByRole('button', { name: 'Continuar editando', exact: true }).click();
    await expect(guard).toHaveCount(0);
    await expect(editor.getByRole('textbox', { name: 'Nota', exact: true })).toHaveValue(
      'No perder este recordatorio',
    );
  }
  await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Descartar cambios', exact: true })
    .getByRole('button', { name: 'Descartar', exact: true })
    .click();
  await expect(editor).toHaveCount(0);
  await expect(manual).toBeFocused();
  await expect(page.locator('.event-card')).toHaveCount(1);
});

test('Back can be cancelled repeatedly; reload uses a native prompt; saving removes protection', async ({
  page,
}) => {
  await restore(page, 'pending');
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await choose(editor, 'Evento', 'Nota');
  await editor.getByRole('textbox', { name: 'Nota', exact: true }).fill('Borrador de este partido');
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.goBack();
    const guard = page.getByRole('dialog', { name: 'Descartar cambios', exact: true });
    await expect(guard).toBeVisible();
    await guard.getByRole('button', { name: 'Continuar editando', exact: true }).click();
    await expect(guard).toHaveCount(0);
    await expect(page).toHaveURL(/#\/partidos\/report-match$/);
    await expect(editor.getByLabel('Nota', { exact: true })).toHaveValue(
      'Borrador de este partido',
    );
  }
  const prompt = page.waitForEvent('dialog');
  const reload = page.evaluate(() => location.reload());
  const native = await prompt;
  expect(native.type()).toBe('beforeunload');
  await native.dismiss();
  await reload;
  await expect(editor.getByLabel('Nota', { exact: true })).toHaveValue('Borrador de este partido');
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.event-card')).toHaveCount(2);
});

test('event deletion identifies the target, preserves it on Cancel/X/Escape and deletes only that event', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await restore(page, 'delete');
  const target = card(page, 'e1');
  await expect(target.locator('.event-menu')).toHaveCount(0);
  await expect(target.locator('.delete-event')).toBeVisible();
  await expect(target.locator('.delete-event')).toHaveText('');
  const remove = target.locator('.delete-event');
  for (const method of ['Cancelar', 'Cerrar', 'Escape']) {
    await remove.click();
    const dialog = page.getByRole('dialog', { name: 'Eliminar evento', exact: true });
    await expect(dialog.locator('.confirmation-context')).toContainText('Gol · La Jota');
    await expect(dialog.locator('.confirmation-context')).toContainText('Tiempo 1 · 3′');
    await expect(dialog.locator('.confirmation-context')).toContainText('#7');
    await expect(dialog.locator('.confirmation-context')).not.toContainText('TextoLargo');
    if (method === 'Escape') await dialog.press('Escape');
    else await dialog.getByRole('button', { name: method, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(remove).toBeFocused();
    await expect(target).toHaveCount(1);
  }
  await remove.click();
  await page.screenshot({ path: info.outputPath('delete-context.png') });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Eliminar evento', exact: true })
    .click();
  await expect(target).toHaveCount(0);
  await expect(card(page, 'e2')).toHaveCount(1);
  await expect(page.getByLabel('Marcador 0 a 1')).toBeVisible();
});

test('delete match names teams and date; cancel keeps the match and confirmation removes it', async ({
  page,
}) => {
  await restore(page, 'delete');
  const more = page.locator('.match-footer');
  await more.getByRole('button', { name: 'Eliminar partido', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: 'Eliminar partido', exact: true });
  await expect(dialog.locator('.confirmation-context')).toContainText('La Jota — Rival');
  await expect(dialog.locator('.confirmation-context')).toContainText('2026');
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await more.getByRole('button', { name: 'Eliminar partido', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Eliminar partido', exact: true });
  await dialog.getByRole('button', { name: 'Eliminar partido', exact: true }).click();
  await expect(page).toHaveURL(/#\/partidos$/);
  await expect(page.locator('.match-card')).toHaveCount(0);
});

test('discarding Back leaves the match without saving or leaking a draft into the next visit', async ({
  page,
}) => {
  await restore(page, 'pending');
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  let editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await choose(editor, 'Evento', 'Nota');
  await editor.getByLabel('Nota', { exact: true }).fill('Descartar este borrador');
  await page.goBack();
  await page
    .getByRole('dialog', { name: 'Descartar cambios', exact: true })
    .getByRole('button', { name: 'Descartar', exact: true })
    .click();
  await expect(page).toHaveURL(/#\/partidos$/);
  await page.locator('.match-card').click();
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await expect(editor.locator('.event-action-choices [aria-pressed="true"]')).toHaveCount(0);
  await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.locator('.event-card')).toHaveCount(1);
});

test('a typed hash cannot discard an edited note without an explicit decision', async ({
  page,
}) => {
  await restore(page, 'pending');
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await choose(editor, 'Evento', 'Nota');
  await editor.getByLabel('Nota', { exact: true }).fill('Sigue aquí');
  await page.evaluate(() => {
    location.hash = '/partidos';
  });
  const guard = page.getByRole('dialog', { name: 'Descartar cambios', exact: true });
  await expect(guard).toBeVisible();
  await guard.getByRole('button', { name: 'Continuar editando', exact: true }).click();
  await expect(page).toHaveURL(/#\/partidos\/report-match$/);
  await expect(editor.getByLabel('Nota', { exact: true })).toHaveValue('Sigue aquí');
});

for (const target of ['rival', 'pending'])
  test(`delete ${target} event identifies and removes the intended target`, async ({ page }) => {
    await restore(page, target === 'pending' ? 'pending' : 'delete');
    if (target === 'pending')
      await page.getByRole('button', { name: '1 pendientes', exact: true }).click();
    const item = card(page, target === 'pending' ? 'e9' : 'e2');
    await item.locator('.delete-event').click();
    const dialog = page.getByRole('dialog', { name: 'Eliminar evento', exact: true });
    await expect(dialog.locator('.confirmation-context')).toContainText(
      target === 'pending' ? 'Evento sin indicar · Equipo pendiente' : 'Gol · Rival',
    );
    await expect(dialog.locator('.confirmation-context')).toContainText(
      target === 'pending' ? 'Tiempo 2 · 7′' : 'Tiempo 1 · 1′',
    );
    await dialog.getByRole('button', { name: 'Eliminar evento', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(item).toHaveCount(0);
    await expect(
      page.getByLabel(target === 'pending' ? 'Marcador 0 a 0' : 'Marcador 1 a 0'),
    ).toBeVisible();
    await expect(page.locator('.filter-chip')).toBeFocused();
  });

test('a newly created shirt is acknowledged as registered despite the previous snapshot lacking that player', async ({
  page,
}) => {
  await restore(page, 'pending');
  await page.getByRole('button', { name: 'Evento manual', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Nuevo evento', exact: true });
  await choose(editor, 'Equipo', 'La Jota');
  await choose(editor, 'Evento', 'Gol');
  await selectShirtNumber(editor, 'Dorsal principal', '99');
  await editor.getByRole('button', { name: 'Guardar evento', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator('.capture-feedback')).toContainText('Evento guardado');
  await expect(page.locator('.capture-feedback')).not.toContainText('Pendiente');
  await expect(page.getByLabel('Marcador 1 a 0')).toBeVisible();
});

test('confirmation retains complete long team/player names and permits cancellation on a narrow screen', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const data = await restore(page, 'long');
  const target = card(page, 'e1');
  await target.locator('.delete-event').click();
  const dialog = page.getByRole('dialog', { name: 'Eliminar evento', exact: true });
  await expect(dialog.locator('.confirmation-context')).toContainText(data.teams[0].name);
  await expect(dialog.locator('.confirmation-context')).toContainText(
    data.players.find((player) => player.id === 'a7')!.name,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const cancel = dialog.getByRole('button', { name: 'Cancelar', exact: true });
  await cancel.scrollIntoViewIfNeeded();
  await expect(cancel).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: info.outputPath('long-confirmation.png') });
  await cancel.click();
  await expect(dialog).toHaveCount(0);
  await expect(target).toHaveCount(1);
});
