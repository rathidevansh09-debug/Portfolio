import { expect, test, type Locator, type Page } from '@playwright/test';
import { MOTION_STORAGE_KEY } from '../../src/motion/preference.ts';
import { collectConsoleErrors, expectNoConsoleErrors } from './helpers/checks.ts';
import { anchorOffset } from './helpers/viewports.ts';

// Phase 8 verification on the built site: skip link, header navigation with the header offset,
// active-section dot (M-16), reading progress (M-15), Motion toggle (FR-H4, FR-G3, MO-5; owner
// decision 5B), mobile menu (FR-H6, M-17), header geometry per breakpoint, no-JavaScript fallback.

const ACCENT = 'rgb(0, 213, 232)';
const isReduced = (name: string) => name.endsWith('-reduced-motion');
const NAV = [
  ['Work', 'portfolio'],
  ['Impact', 'impact'],
  ['About', 'about'],
  ['Journey', 'experience'],
  ['Contact', 'contact'],
] as const;

let errors: () => string[];
test.beforeEach(async ({ page }) => {
  errors = collectConsoleErrors(page);
  await page.goto('/');
  await expect(page.getByRole('banner')).toBeVisible();
});
test.afterEach(() => expectNoConsoleErrors(errors));

const header = (page: Page) => page.getByRole('banner');
const desktopNav = (page: Page) => header(page).getByRole('navigation');
const topOf = (page: Page, selector: string) =>
  page.evaluate(
    (s) => Math.round(document.querySelector(s)?.getBoundingClientRect().top ?? NaN),
    selector,
  );
const scrollToY = (page: Page, y: number) =>
  page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
const activeLink = (page: Page) =>
  desktopNav(page)
    .locator('a[aria-current]')
    .evaluateAll((links) => links.map((a) => a.textContent));
const menuButton = (page: Page) => header(page).locator('button[aria-controls]');

test('skip link is the first focus stop, appears on focus and jumps to Selected Work', async ({
  page,
  browserName,
}) => {
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  const skip = page.getByRole('link', { name: 'Skip to work' });
  await expect(skip).toBeFocused();
  const box = await skip.boundingBox();
  expect(box?.y ?? -1).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#portfolio$/);
  const offset = anchorOffset(page.viewportSize()?.width ?? 1280);
  await expect.poll(() => topOf(page, '#portfolio')).toBe(offset);
});

