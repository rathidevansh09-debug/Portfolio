import { expect, test } from '@playwright/test';

// Phase 4 foundations: self-hosted fonts, text sizing, motion-off hook, grain, focus ring
// (DESIGN §4.6, §5.1–§5.3, §6.5; ARCHITECTURE A-3; PRD MO-5, NFR-A6).

const FONTS = [
  '400 1em Anton',
  '400 1em Manrope',
  '500 1em Manrope',
  '600 1em Manrope',
  '700 1em Manrope',
  '800 1em Manrope',
  '400 1em Caveat',
  '500 1em Caveat',
];

test('fonts load only from our own host, in every approved weight', async ({ page, baseURL }) => {
  const requests: string[] = [];
  page.on('request', (req) => requests.push(req.url()));
  await page.goto('/');
  const loaded = await page.evaluate(async (fonts) => {
    await Promise.all(fonts.map((f) => document.fonts.load(f, 'Aa')));
    return fonts.map((f) => document.fonts.check(f, 'Aa'));
  }, FONTS);
  expect(loaded, FONTS.join(', ')).toEqual(FONTS.map(() => true));

  const foreign = requests.filter((url) => !url.startsWith(baseURL ?? ''));
  expect(foreign, 'requests to other hosts').toEqual([]);
  const fontFiles = requests.filter((url) => url.endsWith('.woff2'));
  expect(fontFiles.length).toBeGreaterThan(0);
  for (const url of fontFiles) expect(new URL(url).pathname).toMatch(/^\/fonts\/[\w-]+\.woff2$/);

  // Variable fonts really provide distinct weights (not one weight reused or synthesised).
  const widths = await page.evaluate(() => {
    const measure = (family: string, weight: number) => {
      const span = document.createElement('span');
      span.textContent = 'Every screen. A clearer decision.';
      span.style.cssText = `font: ${weight} 32px ${family}; position: absolute; white-space: nowrap;`;
      document.body.append(span);
      const w = span.getBoundingClientRect().width;
      span.remove();
      return w;
    };
    return {
      manrope400: measure('Manrope', 400),
      manrope800: measure('Manrope', 800),
      caveat400: measure('Caveat', 400),
      caveat500: measure('Caveat', 500),
    };
  });
  expect(widths.manrope800).not.toBe(widths.manrope400);
  expect(widths.caveat500).not.toBe(widths.caveat400);
});

test('root font size is never set; body is 1rem, 0.875rem on phones; inputs stay 16px', async ({
  page,
}) => {
  const read = () =>
    page.evaluate(() => {
      const input = document.createElement('input');
      document.body.append(input);
      const sizes = {
        root: getComputedStyle(document.documentElement).fontSize,
        body: getComputedStyle(document.body).fontSize,
        input: getComputedStyle(input).fontSize,
      };
      input.remove();
      return sizes;
    });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  expect(await read()).toEqual({ root: '16px', body: '16px', input: '16px' });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await read()).toEqual({ root: '16px', body: '14px', input: '16px' });
});

test('text follows the browser text-size setting (no fixed root size)', async ({
  page,
  browserName,
  context,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Browser text-size emulation is only available via Chromium CDP.',
  );
  const cdp = await context.newCDPSession(page);
  await cdp.send('Page.setFontSizes', { fontSizes: { standard: 20 } });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.body).fontSize)).toBe('20px');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => getComputedStyle(document.body).fontSize)).toBe('17.5px');
});

test('motion-off hook makes CSS transitions instant and anchor scrolling a jump', async ({
  page,
}, testInfo) => {
  const reducedProject = testInfo.project.name.endsWith('-reduced-motion');
  await page.goto('/');
  const read = () =>
    page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.transition = 'opacity 0.3s ease 0.1s';
      document.body.append(probe);
      const style = getComputedStyle(probe);
      const result = {
        duration: style.transitionDuration,
        delay: style.transitionDelay,
        scroll: getComputedStyle(document.documentElement).scrollBehavior,
      };
      probe.remove();
      return result;
    });

  expect(await read()).toEqual(
    reducedProject
      ? { duration: '0s', delay: '0s', scroll: 'auto' }
      : { duration: '0.3s', delay: '0.1s', scroll: 'smooth' },
  );
  await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'off'));
  expect(await read()).toEqual({ duration: '0s', delay: '0s', scroll: 'auto' });
});

test('film grain is a fixed, non-interactive 3.5% layer from our own texture', async ({ page }) => {
  await page.goto('/');
  const grain = await page.evaluate(() => {
    const s = getComputedStyle(document.body, '::after');
    return {
      position: s.position,
      pointerEvents: s.pointerEvents,
      opacity: s.opacity,
      zIndex: s.zIndex,
      image: s.backgroundImage,
    };
  });
  expect(grain.position).toBe('fixed');
  expect(grain.pointerEvents).toBe('none');
  expect(grain.opacity).toBe('0.035');
  expect(grain.zIndex).toBe('120');
  expect(grain.image).toContain('data:image/svg+xml');
  expect(grain.image).toContain('feTurbulence');
});

test('keyboard focus shows a 2px accent ring offset 5px', async ({ page, browserName }) => {
  // Safari/WebKit on macOS moves Tab between form fields only; Option+Tab reaches buttons and links.
  const tabKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await page.goto('/');
  // Phase 8: the real skip link is the probe. It must be the first focusable element (FR-G2).
  await page.keyboard.press(tabKey);
  const skip = page.getByRole('link', { name: 'Skip to work' });
  await expect(skip).toBeFocused();
  const ring = await skip.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      width: s.outlineWidth,
      style: s.outlineStyle,
      color: s.outlineColor,
      offset: s.outlineOffset,
    };
  });
  expect(ring).toEqual({ width: '2px', style: 'solid', color: 'rgb(0, 213, 232)', offset: '5px' });
});
