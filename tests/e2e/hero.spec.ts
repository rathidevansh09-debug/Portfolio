import { expect, test, type Locator, type Page } from '@playwright/test';
import { MOTION_STORAGE_KEY } from '../../src/motion/preference.ts';
import { collectConsoleErrors, expectNoConsoleErrors } from './helpers/checks.ts';
import { VERIFICATION_WIDTHS, anchorOffset, viewportForWidth } from './helpers/viewports.ts';

// Phase 9 verification (built site unless noted): entrance timeline (M-01, M-02a–c; DESIGN §9.2),
// start gate (PRD §13), motion off (MO-5), scroll depth (M-04), name fit (DESIGN §5.7), hero heights
// per breakpoint, PENDING content hidden in production (owner decision 3), "See my work →",
// showreel visual only while it has nothing to open (Phase 11; production has none yet).
// Stats layouts 0–3 use the dev-server harness.

const HARNESS = 'http://localhost:5180/tests/e2e/harness/hero.html';
const isReduced = (name: string) => name.endsWith('-reduced-motion');
const part = (page: Page, name: string) => page.locator(`[data-hero-part="${name}"]`);
const hero = (page: Page) => page.locator('#home');

const opacity = (l: Locator) => l.evaluate((el) => Number(getComputedStyle(el).opacity));
const translate = (l: Locator) =>
  l.evaluate((el) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return { x: m.m41, y: m.m42, scale: m.a };
  });
/** Bottom inset of the word's clip, in % (100 = hidden, 0 = fully shown). */
const clipBottom = (page: Page) =>
  part(page, 'word').evaluate((el) => {
    const clip = getComputedStyle(el).clipPath;
    if (clip === 'none') return 0;
    const values = clip.match(/-?\d*\.?\d+(?:e-?\d+)?%?/g) ?? [];
    return Number.parseFloat(values[2] ?? '0');
  });

let errors: () => string[];
test.beforeEach(({ page }) => {
  errors = collectConsoleErrors(page);
});
test.afterEach(() => expectNoConsoleErrors(errors));

interface Sample {
  readonly t: number;
  readonly clip: number;
  readonly portrait: number;
  readonly intro: number;
  readonly introX: number;
  readonly side: number;
  readonly sideX: number;
}

test('entrance timeline follows DESIGN §9.2 (M-01, M-02a–c)', async ({ page }, testInfo) => {
  test.skip(isReduced(testInfo.project.name), 'motion off: covered by the final-state test');
  // Motion runs these on the browser's animation timeline, which Playwright's clock does not
  // control, so the page records its own timeline: every frame from the moment the start gate
  // opens, timed with performance.now().
  await page.addInitScript(() => {
    const w = window as unknown as { __heroTimeline?: unknown[] };
    const read = () => {
      const q = (s: string) => document.querySelector(`[data-hero-part="${s}"]`) as HTMLElement;
      const cs = (s: string) => getComputedStyle(q(s));
      const clip = cs('word').clipPath;
      const x = (s: string) => new DOMMatrixReadOnly(cs(s).transform).m41;
      return {
        clip:
          clip === 'none'
            ? 0
            : Number.parseFloat(clip.match(/-?\d*\.?\d+(?:e-?\d+)?%?/g)?.[2] ?? '0'),
        portrait: Number(cs('portrait').opacity),
        intro: Number(cs('intro').opacity),
        introX: x('intro'),
        side: Number(cs('side').opacity),
        sideX: x('side'),
      };
    };
    const record = () => {
      const t0 = performance.now();
      const samples: unknown[] = [];
      const tick = () => {
        const t = performance.now() - t0;
        samples.push({ t, ...read() });
        if (t < 1800) requestAnimationFrame(tick);
        else w.__heroTimeline = samples;
      };
      tick();
    };
    new MutationObserver((_, observer) => {
      if (document.querySelector('#home[data-started]')) {
        observer.disconnect();
        record();
      }
    }).observe(document, { subtree: true, childList: true, attributes: true });
  });
  await page.goto('/');
  const samples = (await page
    .waitForFunction(
      () => (window as unknown as { __heroTimeline?: unknown[] }).__heroTimeline,
      undefined,
      { timeout: 10000 },
    )
    .then((h) => h.jsonValue())) as Sample[];
  const frame = 34; // two frames of tolerance
  const at = (ms: number) =>
    samples.reduce((best, s) => (Math.abs(s.t - ms) < Math.abs(best.t - ms) ? s : best));
  const firstTime = (pick: (s: Sample) => number) =>
    samples.find((s) => pick(s) > 0.02)?.t ?? Infinity;

  // Start: every part at its starting state.
  const first = samples[0] as Sample;
  expect(first.clip).toBeGreaterThan(85);
  expect([first.portrait, first.intro, first.side]).toEqual([0, 0, 0]);
  expect(first.introX).toBeCloseTo(-35, 0);
  expect(first.sideX).toBeCloseTo(30, 0);

  // M-01 starts at 0 and wipes top → bottom; finished by 1.4 s.
  expect(at(300).clip).toBeLessThan(first.clip);
  // Signature easing (MO-1, M-01 [EXACT]): ≈ 53 % revealed at 0.2 s (clip ≈ 47); Motion's default
  // curves would only reach 17–23 % (clip ≈ 77–83).
  expect(at(200).clip).toBeLessThan(62);
  expect(at(1400 + frame).clip).toBeLessThan(1);

  // Delays: portrait 0.2 s, intro 0.35 s, side 0.55 s.
  expect(firstTime((s) => s.portrait)).toBeGreaterThanOrEqual(200 - frame);
  expect(firstTime((s) => s.intro)).toBeGreaterThanOrEqual(350 - frame);
  expect(firstTime((s) => s.side)).toBeGreaterThanOrEqual(550 - frame);
  expect(firstTime((s) => s.portrait)).toBeLessThan(firstTime((s) => s.intro));
  expect(firstTime((s) => s.intro)).toBeLessThan(firstTime((s) => s.side));

  // M-02a at 20 % of its 1.2 s fade (t = 0.44 s): provisional ease-out ≈ 0.3; the signature
  // curve would be ≈ 0.6 [TO VERIFY in Phase 16].
  expect(at(440).portrait).toBeGreaterThan(0.15);
  expect(at(440).portrait).toBeLessThan(0.45);

  // Ends: intro 1.25 s, portrait 1.4 s, side 1.55 s (DESIGN §9.2).
  const end = at(1550 + 2 * frame);
  expect([end.portrait, end.intro, end.side]).toEqual([1, 1, 1]);
  expect(end.introX).toBeCloseTo(0, 0);
  expect(end.sideX).toBeCloseTo(0, 0);
});

