import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import {
  collectConsoleErrors,
  expectNoConsoleErrors,
  expectNoHorizontalScroll,
} from './helpers/checks.ts';
import { VERIFICATION_WIDTHS, viewportForWidth } from './helpers/viewports.ts';

// Phase 7 verification on the component harness (dev server, see playwright.config.ts).
// Real video playback is verified in Phase 11 (owner decision): media events are mocked here and no
// video file exists. YouTube/Vimeo are never contacted: their hosts are answered by a local stub, and
// every other non-local request is aborted and recorded as a failure.

const HARNESS = 'http://localhost:5180/tests/e2e/harness/components.html';
const YOUTUBE_EMBED = 'https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1';
const VIMEO_EMBED = 'https://player.vimeo.com/video/123456789?dnt=1&autoplay=1';
const STUB_EMBED =
  '<!doctype html><html lang="en"><head><title>Test embed stub</title></head><body></body></html>';
const ACCENT = 'rgb(0, 213, 232)';
// PRD §13 / AGENTS §12: the video load timeout is 14 s (checked independently of the component).
const VIDEO_LOAD_TIMEOUT_MS = 14_000;

const isReduced = (name: string) => name.endsWith('-reduced-motion');
const isLocalUrl = (url: string) =>
  url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://localhost:5180/');

interface Harness {
  /** Every request the page made, in order. */
  readonly requests: string[];
  readonly errors: () => string[];
}

async function openHarness(page: Page): Promise<Harness> {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  const errors = collectConsoleErrors(page);
  // Last registered route wins: specific stubs are registered after the catch-all.
  await page.route(
    (url) => !isLocalUrl(url.href),
    (route) => route.abort(),
  );
  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: STUB_EMBED }),
  );
  await page.route('https://player.vimeo.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: STUB_EMBED }),
  );
  await page.route('**/__harness/test-clip.en.vtt', (route) =>
    route.fulfill({ contentType: 'text/vtt', body: 'WEBVTT\n' }),
  );
  // The clip never answers by default: the player stays "loading" until a test acts.
  await page.route('**/__harness/test-clip.mp4', () => {});
  await page.goto(HARNESS);
  await expect(page.getByTestId('motion-state')).toHaveText(/on|off/);
  return { requests, errors };
}

const thirdParty = (requests: readonly string[]) => requests.filter((u) => !isLocalUrl(u));
const playerState = (group: Locator) => group.locator('[data-state]').first();
const playButton = (group: Locator) => group.getByRole('button', { name: 'PENDING' });

async function tabTo(page: Page, target: Locator, browserName: string): Promise<void> {
  const key = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await page.getByTestId('motion-toggle').focus();
  for (let i = 0; i < 80; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press(key);
  }
  throw new Error('target never received keyboard focus');
}

const outline = (l: Locator) =>
  l.evaluate((el) => {
    const s = getComputedStyle(el);
    return [s.outlineStyle, s.outlineWidth, s.outlineOffset, s.outlineColor];
  });

