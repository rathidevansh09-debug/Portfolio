import { test } from '@playwright/test';
import { expectNoA11yViolations } from './helpers/axe.ts';
import { waitForHeroEntrance } from './helpers/heroEntrance.ts';

// Accessibility smoke check of the built page with the shared WCAG A/AA helper (ARCHITECTURE §10).
test('built page has no WCAG A/AA violations', async ({ page }) => {
  await page.goto('/');
  await waitForHeroEntrance(page); // Phase 9: measure the hero's final state, not mid-fade text
  await expectNoA11yViolations(page);
});