test('motion off: the hero is in its final state immediately (MO-5)', async ({
  page,
}, testInfo) => {
  if (!isReduced(testInfo.project.name)) {
    await page.addInitScript((key) => localStorage.setItem(key, 'off'), MOTION_STORAGE_KEY);
  }
  await page.goto('/');
  await expect(hero(page)).toHaveAttribute('data-started', '');
  expect(await clipBottom(page)).toBe(0);
  for (const name of ['portrait', 'intro', 'side']) {
    expect(await opacity(part(page, name)), name).toBe(1);
    expect(await translate(part(page, name)), name).toEqual({ x: 0, y: 0, scale: 1 });
  }
});

test('start gate waits for the fonts, but never longer than the 1.5 s cap', async ({
  page,
}, testInfo) => {
  test.skip(isReduced(testInfo.project.name), 'no gate when motion is off');
  await page.route('**/fonts/*.woff2', async (route) => {
    await new Promise((r) => setTimeout(r, 4000));
    await route.continue().catch(() => {});
  });
  const t0 = Date.now();
  await page.goto('/', { waitUntil: 'commit' });
  await expect(hero(page)).toBeAttached();
  await expect(hero(page)).not.toHaveAttribute('data-started', '', { timeout: 500 });
  await expect(hero(page)).toHaveAttribute('data-started', '', { timeout: 4000 });
  expect(Date.now() - t0).toBeLessThan(3800); // opened by the cap, not by the 4 s fonts
});

test('no layout shift while the hero loads (PRD §13, NFR-P1)', async ({ page, browserName }) => {
  const layout = () =>
    page.evaluate(() =>
      ['h1', '[data-hero-part="side"]', '[data-hero-part="word-depth"]'].map((s) => {
        const el = document.querySelector(s) as HTMLElement;
        return [el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight];
      }),
    );
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toBeAttached();
  const before = await layout();
  await page.waitForTimeout(2000);
  expect(await layout()).toEqual(before);
  if (browserName === 'chromium') {
    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const e of list.getEntries() as (PerformanceEntry & { value: number })[])
              total += e.value;
          }).observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => resolve(total), 200);
        }),
    );
    expect(cls).toBeLessThan(0.01);
  }
});

test('scroll depth (M-04) halfway through the hero scroll-out; none with motion off', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(hero(page)).toHaveAttribute('data-started', '');
  const { top, height } = await hero(page).evaluate((el) => ({
    top: el.getBoundingClientRect().top + window.scrollY,
    height: (el as HTMLElement).offsetHeight,
  }));
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top + height / 2);
  const expectNear = async (name: string, want: { y: number; scale: number }) =>
    expect
      .poll(
        async () => {
          const t = await translate(part(page, name));
          return Math.abs(t.y - want.y) < 2 && Math.abs(t.scale - want.scale) < 0.005;
        },
        { message: name },
      )
      .toBe(true);
  if (isReduced(testInfo.project.name)) {
    await page.waitForTimeout(300);
    for (const name of ['word-depth', 'intro-depth'])
      expect(await translate(part(page, name))).toEqual({ x: 0, y: 0, scale: 1 });
    expect(await translate(page.locator('[data-hero-portrait]'))).toEqual({ x: 0, y: 0, scale: 1 });
    return;
  }
  await expectNear('word-depth', { y: 90, scale: 1 });
  await expectNear('intro-depth', { y: -27.5, scale: 1 });
  await expect
    .poll(async () => {
      const t = await translate(page.locator('[data-hero-portrait]'));
      return Math.abs(t.y - 42.5) < 2 && Math.abs(t.scale - 1.04) < 0.005;
    })
    .toBe(true);
});

