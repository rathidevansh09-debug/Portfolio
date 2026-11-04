import { expect, test, type Page } from '@playwright/test';
import { collectConsoleErrors, expectNoConsoleErrors } from './helpers/checks.ts';

// Phase 10 verification of the Brands strip on the harness (fictional TEST LOGO SVGs, owner
// decision 3): M-12 speed (≈ 38 px/s token, [APPROX]) and pause rules [OBSERVED reference],
// arrows (70 %), "See all", hidden copies, motion off, M-07b logo hover.

const HARNESS = 'http://localhost:5180/tests/e2e/harness/work.html';
const isReduced = (name: string) => name.endsWith('-reduced-motion');
const region = (page: Page) => page.getByRole('region', { name: 'Test logo strip' });
const scrollLeft = (page: Page) => region(page).evaluate((el) => el.scrollLeft);
const setWidth = (page: Page) =>
  region(page).evaluate(
    (el) => (el.firstElementChild?.firstElementChild as HTMLElement).offsetWidth,
  );
const moved = async (page: Page, ms: number) => {
  const a = await scrollLeft(page);
  await page.waitForTimeout(ms);
  const b = await scrollLeft(page);
  const w = await setWidth(page);
  return (((b - a) % w) + w) % w; // the loop wraps by one set width
};

const AUTO = 'Logo auto-scroll';
/** Hold the strip still: switch auto-scroll off (no toggle with motion off — nothing moves). */
const holdStill = async (page: Page) => {
  const toggle = page.getByRole('button', { name: AUTO });
  if ((await toggle.count()) > 0 && (await toggle.getAttribute('aria-pressed')) === 'true') {
    await toggle.click();
  }
  await page.mouse.move(2, 2);
};

let errors: () => string[];
test.beforeEach(async ({ page }) => {
  errors = collectConsoleErrors(page);
  await page.goto(HARNESS);
  await region(page).scrollIntoViewIfNeeded();
  await page.mouse.move(2, 2);
});
test.afterEach(() => expectNoConsoleErrors(errors));

test('travels at the token speed (≈ 38 px/s); stopped with motion off', async ({
  page,
}, testInfo) => {
  const distance = await moved(page, 2000);
  if (isReduced(testInfo.project.name)) {
    expect(distance).toBe(0);
    return;
  }
  expect(distance / 2).toBeGreaterThan(30);
  expect(distance / 2).toBeLessThan(46);
});

test('pauses while hovered or focused, resumes after (M-12)', async ({ page }, testInfo) => {
  test.skip(isReduced(testInfo.project.name), 'the strip does not run with motion off');
  await region(page).hover();
  expect(await moved(page, 800)).toBe(0);
  await page.mouse.move(2, 2);
  expect(await moved(page, 800)).toBeGreaterThan(10);
  await region(page).focus();
  expect(await moved(page, 800)).toBe(0);
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  expect(await moved(page, 800)).toBeGreaterThan(10);
});

test('"Logo auto-scroll" toggle: one stable name; aria-pressed follows auto-scroll; a press stops it', async ({
  page,
}, testInfo) => {
  const toggle = page.getByRole('button', { name: AUTO });
  if (isReduced(testInfo.project.name)) {
    await expect(toggle).toHaveCount(0); // motion off: nothing to toggle (MO-5)
    return;
  }
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await page.mouse.move(2, 2);
  await expect(page.getByRole('button', { name: AUTO })).toHaveAttribute('aria-pressed', 'false');
  expect(await moved(page, 800)).toBe(0);
  await toggle.click();
  await page.mouse.move(2, 2);
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(await moved(page, 800)).toBeGreaterThan(10);
  const box = await region(page).boundingBox();
  await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 30);
  await page.mouse.down();
  await page.mouse.up();
  await page.mouse.move(2, 2);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false'); // [OBSERVED] press stops it
  expect(await moved(page, 800)).toBe(0);
});

test('stops while off-screen', async ({ page }, testInfo) => {
  test.skip(isReduced(testInfo.project.name), 'the strip does not run with motion off');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);
  expect(await moved(page, 800)).toBe(0);
});

