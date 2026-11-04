import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from './helpers/axe.ts';

// Phase 9: axe (WCAG 2.2 A/AA) on the hero after its entrance, desktop and phone, and on the
// harness with supplied (fictional) stats and CV link.

for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const) {
  test(`hero at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.locator('#home')).toHaveAttribute('data-started', '');
    await page.waitForTimeout(1700); // entrance finished (≈ 1.55 s)
    await expectNoA11yViolations(page, { include: ['#home'] });
  });

  test(`hero with stats and CV link (harness) at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('http://localhost:5180/tests/e2e/harness/hero.html?stats=3');
    await expect(page.locator('#home')).toHaveAttribute('data-started', '');
    await page.waitForTimeout(1700);
    await expectNoA11yViolations(page, { include: ['#home'] });
  });
}
