import { expect, test, type Page } from '@playwright/test';
import { MOTION_STORAGE_KEY } from '../../src/motion/preference.ts';
import { expectNoA11yViolations } from './helpers/axe.ts';

// Phase 11: axe (WCAG 2.2 A/AA) with the pop-up open — full project, before/after, video,
// showreel and milestone items — on the harness with fictional TEST content, desktop and phone.
// Motion off: everything is checked in its final state (M-03b blocks would otherwise be measured
// mid-fade while they reveal).

const HARNESS = 'http://localhost:5180/tests/e2e/harness/modal.html';

async function open(page: Page, name: string) {
  const inGrid = page.locator('#portfolio').getByRole('button', { name, exact: true });
  if ((await inGrid.count()) === 0) {
    const extra = page.getByRole('button', { name, exact: true });
    if ((await extra.count()) > 0) await extra.click();
    else {
      await page
        .locator('#portfolio')
        .getByRole('button', { name: /ALL WORK/ })
        .click();
      await inGrid.click();
    }
  } else await inGrid.click();
  await expect(page.locator('dialog')).toHaveJSProperty('open', true);
}

const close = async (page: Page) => {
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
};

for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const) {
  test(`pop-up open at ${width}px: every content type`, async ({ page }) => {
    await page.addInitScript((key) => localStorage.setItem(key, 'off'), MOTION_STORAGE_KEY);
    await page.setViewportSize({ width, height });
    await page.goto(HARNESS);
    for (const name of [
      'Test full case study',
      'Test minimal project',
      'Test local video',
      'Test embed video',
      'Test before after',
      'Test open showreel',
      'Test open Test document milestone',
      'Test open Test image milestone',
    ]) {
      await open(page, name);
      await expectNoA11yViolations(page, { include: ['dialog'] });
      await close(page);
    }
  });
}
