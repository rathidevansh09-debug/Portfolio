// Reference-capture helper (ARCHITECTURE §6.3; IMPLEMENTATION_PLAN Phase 3, Task 4).
// Captures the live reference site and our build at identical viewports and equivalent scroll
// positions, records short motion videos, and writes a metadata JSON beside every file.
// Output goes only to the local, git-ignored reference-captures/ folder. Nothing here compares
// or scores captures: comparison is done side by side by a person (PRD §7.4).

import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { anchorOffset, type Viewport } from '../../e2e/helpers/viewports.ts';

export type CaptureTarget = 'reference' | 'local';

/** One page section, with its selector on each site. `local: null` = not built yet. */
export interface SectionDef {
  readonly key: string;
  readonly reference: string;
  readonly local: string | null;
}

/**
 * Section map. Reference selectors were read from the live reference DOM on 2 Nov 2026.
 * Local selectors follow ARCHITECTURE §3.1 anchors; unanchored sections use a
 * data-capture attribute that must be added when the section is built (Phases 10–14).
 */
export const SECTIONS: readonly SectionDef[] = [
  { key: '01-hero', reference: '#home', local: '#home' },
  { key: '02-selected-work', reference: '#portfolio', local: '#portfolio' },
  { key: '03-brands', reference: '#brand-collection', local: '[data-capture="brands"]' },
  { key: '04-impact', reference: '#awards', local: '#impact' },
  { key: '05-breakdown', reference: 'section.breakdown', local: '[data-capture="breakdown"]' },
  { key: '06-about', reference: '#about', local: '#about' },
  { key: '07-journey', reference: '#experience', local: '#experience' },
  { key: '08-contact', reference: '#contact', local: '#contact' },
  { key: '09-footer', reference: 'footer', local: 'footer' },
];

export interface CaptureMeta {
  readonly target: CaptureTarget;
  readonly kind: 'screenshot' | 'video';
  readonly name: string;
  readonly url: string;
  readonly viewport: Viewport;
  readonly scrollY: number | null;
  readonly selector: string | null;
  readonly status: 'ok' | 'missing' | 'failed';
  readonly note: string | null;
  readonly capturedAt: string;
  readonly browser: string;
  readonly reducedMotion: false;
  readonly file: string | null;
}

/** Settle time after scrolling, so scroll-reveal animations (≤ ~1.2 s incl. stagger) finish. */
const SETTLE_MS = 2000;
/** Hero entrance timeline ends at ~1.55 s (DESIGN §9.2); wait a margin beyond it. */
const HERO_SETTLE_MS = 3000;

