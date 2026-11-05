import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { collectConsoleErrors, expectNoConsoleErrors } from './helpers/checks.ts';

// Phase 11 verification: the pop-up (PRD FR-M1–M10; DESIGN §8.10, §9.3; ARCHITECTURE R-6, R-7)
// on the dev-server harness with fictional TEST content, plus the real site for the showreel rule
// and code-splitting. Close paths follow the owner decision: Escape (cancel), the close button and
// the backdrop play the M-13 exit before the dialog closes; a native close is cleaned up at once.

const HARNESS = 'http://localhost:5180/tests/e2e/harness/modal.html';
const isReduced = (info: TestInfo) => info.project.name.endsWith('-reduced-motion');
const dialog = (page: Page) => page.locator('dialog');
const panel = (page: Page) => page.locator('dialog [tabindex="-1"]');
const card = (page: Page, title: string) =>
  page.locator('#portfolio').getByRole('button', { name: title, exact: true });

/** Opens a card's pop-up; returns the page offset the scroll lock holds (restored on close). */
async function openCard(page: Page, title: string): Promise<number> {
  if ((await card(page, title).count()) === 0) {
    await page
      .locator('#portfolio')
      .getByRole('button', { name: /ALL WORK/ })
      .click();
  }
  await card(page, title).click();
  await expect(dialog(page)).toHaveJSProperty('open', true);
  return page.evaluate(() => Math.round(-parseFloat(document.body.style.top || '0')));
}

/** Waits until the M-13 entrance has settled (opacity 1, no transform). */
async function settled(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const b = document.querySelector('[data-testid="modal-backdrop"]');
        const p = document.querySelector('dialog [tabindex="-1"]');
        if (!b || !p) return false;
        const t = getComputedStyle(p).transform;
        return (
          getComputedStyle(b).opacity === '1' && (t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)')
        );
      }),
    )
    .toBe(true);
}

/** Records, every frame, whether the dialog is open and the backdrop's opacity, until it is gone. */
async function startCloseSampler(page: Page) {
  await page.evaluate(() => {
    const samples: { open: boolean; opacity: number | null }[] = [];
    (window as unknown as { __samples: typeof samples }).__samples = samples;
    const start = performance.now();
    const tick = () => {
      const d = document.querySelector('dialog');
      const b = d?.querySelector('[data-testid="modal-backdrop"]');
      samples.push({
        open: Boolean(d?.open),
        opacity: b ? Number(getComputedStyle(b).opacity) : null,
      });
      if (d && performance.now() - start < 3000) requestAnimationFrame(tick);
    };
    tick();
  });
}
const closeSamples = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __samples: { open: boolean; opacity: number | null }[] }).__samples,
  );

/** The page behind is restored: no lock styles, scroll position back, focus on the opener. */
async function expectRestored(page: Page, scrollY: number, opener: string) {
  await expect(dialog(page)).toHaveCount(0);
  expect(await page.evaluate(() => document.body.getAttribute('style'))).toBeNull();
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(scrollY);
  await expect(card(page, opener)).toBeFocused();
}

let errors: () => string[];
test.beforeEach(async ({ page }) => {
  errors = collectConsoleErrors(page);
  await page.goto(HARNESS);
  await page.locator('#portfolio').scrollIntoViewIfNeeded();
});
test.afterEach(() => expectNoConsoleErrors(errors));

