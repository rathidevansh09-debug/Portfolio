import { expect, type Page } from '@playwright/test';

/**
 * Starts collecting browser console errors and uncaught page errors. Call before navigating.
 * The production site must have no console errors (PRD §15; AGENTS §7).
 */
export function collectConsoleErrors(page: Page): () => string[] {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  return () => [...problems];
}

/** Asserts that no console or page errors were collected. */
export function expectNoConsoleErrors(getErrors: () => string[]): void {
  expect(getErrors(), 'browser console / page errors').toEqual([]);
}

/** Asserts the page cannot scroll horizontally at the current viewport (ARCHITECTURE §7.2). */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    scrollWidth,
    `horizontal page scroll: content ${scrollWidth}px > viewport ${clientWidth}px`,
  ).toBeLessThanOrEqual(clientWidth);
}