test.describe('VideoPlayer (A-4, A-5, A-10; PRD §13)', () => {
  test('no third-party request before Play; exact privacy URLs after Play', async ({ page }) => {
    const h = await openHarness(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    expect(thirdParty(h.requests)).toEqual([]);
    await expect(page.locator('iframe')).toHaveCount(0);

    const youtube = page.getByTestId('video-youtube');
    await playButton(youtube).click();
    await expect(youtube.locator('iframe')).toHaveAttribute('src', YOUTUBE_EMBED);
    await expect(playerState(youtube)).toHaveAttribute('data-state', 'embed-ready');
    expect(thirdParty(h.requests)).toEqual([YOUTUBE_EMBED]);

    const vimeo = page.getByTestId('video-vimeo');
    await playButton(vimeo).click();
    await expect(vimeo.locator('iframe')).toHaveAttribute('src', VIMEO_EMBED);
    await expect(playerState(vimeo)).toHaveAttribute('data-state', 'embed-ready');
    expect(thirdParty(h.requests)).toEqual([YOUTUBE_EMBED, VIMEO_EMBED]);
    expectNoConsoleErrors(h.errors);
  });

  test('embeds always show the restricted-video note with Open original', async ({ page }) => {
    await openHarness(page);
    for (const [id, original] of [
      ['video-youtube', 'https://www.youtube.com/watch?v=abcdefghijk'],
      ['video-vimeo', 'https://vimeo.com/123456789'],
    ] as const) {
      const group = page.getByTestId(id);
      await expect(
        group.getByText("If the video is restricted, use 'Open original'."),
      ).toBeVisible();
      const link = group.getByRole('link', { name: 'Open original' });
      await expect(link).toHaveAttribute('href', original);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    await expect(page.getByTestId('video-local').getByText(/restricted/)).toHaveCount(0);
  });

  test('iframe load is "embed-ready", never "playing", and does not time out', async ({ page }) => {
    await page.clock.install();
    await openHarness(page);
    const youtube = page.getByTestId('video-youtube');
    await playButton(youtube).click();
    await expect(playerState(youtube)).toHaveAttribute('data-state', 'embed-ready');
    await page.clock.fastForward(VIDEO_LOAD_TIMEOUT_MS * 2);
    await expect(playerState(youtube)).toHaveAttribute('data-state', 'embed-ready');
    await expect(youtube.getByRole('alert')).toHaveCount(0);
  });

  test('an embed that fails to load times out after 14 s with Try again + Open original', async ({
    page,
  }) => {
    await page.clock.install();
    await openHarness(page);
    await page.route('https://www.youtube-nocookie.com/**', () => {}); // never answers
    const youtube = page.getByTestId('video-youtube');
    await playButton(youtube).click();
    await expect(playerState(youtube)).toHaveAttribute('data-state', 'loading');
    await expect(youtube.getByRole('status')).toHaveText('Loading…');
    await page.clock.fastForward(VIDEO_LOAD_TIMEOUT_MS - 1000);
    await expect(playerState(youtube)).toHaveAttribute('data-state', 'loading');
    await page.clock.fastForward(1000);
    const alert = youtube.getByRole('alert');
    await expect(alert).toContainText("Preview couldn't load. Open the original source to watch.");
    await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(alert.getByRole('link', { name: 'Open original' })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=abcdefghijk',
    );
  });

  test('local clip: nothing loads before Play; "playing" only on the media playing event', async ({
    page,
  }) => {
    const h = await openHarness(page);
    const local = page.getByTestId('video-local');
    await expect(local.locator('video')).toHaveCount(0);
    expect(h.requests.filter((u) => u.includes('test-clip'))).toEqual([]);

    await playButton(local).click();
    const video = local.locator('video');
    await expect(video).toHaveAttribute('preload', 'none');
    await expect(video).toHaveAttribute('playsinline', '');
    await expect(video.locator('track')).toHaveAttribute('kind', 'captions');
    await expect(video.locator('track')).toHaveAttribute('srclang', 'en');
    await expect(playerState(local)).toHaveAttribute('data-state', 'loading');

    await video.dispatchEvent('loadeddata');
    await expect(playerState(local)).toHaveAttribute('data-state', 'loading');
    await video.dispatchEvent('playing'); // mocked media event (Phase 11 verifies real playback)
    await expect(playerState(local)).toHaveAttribute('data-state', 'playing');
    await expect(local.getByRole('status')).toHaveCount(0);
    expect(thirdParty(h.requests)).toEqual([]);
    expectNoConsoleErrors(h.errors);
  });

  test('local clip: a stalled source times out after 14 s; a failed source shows the error', async ({
    page,
  }) => {
    await page.clock.install();
    const h = await openHarness(page);
    const local = page.getByTestId('video-local');
    await playButton(local).click();
    await page.clock.fastForward(VIDEO_LOAD_TIMEOUT_MS - 1000);
    await expect(playerState(local)).toHaveAttribute('data-state', 'loading');
    await page.clock.fastForward(1000);
    await expect(playerState(local)).toHaveAttribute('data-state', 'error');
    // Local clips have no external source, so only "Try again" is offered.
    await expect(local.getByRole('alert').getByRole('link')).toHaveCount(0);

    await page.route('**/__harness/test-clip.mp4', (route: Route) => route.abort());
    await local.getByRole('button', { name: 'Try again' }).click();
    await expect(playerState(local)).toHaveAttribute('data-state', 'error');
    expect(h.requests.filter((u) => u.endsWith('test-clip.mp4')).length).toBeGreaterThanOrEqual(2);
  });
});

test.describe('ComparisonSlider (M-08; MO-5; ARCHITECTURE §10)', () => {
  const range = (page: Page, group: string) => page.getByTestId(group).getByRole('slider');
  const valueOf = (l: Locator) => l.evaluate((el) => Number((el as HTMLInputElement).value));

  test('static mode rests at 50 % and is keyboard operable with a spoken percentage', async ({
    page,
    browserName,
  }) => {
    await openHarness(page);
    const slider = range(page, 'comparison-static');
    await expect(slider).toHaveValue('50');
    await tabTo(page, slider, browserName);
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue('51');
    await expect(slider).toHaveAttribute('aria-valuetext', '51%');
    await page.keyboard.press('Home');
    await expect(slider).toHaveAttribute('aria-valuetext', '0%');
    // The focus ring surrounds the whole stage.
    const stage = slider.locator('..');
    expect(await outline(stage)).toEqual(['solid', '2px', '5px', ACCENT]);
  });

  test('scroll mode follows scroll 90 % → 10 % (motion on) or rests at 50 % (motion off)', async ({
    page,
  }, testInfo) => {
    await openHarness(page);
    const slider = range(page, 'comparison-scroll');
    const stage = page.getByTestId('comparison-scroll');
    const top = await stage.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const vh = page.viewportSize()?.height ?? 900;
    const at = async (y: number) => {
      await page.evaluate((t) => window.scrollTo(0, t), y);
      await page.waitForTimeout(150);
      return valueOf(slider);
    };
    const early = await at(top - vh + 50);
    const late = await at(top + 300);
    if (isReduced(testInfo.project.name)) {
      expect([early, late]).toEqual([50, 50]);
      return;
    }
    expect(early).toBeLessThanOrEqual(90);
    expect(early).toBeGreaterThan(late);
    expect(late).toBeGreaterThanOrEqual(10);

    // Turning motion off returns it to rest at 50 %.
    await page.getByTestId('motion-toggle').click();
    await expect(page.getByTestId('motion-state')).toHaveText('off');
    expect(await at(top - vh + 50)).toBe(50);
    expect(await at(top + 300)).toBe(50);
  });

  test('dragging takes control from scroll; still draggable with motion off', async ({
    page,
  }, testInfo) => {
    await openHarness(page);
    if (!isReduced(testInfo.project.name)) {
      await page.getByTestId('motion-toggle').click();
      await expect(page.getByTestId('motion-state')).toHaveText('off');
    }
    const slider = range(page, 'comparison-scroll');
    await slider.scrollIntoViewIfNeeded();
    await expect(slider).toHaveValue('50');
    const box = await slider.boundingBox();
    if (!box) throw new Error('slider not visible');
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.25, y, { steps: 8 });
    await page.mouse.up();
    const dragged = await valueOf(slider);
    expect(Math.abs(dragged - 25)).toBeLessThanOrEqual(5);
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(150);
    expect(await valueOf(slider)).toBe(dragged);
  });

  test('a visitor drag sticks while scrolling (motion on)', async ({ page }, testInfo) => {
    test.skip(isReduced(testInfo.project.name), 'scroll-following is off under reduced motion');
    await openHarness(page);
    const slider = range(page, 'comparison-scroll');
    await slider.scrollIntoViewIfNeeded();
    const box = await slider.boundingBox();
    if (!box) throw new Error('slider not visible');
    await page.mouse.click(box.x + box.width * 0.7, box.y + box.height / 2);
    const chosen = await valueOf(slider);
    expect(Math.abs(chosen - 70)).toBeLessThanOrEqual(5);
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(150);
    expect(await valueOf(slider)).toBe(chosen);
  });
});

test.describe('actions, focus and hover (DESIGN §7.2, §12)', () => {
  test('every action shows the 2 px accent focus ring at 5 px offset', async ({
    page,
    browserName,
  }) => {
    const h = await openHarness(page);
    const actions = page.getByTestId('actions');
    const targets = [
      actions.getByRole('link', { name: 'See my work' }),
      actions.getByRole('button', { name: 'TEST SOLID' }),
      actions.getByRole('link', { name: 'Download CV' }),
      actions.getByRole('link', { name: 'TEST TEXT LINK' }),
      actions.getByRole('button', { name: 'Test previous' }),
      actions.getByRole('button', { name: 'Test play' }),
      actions.getByRole('link', { name: 'TEST CTA' }),
      page.getByTestId('milestones').getByRole('button', { name: /Test item one/ }),
    ];
    for (const target of targets) {
      await tabTo(page, target, browserName);
      expect(await outline(target)).toEqual(['solid', '2px', '5px', ACCENT]);
    }
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('activated')).toHaveText('item-1');
    expectNoConsoleErrors(h.errors);
  });

  test('external links open safely in a new tab', async ({ page }) => {
    await openHarness(page);
    for (const link of [
      page.getByTestId('external'),
      page.getByRole('link', { name: 'Test social link' }),
    ]) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  test('hover states change the primary and icon buttons (mouse pointer)', async ({ page }) => {
    await openHarness(page);
    const bg = (l: Locator) => l.evaluate((el) => getComputedStyle(el).backgroundColor);
    for (const target of [
      page.getByTestId('primary'),
      page.getByRole('button', { name: 'Test previous' }),
    ]) {
      const before = await bg(target);
      await target.hover();
      await expect.poll(() => bg(target), { timeout: 3000 }).not.toBe(before);
    }
  });

  test('round CTA magnetic pull (M-14) follows the mouse; none when motion is off', async ({
    page,
  }, testInfo) => {
    await openHarness(page);
    const cta = page.getByTestId('magnetic-cta');
    const magnet = cta.locator('xpath=..');
    await cta.scrollIntoViewIfNeeded(); // mouse.move does not scroll
    const box = await cta.boundingBox();
    if (!box) throw new Error('CTA not visible');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2, { steps: 5 });
    const readX = () =>
      magnet.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
    if (isReduced(testInfo.project.name)) {
      await page.waitForTimeout(500);
      expect(await readX()).toBe(0);
    } else {
      await expect.poll(readX, { timeout: 3000 }).toBeGreaterThan(1);
    }
  });
});

test.describe('media states (PRD §13; M-19)', () => {
  test('images fade in when loaded; a failed image shows the fallback panel', async ({ page }) => {
    const h = await openHarness(page);
    const broken = page.getByTestId('broken-image');
    await broken.scrollIntoViewIfNeeded(); // images are lazy: they load near the viewport
    await expect(broken.getByRole('img', { name: 'Preview unavailable' })).toBeVisible();
    await expect(broken.getByText('D.')).toBeVisible();
    const natural = page.getByRole('img', { name: 'Test image, natural' });
    await natural.scrollIntoViewIfNeeded();
    await expect(natural.locator('xpath=ancestor::*[@data-state][1]')).toHaveAttribute(
      'data-state',
      'loaded',
    );
    await expect.poll(() => natural.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    expectNoConsoleErrors(h.errors);
  });

  test('the loading ring spins with motion on and stops with motion off', async ({
    page,
  }, testInfo) => {
    await openHarness(page);
    const status = page.getByTestId('media').getByRole('status');
    await expect(status).toHaveText('Loading…');
    const spinning = () =>
      status.evaluate((el) =>
        [el, ...el.querySelectorAll('*')].some((n) => getComputedStyle(n).animationName !== 'none'),
      );
    if (isReduced(testInfo.project.name)) {
      expect(await spinning()).toBe(false);
      return;
    }
    expect(await spinning()).toBe(true);
    await page.getByTestId('motion-toggle').click();
    await expect(page.getByTestId('motion-state')).toHaveText('off');
    expect(await spinning()).toBe(false);
  });
});

test('no horizontal scroll and the hero name fits on one line at all 11 widths', async ({
  page,
}) => {
  const h = await openHarness(page);
  const name = page.getByRole('heading', { level: 1 });
  for (const width of VERIFICATION_WIDTHS) {
    await page.setViewportSize(viewportForWidth(width));
    await expectNoHorizontalScroll(page);
    const fit = await name.evaluate((el) => {
      // Text-node line boxes only (the block line <span> has its own, taller rect).
      const tops = new Set<number>();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) tops.add(Math.round(r.top));
      }
      return {
        lines: tops.size,
        right: el.getBoundingClientRect().right,
        overflow: el.scrollWidth - el.clientWidth,
      };
    });
    expect(fit.lines, `hero name lines at ${width}px`).toBe(1);
    expect(fit.overflow, `hero name clipped at ${width}px`).toBeLessThanOrEqual(0);
    expect(fit.right, `hero name past the viewport at ${width}px`).toBeLessThanOrEqual(width);
  }
  expectNoConsoleErrors(h.errors);
});
