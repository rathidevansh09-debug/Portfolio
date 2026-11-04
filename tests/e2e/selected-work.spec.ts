import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectConsoleErrors, expectNoConsoleErrors } from './helpers/checks.ts';
import { VERIFICATION_WIDTHS, viewportForWidth } from './helpers/viewports.ts';

// Phase 10 verification. Production build: with nothing published, only the heading row
// (owner decision 4). Harness (dev server, fictional TEST data, owner decision 3): views, filters,
// search, show more, empty state, announcement, static cards (owner decision 2), M-05, M-06,
// responsive composition.

const HARNESS = 'http://localhost:5180/tests/e2e/harness/work.html';
const isReduced = (name: string) => name.endsWith('-reduced-motion');
const section = (page: Page) => page.locator('#portfolio');
const toggle = (page: Page) =>
  section(page).getByRole('button', { name: /ALL WORK|SELECTED WORK/ });
const tab = (page: Page, name: string) =>
  section(page)
    .getByRole('group', { name: 'Test filter group' })
    .getByRole('button', { name, exact: true });
const search = (page: Page) => section(page).getByRole('searchbox', { name: 'Search' });
const titles = (page: Page) =>
  section(page)
    .locator('ul > li h3')
    .evaluateAll((hs) => hs.map((h) => h.textContent));
const transform = (l: Locator) =>
  l.evaluate((el) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return { y: m.m42, scale: m.a };
  });

let errors: () => string[];
test.beforeEach(({ page }) => {
  errors = collectConsoleErrors(page);
});
test.afterEach(() => expectNoConsoleErrors(errors));

test.describe('production build', () => {
  test('nothing published yet: the heading row only, no PENDING text', async ({ page }) => {
    await page.goto('/');
    await expect(section(page).getByRole('heading', { level: 2 })).toHaveText('WORK THAT SPEAKS.');
    await expect(
      section(page).locator('button, input, ul, [role="region"], [role="group"]'),
    ).toHaveCount(0);
    await expect(section(page)).not.toContainText('PENDING');
    await expect(section(page)).toHaveText('01 / SELECTED WORKWORK THAT SPEAKS.');
  });
});

