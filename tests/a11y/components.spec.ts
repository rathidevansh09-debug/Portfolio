import { expect, test, type Page } from '@playwright/test';
import { expectNoA11yViolations } from './helpers/axe.ts';

// Phase 7: axe (WCAG 2.2 A/AA) on every shared component, in its interactive states, on the
// component harness. Third-party hosts are stubbed locally; nothing leaves the machine.

const HARNESS = 'http://localhost:5180/tests/e2e/harness/components.html';
const STUB_EMBED =
  '<!doctype html><html lang="en"><head><title>Test embed stub</title></head><body></body></html>';

async function openHarness(page: Page): Promise<void> {
  await page.route(
    (url) => !/^(data:|blob:|http:\/\/localhost:5180\/)/.test(url.href),
    (route) => route.abort(),
  );
  for (const host of ['https://www.youtube-nocookie.com/**', 'https://player.vimeo.com/**']) {
    await page.route(host, (route) =>
      route.fulfill({ contentType: 'text/html', body: STUB_EMBED }),
    );
  }
  await page.route('**/__harness/test-clip.en.vtt', (route) =>
    route.fulfill({ contentType: 'text/vtt', body: 'WEBVTT\n' }),
  );
  await page.route('**/__harness/test-clip.mp4', (route) => route.abort());
  await page.goto(HARNESS);
  await expect(page.getByTestId('motion-state')).toHaveText(/on|off/);
}

test('all components at rest (poster, loaded, failed-image and loading states)', async ({
  page,
}) => {
  await openHarness(page);
  await expect(page.getByTestId('broken-image').getByRole('img')).toBeVisible();
  await expectNoA11yViolations(page);
});

test('video players after Play: embed-ready and error states', async ({ page }) => {
  await openHarness(page);
  for (const id of ['video-local', 'video-youtube', 'video-vimeo']) {
    await page.getByTestId(id).getByRole('button', { name: 'PENDING' }).click();
  }
  await expect(page.getByTestId('video-local').getByRole('alert')).toBeVisible();
  await expect(
    page.getByTestId('video-youtube').locator('[data-state="embed-ready"]'),
  ).toBeVisible();
  await expect(page.getByTestId('video-vimeo').locator('[data-state="embed-ready"]')).toBeVisible();
  await expectNoA11yViolations(page, { include: ['[data-testid="video"]'] });
});

test('comparison sliders after interaction and with motion off', async ({ page }) => {
  await openHarness(page);
  const slider = page.getByTestId('comparison-static').getByRole('slider');
  await slider.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(slider).toHaveAttribute('aria-valuetext', '49%');
  await page.getByTestId('motion-toggle').click();
  await expectNoA11yViolations(page, {
    include: ['[data-testid="comparison-static"]', '[data-testid="comparison-scroll"]'],
  });
});

test('phone width (390 px)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHarness(page);
  await expectNoA11yViolations(page);
});
