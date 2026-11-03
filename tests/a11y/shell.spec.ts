import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from './helpers/axe.ts';

// Phase 8: axe (WCAG 2.2 A/AA) on the page shell in each state.

test('desktop shell, then with motion off', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('banner')).toBeVisible();
  await page.getByRole('link', { name: 'About' }).click();
  await expectNoA11yViolations(page);
  if (!testInfo.project.name.endsWith('-reduced-motion')) {
    await page.getByRole('switch', { name: 'Motion on' }).click();
  }
  await expect(page.getByRole('switch', { name: 'Motion off' })).toBeVisible();
  await expectNoA11yViolations(page);
});

test('phone shell with the menu closed and open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expectNoA11yViolations(page);
  const button = page.getByRole('banner').locator('button[aria-controls]');
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  // Wait for the M-17 entrance to finish: mid-fade text is partly transparent.
  await expect
    .poll(() => page.locator('header nav[id]').evaluate((el) => getComputedStyle(el).opacity))
    .toBe('1');
  await expectNoA11yViolations(page);
});
