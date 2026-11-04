import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from './helpers/axe.ts';
import { MOTION_STORAGE_KEY } from '../../src/motion/preference.ts';
import { waitForHeroEntrance } from './helpers/heroEntrance.ts';

// Phase 10: axe (WCAG 2.2 A/AA) on Selected Work + Brands — the production section (heading only
// while nothing is published) and the harness with fictional data in its interactive states.

const HARNESS = 'http://localhost:5180/tests/e2e/harness/work.html';

test('production section', async ({ page }) => {
  await page.goto('/');
  await waitForHeroEntrance(page);
  await expectNoA11yViolations(page, { include: ['#portfolio'] });
});

for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const) {
  test(`harness at ${width}px: Selected view, All view after a filter, and "See all"`, async ({
    page,
  }) => {
    // Motion off: cards render in their final state (M-05 reveals replay as cards scroll in and
    // out, so with motion on axe could measure a card mid-fade).
    await page.addInitScript((key) => localStorage.setItem(key, 'off'), MOTION_STORAGE_KEY);
    await page.setViewportSize({ width, height });
    await page.goto(HARNESS);
    const section = page.locator('#portfolio');
    await section.scrollIntoViewIfNeeded();
    await expectNoA11yViolations(page, { include: ['#portfolio'] });

    await section.getByRole('button', { name: 'eCommerce', exact: true }).click();
    await expect.poll(() => section.locator('ul > li').count()).toBe(4);
    await expectNoA11yViolations(page, { include: ['#portfolio'] });

    await section.getByRole('button', { name: /SEE ALL/ }).click();
    await expectNoA11yViolations(page, { include: ['#portfolio'] });
  });
}

test('"Logo auto-scroll" keeps one accessible name in both states (motion on)', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name.endsWith('-reduced-motion'),
    'motion off: the toggle is not offered',
  );
  await page.goto(HARNESS);
  const toggle = page.getByRole('button', { name: 'Logo auto-scroll' });
  await toggle.scrollIntoViewIfNeeded();
  for (const pressed of ['true', 'false', 'true']) {
    await expect(toggle).toHaveAttribute('aria-pressed', pressed);
    await expect(toggle).toHaveAccessibleName('Logo auto-scroll');
    // The card grid is excluded here: with motion on, cards near the screen edge replay their
    // M-05 entrance (half-transparent mid-fade). Cards are checked at their final state above.
    await expectNoA11yViolations(page, { include: ['#portfolio'], exclude: ['#portfolio ul'] });
    await toggle.click();
    await page.mouse.move(2, 2);
  }
});
