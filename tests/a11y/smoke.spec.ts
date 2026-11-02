import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Phase 1 sample: axe-core runs against the built page with WCAG 2.x A/AA rules (ARCHITECTURE §10).
test('built page has no WCAG A/AA violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
