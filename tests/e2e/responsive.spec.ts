import { test } from '@playwright/test';
import {
  collectConsoleErrors,
  expectNoConsoleErrors,
  expectNoHorizontalScroll,
} from './helpers/checks.ts';
import { VERIFICATION_WIDTHS, viewportForWidth } from './helpers/viewports.ts';

// No horizontal page scroll at any verification width (ARCHITECTURE §7.2).
for (const width of VERIFICATION_WIDTHS) {
  test(`no horizontal page scroll at ${width}px`, async ({ page }) => {
    const { height } = viewportForWidth(width);
    await page.setViewportSize({ width, height });
    const errors = collectConsoleErrors(page);
    await page.goto('/');
    await expectNoHorizontalScroll(page);
    expectNoConsoleErrors(errors);
  });
}