test.describe('opening (FR-M1, FR-M7, FR-M8)', () => {
  test('a card opens a modal dialog labelled by the title; focus on the panel; page inert and locked', async ({
    page,
  }) => {
    const anchor = () =>
      page.evaluate(() =>
        Math.round(document.getElementById('portfolio')?.getBoundingClientRect().top ?? 0),
      );
    const top = await openCard(page, 'Test full case study');
    const before = await anchor();
    expect(await dialog(page).evaluate((d) => d.matches(':modal'))).toBe(true);
    await expect(dialog(page)).toHaveAccessibleName('Test full case study');
    await expect(panel(page)).toBeFocused();
    // The page behind is inert: it cannot take focus.
    const outsideFocus = await page.evaluate(() => {
      const button = [...document.querySelectorAll('#portfolio button')][0] as HTMLElement;
      button.focus();
      return document.activeElement === button;
    });
    expect(outsideFocus).toBe(false);
    // Wheel over the backdrop and past the end of the panel: the page does not move.
    await page.mouse.move(8, 8);
    await page.mouse.wheel(0, 800);
    await panel(page).hover();
    await page.mouse.wheel(0, 20000);
    await page.waitForTimeout(400);
    expect(await anchor()).toBe(before);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(top);
  });

  test('M-13 entrance: backdrop fades in; panel rises 45 px and scales from 0.97 (instant when off)', async ({
    page,
  }, testInfo) => {
    await page.evaluate(() => {
      const samples: { opacity: number; y: number; scale: number }[] = [];
      (window as unknown as { __open: typeof samples }).__open = samples;
      const start = performance.now();
      const tick = () => {
        const b = document.querySelector('[data-testid="modal-backdrop"]');
        const p = document.querySelector('dialog [tabindex="-1"]');
        if (b && p) {
          const m = new DOMMatrixReadOnly(getComputedStyle(p).transform);
          samples.push({ opacity: Number(getComputedStyle(b).opacity), y: m.m42, scale: m.a });
        }
        if (performance.now() - start < 2500) requestAnimationFrame(tick);
      };
      tick();
    });
    await openCard(page, 'Test full case study');
    await page.waitForTimeout(900);
    const samples = await page.evaluate(
      () =>
        (window as unknown as { __open: { opacity: number; y: number; scale: number }[] }).__open,
    );
    const last = samples.at(-1);
    expect(last).toMatchObject({ opacity: 1, y: 0, scale: 1 });
    if (isReduced(testInfo)) {
      expect(samples[0]).toMatchObject({ opacity: 1, y: 0, scale: 1 });
      return;
    }
    // Visible frames only: WebKit can report an untransformed panel for one frame in which the
    // backdrop layer is still at opacity 0 (nothing is on screen yet).
    const visible = samples.filter((s) => s.opacity > 0);
    const first = visible[0];
    expect(first?.opacity ?? 1).toBeLessThan(0.6);
    expect(first?.y ?? 0).toBeGreaterThan(20);
    expect(first?.scale ?? 1).toBeLessThan(0.99);
    // Monotonic rise: y never increases on the way in.
    for (let i = 1; i < visible.length; i++) {
      expect(visible[i]?.y ?? 0).toBeLessThanOrEqual((visible[i - 1]?.y ?? 0) + 0.5);
    }
  });

  test('the film grain covers the pop-up (repeated on the open dialog)', async ({ page }) => {
    await openCard(page, 'Test minimal project');
    const grain = await dialog(page).evaluate((d) => {
      const s = getComputedStyle(d, '::after');
      return { image: s.backgroundImage, events: s.pointerEvents, position: s.position };
    });
    expect(grain.image).toContain('svg');
    expect(grain.events).toBe('none');
    expect(grain.position).toBe('fixed');
  });
});

