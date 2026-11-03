import { expect, type Page } from '@playwright/test';
import { tr, type Language } from '../src/i18n';

export async function continuePracticeAudio(page: Page, language: Language = 'es') {
  const title = tr('Configura el audio de la práctica', {}, language);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.locator('.hold-to-talk')).toHaveCount(0);
  await page.locator('.practice-footer').getByRole('button').first().click();
  await expect(page.locator('.practice-audio-setup')).toHaveCount(0);
  await expect(page.locator('.voice-preparation')).toHaveCount(0);
}
