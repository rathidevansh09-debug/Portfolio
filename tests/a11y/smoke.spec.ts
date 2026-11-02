import { test } from '@playwright/test';
import { expectNoA11yViolations } from './helpers/axe.ts';

// Accessibility smoke check of the built page with the shared WCAG A/AA helper (ARCHITECTURE §10).
test('built page has no WCAG A/AA violations', async ({ page }) => {
  await page.goto('/');
  await expectNoA11yViolations(page);
});