test.describe('closing: normal paths play the exit before closing (R-6)', () => {
  const paths = {
    Escape: (page: Page) => page.keyboard.press('Escape'),
    'close button': (page: Page) =>
      dialog(page).getByRole('button', { name: 'Test close' }).click(),
    backdrop: (page: Page) => page.mouse.click(6, 6),
  } as const;

  for (const [name, close] of Object.entries(paths)) {
    test(`${name}: dialog stays open during the M-13 exit, then page restored`, async ({
      page,
    }, testInfo) => {
      const scrollY = await openCard(page, 'Test full case study');
      await settled(page);
      await startCloseSampler(page);
      await close(page);
      await expectRestored(page, scrollY, 'Test full case study');
      const samples = await closeSamples(page);
      // Never closed while the backdrop was still visible.
      expect(samples.filter((s) => !s.open && s.opacity !== null && s.opacity > 0.05)).toEqual([]);
      if (!isReduced(testInfo)) {
        // The exit was visible while the dialog was still open.
        expect(
          samples.some((s) => s.open && s.opacity !== null && s.opacity > 0.05 && s.opacity < 0.95),
        ).toBe(true);
      }
    });
  }

  test('backdrop: a press that starts inside the panel and ends on the backdrop does not close', async ({
    page,
  }) => {
    await openCard(page, 'Test full case study');
    await settled(page);
    const box = await dialog(page).getByRole('heading', { level: 2 }).boundingBox();
    if (!box) throw new Error('title not found');
    await page.mouse.move(box.x + 5, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(6, 6, { steps: 4 });
    await page.mouse.up();
    await page.mouse.move(6, 6);
    await page.mouse.down();
    await page.mouse.move(box.x + 5, box.y + box.height / 2, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    await expect(dialog(page)).toHaveJSProperty('open', true);
  });

  test('a burst of close requests in one moment closes once; reopening works', async ({ page }) => {
    const scrollY = await openCard(page, 'Test full case study');
    await settled(page);
    // Close button twice, Escape (cancel) and a full backdrop press, all in the same task.
    await page.evaluate(() => {
      const d = document.querySelector('dialog');
      const close = d?.querySelector<HTMLButtonElement>('button[aria-label="Test close"]');
      const b = d?.querySelector('[data-testid="modal-backdrop"]');
      close?.click();
      close?.click();
      d?.dispatchEvent(new Event('cancel', { cancelable: true }));
      b?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      b?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      b?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await expectRestored(page, scrollY, 'Test full case study');
    await openCard(page, 'Test full case study');
    await expect(panel(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expectRestored(page, scrollY, 'Test full case study');
  });

  test('real input during the exit (close, Escape, backdrop) is ignored', async ({
    page,
  }, testInfo) => {
    test.skip(isReduced(testInfo), 'motion off: the pop-up closes at once, there is no exit');
    const scrollY = await openCard(page, 'Test full case study');
    await settled(page);
    const close = dialog(page).getByRole('button', { name: 'Test close' });
    await close.click();
    await close.click({ force: true, timeout: 1000 }).catch(() => {});
    await page.keyboard.press('Escape');
    await page.mouse.click(6, 6);
    await expectRestored(page, scrollY, 'Test full case study');
  });

  test('repeated Escape: observed per browser; the end state is always consistent', async ({
    page,
  }, testInfo) => {
    const scrollY = await openCard(page, 'Test full case study');
    await settled(page);
    await startCloseSampler(page);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expectRestored(page, scrollY, 'Test full case study');
    const samples = await closeSamples(page);
    const exitPlayed = samples.some(
      (s) => s.open && s.opacity !== null && s.opacity > 0.05 && s.opacity < 0.95,
    );
    // Recorded, not asserted: a browser may close the dialog natively on a second Escape (the
    // close-event fallback then cleans up at once). Reported in the Phase 11 checkpoint.
    testInfo.annotations.push({
      type: 'repeated-escape',
      description: `${testInfo.project.name}: exit animation ${exitPlayed ? 'played' : 'skipped'}`,
    });
    console.log(
      `[repeated-escape] ${testInfo.project.name}: exit ${exitPlayed ? 'played' : 'skipped'}`,
    );
  });

  test('unexpected native closure: cleaned up at once and only once; reopening works', async ({
    page,
  }) => {
    const scrollY = await openCard(page, 'Test full case study');
    await settled(page);
    await page.evaluate(() => {
      const d = document.querySelector('dialog');
      d?.close();
      d?.close(); // a second native close does nothing
    });
    await expectRestored(page, scrollY, 'Test full case study');
    await openCard(page, 'Test full case study');
    await expect(panel(page)).toBeFocused();
    await dialog(page).getByRole('button', { name: 'Test close' }).click();
    await expectRestored(page, scrollY, 'Test full case study');
  });
});

test.describe('focus (FR-M8; ARCHITECTURE §10)', () => {
  test('Tab and Shift+Tab never leave the pop-up; focus returns to the card on close', async ({
    page,
    browserName,
  }) => {
    // WebKit moves focus to buttons only with Option+Tab (as Safari does by default).
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await openCard(page, 'Test full case study');
    await settled(page);
    const outside = () =>
      page.evaluate(() => {
        const a = document.activeElement;
        const d = document.querySelector('dialog');
        return Boolean(a && a !== document.body && d && !d.contains(a));
      });
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press(tab);
      expect(await outside()).toBe(false);
    }
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(`Shift+${tab}`);
      expect(await outside()).toBe(false);
    }
    await page.keyboard.press('Escape');
    await expect(card(page, 'Test full case study')).toBeFocused();
  });

  test('keyboard: Tab reaches the card, Enter opens, Escape returns focus to it', async ({
    page,
    browserName,
  }) => {
    await page.locator('#portfolio').getByRole('searchbox').focus();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    const first = card(page, 'Test full case study');
    await expect(first).toBeFocused();
    const ring = await first.evaluate((el) => {
      const article = el.closest('article') as HTMLElement;
      return getComputedStyle(article).outlineStyle;
    });
    expect(ring).toBe('solid');
    await page.keyboard.press('Enter');
    await expect(dialog(page)).toHaveJSProperty('open', true);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await expect(first).toBeFocused();
  });
});

test.describe('content (FR-M2–M6; DESIGN §8.10)', () => {
  test('full project: heading bar, media, summary row, verified facts, numbered blocks', async ({
    page,
  }) => {
    await openCard(page, 'Test full case study');
    await expect(dialog(page).locator('p').first()).toHaveText('Test category 1·2021');
    await expect(dialog(page).getByRole('img', { name: 'TEST HERO 1' })).toBeVisible();
    const link = dialog(page).getByRole('link', { name: /Test visit site/ });
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(dialog(page).locator('dt')).toHaveText([
      'CLIENT',
      'YEAR',
      'MY ROLE',
      'PLATFORM',
      'TOOLS',
    ]);
    await expect(dialog(page).getByRole('heading', { level: 3 })).toHaveText([
      '01 / OVERVIEW',
      '02 / PROBLEM',
      '03 / RESEARCH',
      '04 / PROCESS & DECISIONS',
      '05 / FINAL DESIGNS',
      '06 / OUTCOMES',
    ]);
    await expect(dialog(page)).not.toContainText('Test unverified outcome');
    await expect(dialog(page)).not.toContainText('Test team (unverified)');
  });

  test('minimal project (FR-M6): top area and gallery only', async ({ page }) => {
    await openCard(page, 'Test minimal project');
    await expect(dialog(page).locator('dl')).toHaveCount(0);
    await expect(dialog(page).getByRole('link')).toHaveCount(0);
    await expect(dialog(page).getByRole('heading', { level: 3 })).toHaveText([
      '01 / FINAL DESIGNS',
    ]);
    await expect(dialog(page).getByText('01 / 02')).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Test next image' }).click();
    await expect(dialog(page).getByText('02 / 02')).toBeVisible();
    await expect(dialog(page).getByRole('img', { name: 'TEST MIN 2' })).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Test next image' }).click();
    await expect(dialog(page).getByText('01 / 02')).toBeVisible(); // wraps [REC]
  });

  test('heading bar stays fixed at the top while the content scrolls (D-14)', async ({ page }) => {
    await openCard(page, 'Test full case study');
    await settled(page);
    const heading = dialog(page).getByRole('button', { name: 'Test close' }).locator('..');
    const before = await heading.boundingBox();
    await panel(page).evaluate((el) => (el.scrollTop = 1500));
    await page.waitForTimeout(100);
    const after = await heading.boundingBox();
    expect(Math.round(after?.y ?? -1)).toBe(Math.round(before?.y ?? -2));
    expect(await panel(page).evaluate((el) => el.scrollTop)).toBeGreaterThan(1000);
  });

  test('M-03b: each block reveals once per opening; reopening replays', async ({
    page,
  }, testInfo) => {
    await openCard(page, 'Test full case study');
    await settled(page);
    const last = dialog(page).locator('section').last();
    const opacity = () => last.evaluate((el) => Number(getComputedStyle(el).opacity));
    if (isReduced(testInfo)) {
      expect(await opacity()).toBe(1);
      return;
    }
    expect(await opacity()).toBe(0);
    await panel(page).evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect.poll(opacity, { timeout: 3000 }).toBe(1);
    await panel(page).evaluate((el) => (el.scrollTop = 0));
    await page.waitForTimeout(300);
    await panel(page).evaluate((el) => (el.scrollTop = el.scrollHeight));
    // No replay within the same opening: it is fully visible straight away.
    expect(await opacity()).toBe(1);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await openCard(page, 'Test full case study');
    await settled(page);
    expect(
      await dialog(page)
        .locator('section')
        .last()
        .evaluate((el) => Number(getComputedStyle(el).opacity)),
    ).toBe(0);
  });

  test('before/after: toggles show each image fully; neither selected at 50 %; drag clears', async ({
    page,
  }) => {
    await openCard(page, 'Test before after');
    const range = dialog(page).getByRole('slider', { name: 'Compare wireframe and final design' });
    const wire = dialog(page).getByRole('button', { name: 'Wireframe', exact: true });
    const fin = dialog(page).getByRole('button', { name: 'Final', exact: true });
    await expect(range).toHaveValue('50');
    await expect(wire).toHaveAttribute('aria-pressed', 'false');
    await expect(fin).toHaveAttribute('aria-pressed', 'false');
    const clip = () =>
      dialog(page)
        .locator('[style*="clip-path"]')
        .first()
        .evaluate((el) => getComputedStyle(el).clipPath);
    await wire.click();
    await expect(range).toHaveValue('100');
    await expect(wire).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(clip).toContain('100%');
    await fin.click();
    await expect(range).toHaveValue('0');
    await expect(fin).toHaveAttribute('aria-pressed', 'true');
    await expect(wire).toHaveAttribute('aria-pressed', 'false');
    await range.focus();
    await page.keyboard.press('ArrowRight');
    await expect(range).toHaveValue('1');
    await expect(fin).toHaveAttribute('aria-pressed', 'false');
  });

  test('showreel and milestone items use the same pop-up', async ({ page }) => {
    await page.getByRole('button', { name: 'Test open showreel' }).click();
    await expect(dialog(page)).toHaveAccessibleName('Test local clip');
    await expect(dialog(page).locator('p').first()).toHaveText('MOTION / VIDEO');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Test open showreel' })).toBeFocused();

    await page.getByRole('button', { name: 'Test open Test document milestone' }).click();
    await expect(dialog(page)).toHaveAccessibleName('Test document milestone');
    await expect(dialog(page).locator('p').first()).toHaveText('2019');
    await expect(dialog(page).getByRole('img', { name: 'TEST DOC PREVIEW' })).toBeVisible();
    const doc = dialog(page).getByRole('link', { name: /Open document/ });
    await expect(doc).toHaveAttribute('href', '/tests/e2e/harness/test-document.pdf');
    await expect(doc).toHaveAttribute('target', '_blank');
    await dialog(page).getByRole('button', { name: 'Test close' }).click();
    await expect(dialog(page)).toHaveCount(0);
  });
});

test.describe('video states (FR-M10; A-4, A-5)', () => {
  test('nothing from YouTube or Vimeo loads before Play; embeds use the no-cookie domain', async ({
    page,
  }) => {
    const thirdParty: string[] = [];
    await page.route(/youtube|vimeo|ytimg/, (route) => {
      thirdParty.push(route.request().url());
      return route.abort();
    });
    await openCard(page, 'Test embed video');
    await page.waitForTimeout(800);
    expect(thirdParty).toEqual([]);
    await expect(dialog(page).locator('iframe')).toHaveCount(0);
    await expect(
      dialog(page).getByText("If the video is restricted, use 'Open original'."),
    ).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Test play Test embedded clip' }).click();
    await expect(dialog(page).locator('iframe')).toHaveAttribute(
      'src',
      /^https:\/\/www\.youtube-nocookie\.com\/embed\/TESTtest000/,
    );
  });

  test('local clip: poster + Play; after Play a missing file shows the error state', async ({
    page,
  }) => {
    await openCard(page, 'Test local video');
    await expect(dialog(page).locator('video')).toHaveCount(0);
    await dialog(page).getByRole('button', { name: 'Test play Test local clip' }).click();
    await expect(dialog(page).getByRole('alert')).toContainText(
      "Preview couldn't load. Open the original source to watch.",
      { timeout: 15_000 },
    );
    await expect(dialog(page).getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});

test.describe('responsive (FR-M9; DESIGN §10)', () => {
  test('phone 390: 12 px margin, 4 : 3 media, stacked summary with a full-width button, 2 fact columns', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openCard(page, 'Test full case study');
    await settled(page);
    const box = await panel(page).boundingBox();
    expect(Math.round(box?.x ?? 0)).toBe(12);
    expect(Math.round(box?.width ?? 0)).toBe(366);
    expect(Math.round(box?.y ?? 0)).toBe(12);
    const media = await dialog(page)
      .getByRole('img', { name: 'TEST HERO 1' })
      .locator('xpath=ancestor::div[1]') // the media box (the <picture> has no box of its own)
      .boundingBox();
    expect((media?.width ?? 0) / (media?.height ?? 1)).toBeCloseTo(4 / 3, 1);
    const link = await dialog(page)
      .getByRole('link', { name: /Test visit site/ })
      .boundingBox();
    expect(Math.round(link?.width ?? 0)).toBe(366 - 2 - 36); // panel − borders − 2 × 18 px padding
    const columns = await dialog(page)
      .locator('dl')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(2);
  });

  test('desktop 1440: 1040 px panel centred, 16 : 9 media, 4 fact columns', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openCard(page, 'Test full case study');
    await settled(page);
    const box = await panel(page).boundingBox();
    expect(Math.round(box?.width ?? 0)).toBe(1040);
    expect(Math.round(box?.x ?? 0)).toBe(200);
    expect(Math.round(box?.height ?? 0)).toBe(900 - 56);
    const columns = await dialog(page)
      .locator('dl')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(4);
  });

  test('pop-up images and before/after pairs stay within 60 % of the screen height', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openCard(page, 'Test before after');
    const stage = await dialog(page)
      .getByRole('slider')
      .evaluate((el) => (el.parentElement as HTMLElement).getBoundingClientRect().height);
    expect(Math.round(stage)).toBeLessThanOrEqual(540);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await openCard(page, 'Test full case study');
    const hero = await dialog(page)
      .getByRole('img', { name: 'TEST HERO 1' })
      .locator('xpath=ancestor::div[2]')
      .boundingBox();
    expect(Math.round(hero?.height ?? 999)).toBeLessThanOrEqual(540);
  });

  test('no horizontal overflow inside the pop-up from 320 to 1920 px', async ({ page }) => {
    await openCard(page, 'Test full case study');
    for (const width of [320, 370, 390, 600, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width <= 600 ? 844 : 900 });
      const overflow = await panel(page).evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(overflow, `${width}px`).toBeLessThanOrEqual(0);
      const box = await panel(page).boundingBox();
      expect((box?.x ?? 0) + (box?.width ?? 0), `${width}px`).toBeLessThanOrEqual(width);
    }
  });
});

test.describe('cards (M-07a; owner decisions, Phases 10–11)', () => {
  test('mouse hover: circle rises from 10 % below centre and appears; image saturates; arrow turns accent', async ({
    page,
  }, testInfo) => {
    const article = card(page, 'Test full case study').locator('xpath=ancestor::article');
    const ring = article
      .locator('span[aria-hidden="true"]')
      .filter({ has: page.locator('svg') })
      .first();
    const restY = await ring.evaluate(
      (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42,
    );
    const height = await ring.evaluate((el) => el.getBoundingClientRect().height);
    expect(restY).toBeCloseTo(-0.5 * height + 0.1 * height, 0);
    expect(await ring.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
    await article.hover();
    await expect.poll(() => ring.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect
      .poll(() =>
        ring.evaluate((el) =>
          Math.round(new DOMMatrixReadOnly(getComputedStyle(el).transform).m42),
        ),
      )
      .toBe(Math.round(-0.5 * height));
    const picture = article.locator('> div').first().locator('> div').first();
    await expect
      .poll(() => picture.evaluate((el) => getComputedStyle(el).filter))
      .toBe('saturate(1)');
    if (isReduced(testInfo)) {
      // Motion off: instant (no transition).
      expect(await ring.evaluate((el) => getComputedStyle(el).transitionDuration)).toMatch(/^0s/);
    }
  });

  test('a long title stays on one line and ends in an ellipsis; the whole card is still the target', async ({
    page,
  }) => {
    // Located by position: renaming it below would break a name-based locator.
    const button = page.locator('#portfolio ul > li h3 button').first();
    await button.evaluate((el) => {
      el.textContent = 'Test an extremely long project title that cannot fit on one card line';
    });
    const fit = await button.evaluate((el) => {
      const h3 = el.closest('h3') as HTMLElement;
      return {
        within: el.getBoundingClientRect().width <= h3.getBoundingClientRect().width + 0.5,
        overflowing: el.scrollWidth > el.clientWidth,
        ellipsis: getComputedStyle(el).textOverflow,
        oneLine:
          el.getBoundingClientRect().height < 2 * parseFloat(getComputedStyle(el).lineHeight),
      };
    });
    expect(fit).toEqual({ within: true, overflowing: true, ellipsis: 'ellipsis', oneLine: true });
    const media = await button.locator('xpath=ancestor::article/div[1]').boundingBox();
    if (!media) throw new Error('card media not found');
    const hit = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x ?? 0, y ?? 0)?.closest('button') !== null,
      [media.x + media.width / 2, media.y + media.height / 2],
    );
    expect(hit).toBe(true);
  });

  test('touch screens: circle always visible, image at 90 % saturation (no hover needed)', async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('firefox'), 'Firefox has no mobile emulation');
    const context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await page.goto(HARNESS);
    const article = card(page, 'Test full case study').locator('xpath=ancestor::article');
    await article.scrollIntoViewIfNeeded();
    const ring = article
      .locator('span[aria-hidden="true"]')
      .filter({ has: page.locator('svg') })
      .first();
    expect(await ring.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await context.close();
  });
});

test.describe('code splitting and showreel (ARCHITECTURE §9.2; FR-HE8, A-7)', () => {
  test('dev: the pop-up code is fetched on card hover when idle prefetch has not run', async ({
    page,
  }) => {
    const requested: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/src/modal/ProjectModal.tsx')) requested.push(r.url());
    });
    await page.goto(`${HARNESS}?idle=off`);
    await page.waitForTimeout(1500);
    expect(requested).toEqual([]);
    await card(page, 'Test full case study').hover();
    await expect.poll(() => requested.length).toBeGreaterThan(0);
  });

  test('production: the pop-up is a separate chunk, fetched when the browser is idle', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const queue: (() => void)[] = [];
      (window as unknown as { __idle: typeof queue }).__idle = queue;
      window.requestIdleCallback = ((cb: () => void) => {
        queue.push(cb);
        return queue.length;
      }) as typeof window.requestIdleCallback;
    });
    const chunks: string[] = [];
    page.on('request', (r) => {
      if (/\/assets\/ProjectModal-[^/]+\.js$/.test(r.url())) chunks.push(r.url());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(chunks).toEqual([]);
    await page.evaluate(() => {
      for (const cb of (window as unknown as { __idle: (() => void)[] }).__idle) cb();
    });
    await expect.poll(() => chunks.length).toBe(1);
  });

  test('dev site: "Play showreel" opens the first featured project while it may be shown (A-7)', async ({
    page,
  }) => {
    await page.goto('http://localhost:5180/');
    const reel = page
      .locator('#home')
      .getByRole('button', { name: 'PLAY SHOWREEL MOTION / VIDEO' });
    await reel.click();
    await expect(dialog(page)).toHaveAccessibleName('PNG Jewellers');
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await expect(reel).toBeFocused();
  });
});
