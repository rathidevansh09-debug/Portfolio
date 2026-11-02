import { expect, test } from '@playwright/test';

// Proves each project emulates the intended motion setting, so later reduced-motion journeys
// (ARCHITECTURE §11.4; PRD MO-5) really run with "Reduce motion" on.
test('browser reports the project motion preference', async ({ page }, testInfo) => {
  const expectReduced = testInfo.project.name.endsWith('-reduced-motion');
  await page.goto('/');
  const reduced = await page.evaluate(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  expect(reduced).toBe(expectReduced);
});