test('nav links scroll each section to the header offset (FR-G1, MO-3) and mark it active', async ({
  page,
}) => {
  for (const [label, id] of NAV) {
    await desktopNav(page).getByRole('link', { name: label }).click();
    await expect.poll(() => topOf(page, `#${id}`), { timeout: 5000 }).toBe(85);
    await expect.poll(() => activeLink(page)).toEqual([label]);
    const dot = await desktopNav(page)
      .getByRole('link', { name: label })
      .evaluate((a) => {
        const s = getComputedStyle(a, '::before');
        return [s.width, s.height, s.backgroundColor];
      });
    expect(dot).toEqual(['4px', '4px', ACCENT]);
  }
  await header(page).getByRole('link', { name: 'DEVANSH' }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(0);
  await expect.poll(() => activeLink(page)).toEqual([]);
});

test('active link follows the reference: Hero none, Breakdown keeps Impact, bottom keeps Contact', async ({
  page,
}) => {
  const vh = page.viewportSize()?.height ?? 720;
  const placeAtBand = async (selector: string) => {
    const top = await page.evaluate(
      (s) => (document.querySelector(s)?.getBoundingClientRect().top ?? 0) + window.scrollY,
      selector,
    );
    await scrollToY(page, top - vh * 0.25); // section top inside the 15 %–35 % band
  };
  await expect.poll(() => activeLink(page)).toEqual([]);
  await placeAtBand('#impact');
  await expect.poll(() => activeLink(page)).toEqual(['Impact']);
  await placeAtBand('[data-placeholder="Breakdown"]');
  await page.waitForTimeout(300);
  expect(await activeLink(page)).toEqual(['Impact']);
  await scrollToY(page, 0);
  await expect.poll(() => activeLink(page)).toEqual([]);
  await scrollToY(page, 1e6);
  await expect.poll(() => activeLink(page)).toEqual(['Contact']);
});

test('reading progress (M-15): spring with motion on, follows scroll directly with motion off', async ({
  page,
}, testInfo) => {
  const bar = page.locator('body > #root > div[aria-hidden="true"]');
  const scale = () => bar.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a);
  const progress = () =>
    page.evaluate(
      () => window.scrollY / (document.documentElement.scrollHeight - window.innerHeight),
    );
  expect(await bar.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(ACCENT);

  const check = async (motionOn: boolean) => {
    const max = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    await scrollToY(page, 0);
    await expect.poll(scale).toBeLessThan(0.01);
    const firstFrame = await page.evaluate(
      async (top) => {
        window.scrollTo({ top, behavior: 'instant' });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const bar = document.querySelector('#root > div[aria-hidden="true"]') as HTMLElement;
        return new DOMMatrixReadOnly(getComputedStyle(bar).transform).a;
      },
      Math.round(max / 2),
    );
    const target = await progress();
    if (motionOn)
      expect(firstFrame).toBeLessThan(target - 0.05); // smoothed: still catching up
    else expect(firstFrame).toBeCloseTo(target, 2);
    await expect.poll(scale, { timeout: 3000 }).toBeGreaterThan(target - 0.01);
  };

  if (isReduced(testInfo.project.name)) {
    await check(false);
    return;
  }
  await check(true);
  await page.getByRole('switch', { name: 'Motion on' }).click();
  await check(false);
});

test('Motion toggle switches motion and remembers the choice (FR-H4, FR-G3)', async ({
  page,
}, testInfo) => {
  const html = page.locator('html');
  if (isReduced(testInfo.project.name)) {
    // System "Reduce motion" forces motion off: shown off, unavailable, explained, inert (5B).
    const toggle = page.getByRole('switch', { name: 'Motion off' });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(toggle).toHaveAttribute('aria-disabled', 'true');
    const noteId = await toggle.getAttribute('aria-describedby');
    await expect(page.locator(`[id="${noteId}"]`)).toHaveText('PENDING');
    // Playwright treats aria-disabled controls as not clickable; the keyboard must do nothing too.
    await toggle.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(html).toHaveAttribute('data-motion', 'off');
    expect(await page.evaluate((k) => localStorage.getItem(k), MOTION_STORAGE_KEY)).toBeNull();
    return;
  }
  const on = page.getByRole('switch', { name: 'Motion on' });
  await expect(on).toHaveAttribute('aria-checked', 'true');
  await expect(html).not.toHaveAttribute('data-motion', 'off');
  await on.click();
  const off = page.getByRole('switch', { name: 'Motion off' });
  await expect(off).toHaveAttribute('aria-checked', 'false');
  await expect(html).toHaveAttribute('data-motion', 'off');
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Motion off' })).toBeVisible();
  await expect(html).toHaveAttribute('data-motion', 'off');
  await page.getByRole('switch', { name: 'Motion off' }).click();
  await expect(page.getByRole('switch', { name: 'Motion on' })).toBeVisible();
  await expect(html).not.toHaveAttribute('data-motion', 'off');
});

test.describe('phone (390 px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const menu = (page: Page): Locator => header(page).locator('nav[id]');

  test('nav and "Let\'s talk" give way to the menu button; Motion toggle stays', async ({
    page,
  }) => {
    await expect(desktopNav(page)).toBeHidden();
    await expect(header(page).getByRole('link', { name: "Let's talk" })).toBeHidden();
    await expect(page.getByRole('switch')).toBeVisible();
    await expect(menuButton(page)).toBeVisible();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    const box = await menuButton(page).boundingBox();
    expect([box?.width, box?.height]).toEqual([44, 44]);
  });

  test('menu (M-17) opens with the drop animation (instant with motion off)', async ({
    page,
  }, testInfo) => {
    const firstFrameOpacity = await menuButton(page).evaluate(async (button) => {
      (button as HTMLButtonElement).click();
      await new Promise((r) => requestAnimationFrame(r));
      const panel = document.querySelector('header nav[id]') as HTMLElement;
      return Number(getComputedStyle(panel).opacity);
    });
    if (isReduced(testInfo.project.name)) expect(firstFrameOpacity).toBe(1);
    else expect(firstFrameOpacity).toBeLessThan(1);
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(() => menu(page).evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect(menu(page).getByRole('link')).toHaveText([
      '01Home',
      '02Work',
      '03Impact',
      '04About',
      '05Journey',
      '06Contact',
    ]);
  });

  test('menu closes on Escape (focus back on the button), the button, and a link tap', async ({
    page,
  }) => {
    await menuButton(page).click();
    await menu(page).getByRole('link', { name: /Work/ }).focus();
    await page.keyboard.press('Escape');
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton(page)).toBeFocused();
    await expect(menu(page)).toHaveCount(0);

    await menuButton(page).click();
    await menuButton(page).click();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');

    await menuButton(page).click();
    await menu(page).getByRole('link', { name: /About/ }).click();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => topOf(page, '#about'), { timeout: 5000 }).toBe(72);
  });
});

test('header geometry at each breakpoint; everything fits from 320 px', async ({ page }) => {
  const cases = [
    [1440, 66, true, true],
    [1100, 66, true, true],
    [801, 66, true, true],
    [800, 60, true, false],
    [768, 60, true, false],
    [601, 60, true, false],
    [600, 56, false, false],
    [390, 56, false, false],
    [320, 56, false, false],
  ] as const;
  for (const [width, height, navShown, talkShown] of cases) {
    await page.setViewportSize({ width, height: 800 });
    const box = await header(page).boundingBox();
    expect(box?.height, `header height at ${width}px`).toBe(height);
    expect(await desktopNav(page).isVisible(), `nav at ${width}px`).toBe(navShown);
    expect(await header(page).getByRole('link', { name: "Let's talk" }).isVisible()).toBe(
      talkShown,
    );
    const overflow = await header(page).evaluate((h) =>
      [...h.querySelectorAll('a, button')]
        .filter((el) => (el as HTMLElement).offsetParent !== null)
        .some((el) => el.getBoundingClientRect().right > window.innerWidth),
    );
    expect(overflow, `header controls overflow at ${width}px`).toBe(false);
  }
});

test('without JavaScript: name, role and the email line (NFR-C2)', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  // Playwright's text matching skips <noscript>, so check the rendered fallback elements.
  const lines = page.locator('noscript main p');
  await expect(lines.first()).toBeVisible();
  expect(await lines.allTextContents()).toEqual([
    'Devansh — UX Designer & Product Designer',
    'PENDING', // email PENDING (NFR-PR3)
  ]);
  await context.close();
});
