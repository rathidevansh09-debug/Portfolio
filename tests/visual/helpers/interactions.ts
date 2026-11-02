// Scripted interactions for motion recordings. Reference selectors were read from the live
// reference DOM on 2 Nov 2026; if the reference changes, the recording is marked "failed".

import type { Page } from '@playwright/test';
import { scrollToSection } from './capture.ts';
import type { Viewport } from '../../e2e/helpers/viewports.ts';
import type { Interaction } from './capture.ts';

export interface InteractionDef {
  readonly name: string;
  /** Animation IDs this recording helps verify (PRD §7.3). */
  readonly covers: string;
  readonly waitForLoad: boolean;
  /** Mouse-only interactions are skipped at phone width (PRD MO-6). */
  readonly desktopOnly?: boolean;
  readonly phoneOnly?: boolean;
  readonly run: Interaction;
}

const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

async function wheelThroughPage(page: Page): Promise<void> {
  const total = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  for (let y = 0; y < total; y += 100) {
    await page.mouse.wheel(0, 100);
    await wait(page, 60);
  }
  await wait(page, 1000);
  // Scroll back up part of the page to show page reveals replaying (PRD MO-2).
  for (let i = 0; i < 15; i += 1) {
    await page.mouse.wheel(0, -100);
    await wait(page, 60);
  }
  await wait(page, 1500);
}

export const REFERENCE_INTERACTIONS: readonly InteractionDef[] = [
  {
    name: 'hero-load',
    covers: 'M-01, M-02a, M-02b, M-02c, hero start gate',
    waitForLoad: false,
    run: async (page) => wait(page, 4000),
  },
  {
    name: 'scroll-through',
    covers: 'M-03, M-04, M-06, M-08, M-09, M-15, M-16 (replay on scroll-up)',
    waitForLoad: true,
    run: async (page) => wheelThroughPage(page),
  },
  {
    name: 'filter-change',
    covers: 'M-05, M-10',
    waitForLoad: true,
    run: async (page, vp: Viewport) => {
      await scrollToSection(page, '#portfolio', vp.width);
      const filters = page.locator('#portfolio button[aria-pressed]');
      await filters.nth(1).click();
      await wait(page, 1500);
      await filters.nth(0).click();
      await wait(page, 1500);
    },
  },
  {
    name: 'card-hover',
    covers: 'M-07a',
    waitForLoad: true,
    desktopOnly: true,
    run: async (page, vp) => {
      await scrollToSection(page, '#portfolio', vp.width);
      await page.locator('#portfolio article.project-card').first().hover();
      await wait(page, 1500);
      await page.mouse.move(5, 5);
      await wait(page, 1200);
    },
  },
  {
    name: 'popup-open-close',
    covers: 'M-13, M-19, M-03b',
    waitForLoad: true,
    run: async (page, vp) => {
      await scrollToSection(page, '#portfolio', vp.width);
      await page.locator('#portfolio article.project-card button').first().click();
      await page
        .locator('dialog[open], [role="dialog"]')
        .first()
        .waitFor({ state: 'visible', timeout: 5000 });
      await wait(page, 2500);
      await page.keyboard.press('Escape');
      await wait(page, 1500);
    },
  },
  {
    name: 'logo-strip',
    covers: 'M-12, M-07b (logo hover)',
    waitForLoad: true,
    run: async (page, vp) => {
      await scrollToSection(page, '#brand-collection', vp.width);
      await wait(page, 6000);
      if (vp.width > 600) {
        // The strip never stops moving, so Playwright's hover() (which waits for a stable element)
        // times out. Move the mouse onto a logo's current position instead, as a visitor would.
        const box = await page.locator('#brand-collection .brand-logo').nth(2).boundingBox();
        if (!box) throw new Error('brand logo not visible');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
        await wait(page, 2500);
        await page.mouse.move(5, 5);
        await wait(page, 1500);
      }
    },
  },
  {
    name: 'comparison-keyboard',
    covers: 'M-08 (visitor takeover)',
    waitForLoad: true,
    run: async (page, vp) => {
      await scrollToSection(page, 'section.breakdown', vp.width);
      const slider = page.locator('section.breakdown input[type="range"]').first();
      await slider.focus();
      for (let i = 0; i < 10; i += 1) {
        await page.keyboard.press('ArrowLeft');
        await wait(page, 120);
      }
      await wait(page, 1000);
    },
  },
  {
    name: 'accordion',
    covers: 'M-11',
    waitForLoad: true,
    run: async (page, vp) => {
      await scrollToSection(page, '#experience', vp.width);
      const rows = page.locator('#experience button[aria-expanded]');
      await rows.nth(1).click();
      await wait(page, 1200);
      await rows.nth(0).click();
      await wait(page, 1200);
    },
  },
  {
    name: 'magnetic-cta',
    covers: 'M-14',
    waitForLoad: true,
    desktopOnly: true,
    run: async (page, vp) => {
      await scrollToSection(page, '#contact', vp.width);
      const box = await page.locator('#contact a.contact-cta').first().boundingBox();
      if (!box) throw new Error('contact CTA not visible');
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.mouse.move(cx - 150, cy - 60);
      await page.mouse.move(cx, cy, { steps: 20 });
      await wait(page, 600);
      await page.mouse.move(cx + box.width / 2 - 4, cy + box.height / 2 - 4, { steps: 15 });
      await wait(page, 600);
      await page.mouse.move(cx + 200, cy + 120, { steps: 10 });
      await wait(page, 1200);
    },
  },
  {
    name: 'showreel-hover',
    covers: 'M-07c',
    waitForLoad: true,
    desktopOnly: true,
    run: async (page, vp) => {
      await scrollToSection(page, '#contact', vp.width);
      await page.locator('#contact .contact-reel').first().hover();
      await wait(page, 1500);
      await page.mouse.move(5, 5);
      await wait(page, 1200);
    },
  },
  {
    name: 'mobile-menu',
    covers: 'M-17',
    waitForLoad: true,
    phoneOnly: true,
    run: async (page) => {
      await page.locator('button.menu-toggle').first().click();
      await wait(page, 1200);
      await page.keyboard.press('Escape');
      await wait(page, 1200);
    },
  },
];

/** Our build has no sections yet; only the load recording applies until sections exist. */
export const LOCAL_INTERACTIONS: readonly InteractionDef[] = [REFERENCE_INTERACTIONS[0]];
