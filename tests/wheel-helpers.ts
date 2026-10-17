import { type Locator } from '@playwright/test';

export async function selectWheelOption(wheel: Locator, label: string) {
  const option = wheel.getByRole('option', { name: label, exact: true });
  await option.click();
}