test('arrows scroll 70 % of the visible width', async ({ page }) => {
  await holdStill(page);
  const width = await region(page).evaluate((el) => el.clientWidth);
  const w = await setWidth(page);
  const before = await scrollLeft(page);
  await page.getByRole('button', { name: 'Test next' }).click();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(1200);
  const step = ((((await scrollLeft(page)) - before) % w) + w) % w;
  expect(Math.abs(step - width * 0.7)).toBeLessThan(3);
});

test('ArrowLeft/ArrowRight scroll the focused strip 40 px; the page stays put (DESIGN §12)', async ({
  page,
}) => {
  await holdStill(page);
  await region(page).focus();
  const w = await setWidth(page);
  const pageY = await page.evaluate(() => window.scrollY);
  const step = async (key: string) => {
    const before = await scrollLeft(page);
    await page.keyboard.press(key);
    await page.waitForTimeout(600); // smooth scroll settles (instant with motion off)
    return ((((await scrollLeft(page)) - before) % w) + w) % w;
  };
  expect(Math.abs((await step('ArrowRight')) - 40)).toBeLessThan(2);
  expect(Math.abs((await step('ArrowLeft')) - (w - 40))).toBeLessThan(2); // −40 px, wrapped
  expect(await page.evaluate(() => window.scrollY)).toBe(pageY);
});

test('copies are hidden from screen readers; few logos still loop seamlessly', async ({
  page,
}, testInfo) => {
  const sets = region(page).locator(':scope > div > div');
  expect(await sets.count()).toBeGreaterThanOrEqual(2);
  await expect(sets.first()).not.toHaveAttribute('aria-hidden', 'true');
  for (let i = 1; i < (await sets.count()); i++)
    await expect(sets.nth(i)).toHaveAttribute('aria-hidden', 'true');
  await page.goto(`${HARNESS}?brands=2`);
  await region(page).scrollIntoViewIfNeeded();
  await page.mouse.move(2, 2);
  const copies = await region(page).locator(':scope > div > div').count();
  const fits = await region(page).evaluate((el) => {
    const set = el.firstElementChild?.firstElementChild as HTMLElement;
    return el.scrollWidth - el.clientWidth >= set.offsetWidth; // room for one full set → seamless
  });
  expect(copies).toBeGreaterThan(2);
  expect(fits).toBe(true);
  if (!isReduced(testInfo.project.name)) expect(await moved(page, 1000)).toBeGreaterThan(10);
});

test('"See all" shows a grid of permitted logos with names; strip controls hide', async ({
  page,
}) => {
  const seeAll = page.getByRole('button', { name: /SEE ALL \(12\)/ });
  await expect(seeAll).toHaveAttribute('aria-expanded', 'false');
  await seeAll.click();
  const back = page.getByRole('button', { name: /TEST SHOW STRIP/ });
  await expect(back).toHaveAttribute('aria-expanded', 'true');
  const gridId = await back.getAttribute('aria-controls');
  const grid = page.locator(`[id="${gridId}"]`);
  await expect(grid.getByText(/^Test logo \d+$/)).toHaveCount(12);
  await expect(grid).not.toContainText('Unpermitted');
  await expect(
    page.getByRole('button', { name: /Logo auto-scroll|Test next|Test previous/ }),
  ).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Test logo strip' })).toHaveCount(0);
  const cols = await grid.evaluate(
    (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
  );
  expect(cols).toBe(
    page.viewportSize()!.width <= 600 ? 3 : page.viewportSize()!.width <= 800 ? 4 : 6,
  );
  await back.click();
  await expect(region(page)).toBeVisible();
});

test('logo hover (M-07b): greyscale at 70 % → full colour and 1.06×, mouse only', async ({
  page,
}) => {
  await holdStill(page);
  const logo = region(page).locator(':scope > div > div').first().locator(':scope > div').nth(1);
  const box = logo.locator(':scope > span');
  // Scale rounded to 3 places: browsers store transforms as floats (Firefox: 1.0599999…).
  const look = () =>
    box.evaluate((el) => {
      const s = getComputedStyle(el);
      const scale = Math.round(new DOMMatrixReadOnly(s.transform).a * 1000) / 1000;
      return { opacity: s.opacity, filter: s.filter, scale };
    });
  expect(await look()).toEqual({ opacity: '0.7', filter: 'grayscale(1)', scale: 1 });
  await logo.hover();
  await expect.poll(look, { timeout: 2000 }).toEqual({ opacity: '1', filter: 'none', scale: 1.06 });
});