test('DEVANSH. stays on one line inside its column at all 11 widths (DESIGN §5.7)', async ({
  page,
}) => {
  await page.goto('/');
  for (const width of VERIFICATION_WIDTHS) {
    await page.setViewportSize(viewportForWidth(width));
    const fit = await page.locator('h1').evaluate((h1) => {
      const tops = new Set<number>();
      const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) tops.add(Math.round(r.top));
      }
      const column = h1.closest('[data-hero-part="intro-depth"]') as HTMLElement;
      return {
        lines: tops.size,
        nameWidth: h1.scrollWidth,
        columnWidth: column.clientWidth,
        right: h1.getBoundingClientRect().left + h1.scrollWidth,
      };
    });
    expect(fit.lines, `lines at ${width}px`).toBe(1);
    expect(fit.nameWidth, `name wider than its column at ${width}px`).toBeLessThanOrEqual(
      fit.columnWidth + 1,
    );
    expect(fit.right, `name past the viewport at ${width}px`).toBeLessThanOrEqual(width);
  }
});

test('hero height per breakpoint (DESIGN §8.1)', async ({ page }) => {
  await page.goto('/');
  const cases = [
    [1920, 1200, 990], // capped at 990
    [1440, 900, 834], // screen height − 66 px header
    [1440, 700, 720], // floor 720
    [1100, 900, 730],
    [800, 1000, 690],
    [600, 900, 780],
    [390, 844, 780],
    [370, 800, 770],
  ] as const;
  for (const [width, height, expected] of cases) {
    await page.setViewportSize({ width, height });
    expect(
      await hero(page).evaluate((el) => (el as HTMLElement).offsetHeight),
      `${width}×${height}`,
    ).toBe(expected);
  }
});

test('production build: PENDING hero content renders nothing (owner decision 3)', async ({
  page,
}) => {
  await page.goto('/');
  await expect(hero(page).locator('[data-pending]')).toHaveCount(0);
  await expect(hero(page)).not.toContainText('PENDING');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DEVANSH.');
});

test('"See my work →" goes to Selected Work; "Play showreel" has nothing to open yet (no control)', async ({
  page,
}) => {
  await page.goto('/');
  await expect(hero(page).getByText('PLAY SHOWREEL')).toBeVisible();
  await expect(hero(page).getByRole('button')).toHaveCount(0);
  const work = hero(page).getByRole('link', { name: 'See my work' });
  await expect(work.locator('svg')).toHaveClass(/lucide-arrow-right/);
  await work.click();
  await expect(page).toHaveURL(/#portfolio$/);
  const offset = anchorOffset(page.viewportSize()?.width ?? 1280);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Math.round(document.getElementById('portfolio')?.getBoundingClientRect().top ?? 0),
        ),
      { timeout: 5000 },
    )
    .toBe(offset);
});

test.describe('stats layouts with 0–3 verified stats (harness, fictional values)', () => {
  for (const width of [1440, 390]) {
    for (const count of [0, 1, 2, 3]) {
      test(`${count} stat(s) at ${width}px: CV link follows; column clear of the strips`, async ({
        page,
      }) => {
        await page.setViewportSize(viewportForWidth(width));
        await page.goto(`${HARNESS}?stats=${count}`);
        await expect(hero(page)).toHaveAttribute('data-started', '');
        const side = part(page, 'side');
        await expect(side.getByText(/^TEST STAT LABEL/)).toHaveCount(count);
        const cv = side.getByRole('link', { name: 'Download CV' });
        await expect(cv).toBeVisible();
        const box = await page.evaluate(() => {
          const r = (s: string) => document.querySelector(s)?.getBoundingClientRect() as DOMRect;
          const sideEl = document.querySelector('[data-hero-part="side"]') as HTMLElement;
          const strip = [...document.querySelectorAll('#home > div')].at(-1) as HTMLElement;
          return {
            sideTop: sideEl.getBoundingClientRect().top,
            sideBottom: sideEl.getBoundingClientRect().bottom,
            bottomStripTop: strip.getBoundingClientRect().top,
            heroTop: r('#home').top,
            cvBox: (() => {
              const a = sideEl.querySelector('a[href="#test-cv"]') as HTMLElement;
              const b = a.getBoundingClientRect();
              return [b.width, b.height];
            })(),
          };
        });
        expect(box.sideBottom).toBeLessThanOrEqual(box.bottomStripTop);
        expect(box.sideTop).toBeGreaterThan(box.heroTop);
        expect(box.cvBox[0]).toBeGreaterThanOrEqual(44); // touch target (DESIGN §6.5)
        expect(box.cvBox[1]).toBeGreaterThanOrEqual(44);
      });
    }
  }
});