function writeMeta(file: string, meta: CaptureMeta): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(meta, null, 2)}\n`);
}

/** Scrolls so the section's top sits just below the sticky header (IMPLEMENTATION_PLAN PA-2). */
export async function scrollToSection(
  page: Page,
  selector: string,
  width: number,
): Promise<number> {
  const offset = anchorOffset(width);
  await page.evaluate(
    ({ sel, off }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`selector not found: ${sel}`);
      const top = el.getBoundingClientRect().top + window.scrollY - off;
      window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
    },
    { sel: selector, off: offset },
  );
  await page.waitForTimeout(SETTLE_MS);
  return page.evaluate(() => Math.round(window.scrollY));
}

export interface ScreenshotRunOptions {
  readonly browser: Browser;
  readonly target: CaptureTarget;
  readonly url: string;
  readonly viewport: Viewport;
  readonly outDir: string;
  readonly capturedAt: string;
}

/** First screen + every section at one viewport. Missing sections are recorded, never faked. */
export async function captureScreens(opts: ScreenshotRunOptions): Promise<CaptureMeta[]> {
  const { browser, target, url, viewport, outDir, capturedAt } = opts;
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });
  const page = await context.newPage();
  const results: CaptureMeta[] = [];
  const dir = join(outDir, target, 'screenshots', viewport.name);
  const base = {
    target,
    kind: 'screenshot' as const,
    url,
    viewport,
    capturedAt,
    browser: `chromium ${browser.version()}`,
    reducedMotion: false as const,
  };

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(HERO_SETTLE_MS);
    const first = join(dir, '00-first-screen.png');
    mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: first });
    const meta: CaptureMeta = {
      ...base,
      name: '00-first-screen',
      scrollY: 0,
      selector: null,
      status: 'ok',
      note: null,
      file: first,
    };
    writeMeta(first.replace(/\.png$/, '.json'), meta);
    results.push(meta);

    for (const section of SECTIONS) {
      const selector = target === 'reference' ? section.reference : section.local;
      const png = join(dir, `${section.key}.png`);
      const exists = selector ? (await page.locator(selector).count()) > 0 : false;
      if (!selector || !exists) {
        const missing: CaptureMeta = {
          ...base,
          name: section.key,
          scrollY: null,
          selector,
          status: 'missing',
          note: 'Section not present on this site yet; no screenshot taken.',
          file: null,
        };
        writeMeta(png.replace(/\.png$/, '.json'), missing);
        results.push(missing);
        continue;
      }
      try {
        const scrollY = await scrollToSection(page, selector, viewport.width);
        await page.screenshot({ path: png });
        const ok: CaptureMeta = {
          ...base,
          name: section.key,
          scrollY,
          selector,
          status: 'ok',
          note: null,
          file: png,
        };
        writeMeta(png.replace(/\.png$/, '.json'), ok);
        results.push(ok);
      } catch (err) {
        const failed: CaptureMeta = {
          ...base,
          name: section.key,
          scrollY: null,
          selector,
          status: 'failed',
          note: err instanceof Error ? err.message : String(err),
          file: null,
        };
        writeMeta(png.replace(/\.png$/, '.json'), failed);
        results.push(failed);
      }
    }
  } finally {
    await context.close();
  }
  return results;
}

/** A scripted interaction recorded to video. Throws if the interaction cannot be performed. */
export type Interaction = (page: Page, viewport: Viewport) => Promise<void>;

export interface VideoRunOptions {
  readonly browser: Browser;
  readonly target: CaptureTarget;
  readonly url: string;
  readonly viewport: Viewport;
  readonly outDir: string;
  readonly capturedAt: string;
  readonly name: string;
  readonly description: string;
  /** Wait for load before the interaction starts. Hero-load recordings start immediately. */
  readonly waitForLoad: boolean;
  readonly interaction: Interaction;
}

/** Records one interaction to WebM at the exact viewport size, with metadata. */
export async function recordInteraction(opts: VideoRunOptions): Promise<CaptureMeta> {
  const { browser, target, url, viewport, outDir, capturedAt, name, description } = opts;
  const dir = join(outDir, target, 'videos', viewport.name);
  mkdirSync(dir, { recursive: true });
  const size = { width: viewport.width, height: viewport.height };
  const context: BrowserContext = await browser.newContext({
    viewport: size,
    recordVideo: { dir, size },
  });
  const page = await context.newPage();
  const file = join(dir, `${name}.webm`);
  let status: CaptureMeta['status'] = 'ok';
  let note: string | null = description;
  let scrollY: number | null = null;

  try {
    await page.goto(url, {
      waitUntil: opts.waitForLoad ? 'networkidle' : 'commit',
      timeout: 60_000,
    });
    if (opts.waitForLoad) await page.waitForTimeout(HERO_SETTLE_MS);
    await opts.interaction(page, viewport);
    scrollY = await page.evaluate(() => Math.round(window.scrollY));
  } catch (err) {
    status = 'failed';
    note = `${description} — FAILED: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`;
  }

  const video = page.video();
  await context.close();
  if (video) renameSync(await video.path(), file);

  const meta: CaptureMeta = {
    target,
    kind: 'video',
    name,
    url,
    viewport,
    scrollY,
    selector: null,
    status,
    note,
    capturedAt,
    browser: `chromium ${browser.version()}`,
    reducedMotion: false,
    file: video ? file : null,
  };
  writeMeta(file.replace(/\.webm$/, '.json'), meta);
  return meta;
}

export async function launchCaptureBrowser(): Promise<Browser> {
  // Chromium matches the device-emulation method used for DESIGN.md captures (DESIGN, "How the
  // reference was examined").
  return chromium.launch();
}
