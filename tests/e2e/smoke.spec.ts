import { expect, test } from '@playwright/test';
import { site } from '../../src/content/site.ts';
import { collectConsoleErrors, expectNoConsoleErrors } from './helpers/checks.ts';

// Smoke check: the built page loads with no console or page errors (PRD §15).
test('built page loads without console or page errors', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page).toHaveTitle(site.title.text); // FR-G5 (Phase 8: was the Phase 1 "Devansh")
  expectNoConsoleErrors(errors);
});
