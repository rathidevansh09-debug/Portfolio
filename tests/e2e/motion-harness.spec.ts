import { expect, test, type Locator, type Page } from '@playwright/test';
import { cssMotionVariables } from '../../src/motion/tokens.ts';
import { MOTION_STORAGE_KEY } from '../../src/motion/preference.ts';

// Phase 6 verification on the motion harness (dev server, see playwright.config.ts):
// M-03 page reveal replays; M-03b modal reveal once per opening and reset on close; motion off and
// reduced motion render the final state (MO-5); CSS variables equal tokens; hooks honour MO-5/MO-6.

const HARNESS = 'http://localhost:5180/tests/e2e/harness/motion.html';
const opacity = (l: Locator) => l.evaluate((el) => Number(getComputedStyle(el).opacity));
const transform = (l: Locator) => l.evaluate((el) => getComputedStyle(el).transform);
const scrollPageTo = (page: Page, y: number) => page.evaluate((top) => window.scrollTo(0, top), y);
const isReduced = (name: string) => name.endsWith('-reduced-motion');

test.beforeEach(async ({ page }) => {
  await page.goto(HARNESS);
  await expect(page.getByTestId('state')).toHaveText(/on|off/);
});

test('page reveal (M-03) replays on every re-entry; final state when motion is off', async ({
  page,
}, testInfo) => {
  const block = page.getByTestId('page-reveal');
  if (isReduced(testInfo.project.name)) {
    await expect(page.getByTestId('state')).toHaveText('off');
    expect(await opacity(block)).toBe(1);
    expect(await transform(block)).toBe('none');
    return;
  }
  await expect.poll(() => opacity(block)).toBe(0);
  for (let pass = 0; pass < 2; pass++) {
    await block.scrollIntoViewIfNeeded();
    await expect.poll(() => opacity(block), { timeout: 3000 }).toBe(1);
    await scrollPageTo(page, 0);
    await expect.poll(() => opacity(block), { timeout: 3000 }).toBe(0);
  }
});

test('modal reveal (M-03b) reveals once per opening and resets on close', async ({
  page,
}, testInfo) => {
  const reduced = isReduced(testInfo.project.name);
  const scrollBox = () => page.getByTestId('modal-scroll');
  const block = () => page.getByTestId('modal-reveal');
  const scrollModal = (top: number) => scrollBox().evaluate((el, t) => el.scrollTo(0, t), top);

  for (let opening = 0; opening < 2; opening++) {
    await page.getByTestId('open-modal').click();
    if (reduced) {
      expect(await opacity(block())).toBe(1);
    } else {
      await expect.poll(() => opacity(block())).toBe(0);
      await scrollModal(600);
      await expect.poll(() => opacity(block()), { timeout: 3000 }).toBe(1);
      await scrollModal(0);
      await page.waitForTimeout(1200);
      expect(await opacity(block()), 'no replay within one opening').toBe(1);
    }
    await page.getByTestId('close-modal').click();
    await expect(block()).toHaveCount(0);
  }
});

test('Motion toggle switches both ways, sets data-motion and persists; system setting wins', async ({
  page,
}, testInfo) => {
  const html = page.locator('html');
  const state = page.getByTestId('state');
  const block = page.getByTestId('page-reveal');

  if (isReduced(testInfo.project.name)) {
    await expect(state).toHaveText('off');
    await expect(html).toHaveAttribute('data-motion', 'off');
    await page.getByTestId('toggle').click(); // stored choice changes, motion stays off (MO-5)
    await expect(state).toHaveText('off');
    await expect(html).toHaveAttribute('data-motion', 'off');
    return;
  }
  await expect(state).toHaveText('on');
  await expect(html).not.toHaveAttribute('data-motion');
  await page.getByTestId('toggle').click();
  await expect(state).toHaveText('off');
  await expect(html).toHaveAttribute('data-motion', 'off');
  expect(await opacity(block)).toBe(1); // final state without scrolling
  expect(await page.evaluate((k) => localStorage.getItem(k), MOTION_STORAGE_KEY)).toBe('off');

  await page.reload();
  await expect(state).toHaveText('off');
  await expect(html).toHaveAttribute('data-motion', 'off');

  await page.getByTestId('toggle').click();
  await expect(state).toHaveText('on');
  await expect(html).not.toHaveAttribute('data-motion');
});

test('CSS motion variables equal the token values', async ({ page }) => {
  const published = await page.evaluate((names) => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(names.map((n) => [n, style.getPropertyValue(n).trim()]));
  }, Object.keys(cssMotionVariables));
  expect(published).toEqual(cssMotionVariables);
});

test('scroll-linked helper maps progress while on and holds the off value when off', async ({
  page,
}, testInfo) => {
  const box = page.getByTestId('scroll-linked');
  const readY = () =>
    box.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
  await box.scrollIntoViewIfNeeded();
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const top = await box.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollPageTo(page, top - 700);
  await page.waitForTimeout(200);
  const early = await readY();
  await scrollPageTo(page, Math.min(top + 100, total));
  await page.waitForTimeout(200);
  const late = await readY();
  if (isReduced(testInfo.project.name)) {
    expect([early, late]).toEqual([0, 0]);
  } else {
    expect(late).toBeGreaterThan(early);
    expect(early).toBeGreaterThanOrEqual(-12);
    expect(late).toBeLessThanOrEqual(12);
  }
});

test('magnetic pull follows a mouse pointer; disabled when motion is off', async ({
  page,
}, testInfo) => {
  const box = page.getByTestId('magnetic');
  const rect = await box.boundingBox();
  if (!rect) throw new Error('magnetic box not visible');
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.move(rect.x + rect.width - 2, rect.y + rect.height - 2, { steps: 5 });
  const readX = () =>
    box.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
  if (isReduced(testInfo.project.name)) {
    await page.waitForTimeout(400);
    expect(await readX()).toBe(0);
  } else {
    // 12 % of the ~98 px offset ≈ 11.8 px once the spring settles.
    await expect.poll(readX, { timeout: 3000 }).toBeGreaterThan(8);
    await page.mouse.move(rect.x - 50, rect.y - 50);
    await expect.poll(readX, { timeout: 3000 }).toBeLessThan(1);
  }
});
