import { expect, test } from '@playwright/test';

// Phase 1 sample: the built page loads with no console errors (PRD §15) and no page errors.
test('built page loads without console or page errors', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(msg.text());
  });
  page.on('pageerror', (err) => problems.push(err.message));

  await page.goto('/');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page).toHaveTitle('Devansh');
  expect(problems).toEqual([]);
});
