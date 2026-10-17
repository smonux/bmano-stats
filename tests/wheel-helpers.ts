import { type Locator } from '@playwright/test';

export async function selectWheelOption(wheel: Locator, label: string) {
  const option = wheel.getByRole('option', { name: label, exact: true });
  await option.click();
}

export async function selectShirtNumber(container: Locator, label: string, value: string) {
  const number = container.getByRole('group', { name: label, exact: true });
  const tens = number.getByRole('listbox', { name: `${label} · Decenas`, exact: true });
  if (value === '') {
    await selectWheelOption(tens, '—');
    return;
  }
  const digits = value.padStart(2, '0');
  await selectWheelOption(tens, digits[0]);
  await selectWheelOption(
    number.getByRole('listbox', { name: `${label} · Unidades`, exact: true }),
    digits[1],
  );
}

export async function readShirtNumber(container: Locator, label: string) {
  const number = container.getByRole('group', { name: label, exact: true });
  const selected = await Promise.all(
    ['Decenas', 'Unidades'].map((digit) =>
      number
        .getByRole('listbox', { name: `${label} · ${digit}`, exact: true })
        .getByRole('option', { selected: true })
        .textContent(),
    ),
  );
  return selected.includes('—') ? '' : String(Number(selected.join('')));
}