test.describe('harness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await section(page).scrollIntoViewIfNeeded();
  });

  test('Selected view shows the featured three in order; unpermitted never appears', async ({
    page,
  }) => {
    await expect
      .poll(() => titles(page))
      .toEqual(['Test project 2', 'Test project 5', 'Test project 9']);
    await expect(toggle(page)).toContainText('ALL WORK');
    await expect(section(page)).not.toContainText('Test project 99');
    const tabs = section(page)
      .getByRole('group', { name: 'Test filter group' })
      .getByRole('button');
    await expect(tabs).toHaveText([
      'All',
      'Product & SaaS',
      'Dashboards & Data',
      'eCommerce',
      'Design Systems',
      'Motion & Video',
      'Visual Design',
    ]);
  });

  test('a filter switches to All view; the underline moves under the selected tab (M-10)', async ({
    page,
  }) => {
    await tab(page, 'eCommerce').click();
    await expect(tab(page, 'eCommerce')).toHaveAttribute('aria-pressed', 'true');
    await expect(tab(page, 'All')).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle(page)).toContainText('SELECTED WORK');
    await expect
      .poll(() => titles(page))
      .toEqual(['Test project 2', 'Test project 3', 'Test project 7', 'Test project 11']);
    // One in-page read, so the tab and its underline are measured in the same frame.
    await expect
      .poll(() =>
        tab(page, 'eCommerce').evaluate((t) => {
          const u = t.querySelector('span[aria-hidden="true"]');
          if (!u) return 'no underline';
          const a = t.getBoundingClientRect();
          const b = u.getBoundingClientRect();
          return Math.abs(a.x - b.x) < 1 && Math.abs(a.width - b.width) < 1
            ? 'aligned'
            : `off by x ${(b.x - a.x).toFixed(1)}, width ${(b.width - a.width).toFixed(1)}`;
        }),
      )
      .toBe('aligned');
    await expect(
      section(page)
        .getByRole('group', { name: 'Test filter group' })
        .locator('span[aria-hidden="true"]'),
    ).toHaveCount(1);
  });

  test('search switches to All view; back to Selected resets; empty state and Reset search', async ({
    page,
  }) => {
    await search(page).fill('project 1');
    await expect(toggle(page)).toContainText('SELECTED WORK');
    await expect
      .poll(() => titles(page))
      .toEqual([
        'Test project 1',
        'Test project 10',
        'Test project 11',
        'Test project 12',
        'Test project 13',
        'Test project 14',
      ]);
    await search(page).fill('zzz');
    await expect(section(page).getByText("No work found for 'zzz'.")).toBeVisible();
    await tab(page, 'Visual Design').click();
    await section(page).getByRole('button', { name: 'Reset search' }).click();
    await expect(search(page)).toHaveValue('');
    await expect(search(page)).toBeFocused();
    await expect(tab(page, 'All')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await titles(page)).length).toBe(9);
    await toggle(page).click();
    await expect(toggle(page)).toContainText('ALL WORK');
    await expect
      .poll(() => titles(page))
      .toEqual(['Test project 2', 'Test project 5', 'Test project 9']);
  });

  test('All view: 9 at a time; "Show more work" adds the rest; count; polite announcement', async ({
    page,
  }) => {
    const live = section(page).locator('[aria-live="polite"]');
    await expect(live).toHaveText('');
    await toggle(page).click();
    await expect.poll(async () => (await titles(page)).length).toBe(9);
    await expect(section(page).getByText('9 of 14 projects')).toBeVisible();
    await expect(live).toHaveText(/TEST 14 projects/);
    await section(page).getByRole('button', { name: 'Show more work' }).click();
    await expect.poll(async () => (await titles(page)).length).toBe(14);
    await expect(section(page).getByRole('button', { name: 'Show more work' })).toHaveCount(0);
  });

  test('cards are static until Phase 11: no control, no focus stop, no hover change', async ({
    page,
  }) => {
    const grid = section(page).locator('ul');
    await expect(grid.locator('button, a, [tabindex]')).toHaveCount(0);
    const card = grid.locator('li').first();
    await expect(card.locator('svg')).toHaveCount(0); // no hover circle, no caption arrow
    const media = card.locator('article > div').first();
    expect(await media.evaluate((el) => getComputedStyle(el).cursor)).not.toBe('pointer');
    const picture = media.locator('> div').first();
    const before = await picture.evaluate((el) => getComputedStyle(el).filter);
    await media.hover();
    await page.waitForTimeout(800);
    expect(await picture.evaluate((el) => getComputedStyle(el).filter)).toBe(before);
    // Keyboard: Tab goes from the search box straight past the grid.
    await search(page).focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.closest('ul') === null)).toBe(true);
  });

  test('M-05: cards enter when they reach the screen (instant with motion off)', async ({
    page,
  }, testInfo) => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.setViewportSize({ width: 1440, height: 400 });
    await page.reload();
    const card = section(page).locator('ul > li').first();
    if (isReduced(testInfo.project.name)) {
      expect(await card.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
      return;
    }
    expect(Number(await card.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(1);
    await card.scrollIntoViewIfNeeded();
    await expect
      .poll(() => card.evaluate((el) => getComputedStyle(el).opacity), { timeout: 3000 })
      .toBe('1');
  });

  test('M-06: images drift with scroll; still with motion off', async ({ page }, testInfo) => {
    const picture = section(page).locator('ul > li').first().locator('article > div > div').first();
    const media = section(page).locator('ul > li').first().locator('article > div').first();
    const top = await media.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const vh = page.viewportSize()?.height ?? 720;
    const at = async (y: number) => {
      await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), y);
      await page.waitForTimeout(200);
      return (await transform(picture)).y;
    };
    const entering = await at(top - vh + 40);
    const leaving = await at(top + 100);
    if (isReduced(testInfo.project.name)) {
      expect([entering, leaving]).toEqual([0, 0]);
      return;
    }
    expect(entering).toBeLessThan(leaving);
    expect(entering).toBeGreaterThanOrEqual(-12);
    expect(leaving).toBeLessThanOrEqual(12);
  });

  test('phone: 2 columns; first card full width at 1.9 : 1, others 1.5 : 1; search row below', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await toggle(page).click();
    await expect.poll(async () => (await titles(page)).length).toBe(9);
    const ratios = await section(page)
      .locator('ul > li article > div:first-child')
      .evaluateAll((els) =>
        els.slice(0, 3).map((el) => {
          const r = el.getBoundingClientRect();
          return {
            ratio: Math.round((r.width / r.height) * 100) / 100,
            left: Math.round(r.left),
            width: Math.round(r.width),
          };
        }),
      );
    expect(ratios[0]?.ratio).toBeCloseTo(1.9, 1);
    expect(ratios[1]?.ratio).toBeCloseTo(1.5, 1);
    expect(ratios[2]?.ratio).toBeCloseTo(1.5, 1);
    expect(ratios[1]?.left).toBeLessThan(ratios[2]?.left ?? 0); // two columns
    const group = section(page).getByRole('group', { name: 'Test filter group' });
    const [g, s] = await Promise.all([group.boundingBox(), search(page).boundingBox()]);
    expect(s?.y ?? 0).toBeGreaterThan((g?.y ?? 0) + (g?.height ?? 0) - 1);
    expect(await group.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true); // scrolls sideways
  });

  test('no horizontal page scroll at all 11 widths', async ({ page }) => {
    for (const width of VERIFICATION_WIDTHS) {
      await page.setViewportSize(viewportForWidth(width));
      const { sw, cw } = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      expect(sw, `${width}px`).toBeLessThanOrEqual(cw);
    }
  });
});
