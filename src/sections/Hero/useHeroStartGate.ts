// Hero start gate (PRD §13 "Page first loading"; ARCHITECTURE §6.2, §9.3): the entrance
// animations (M-01, M-02a–c) start when the hero fonts AND the portrait are ready, but never wait
// longer than the safety cap (tokens: hero.startGateCap ≈ 1.5 s [TO VERIFY]). The layout is
// reserved from the first paint, so nothing shifts while waiting. With no portrait supplied yet
// (PENDING), only the fonts are awaited. Motion off (MO-5): no gate, everything is shown at once.

import { useEffect, useState, type RefObject } from 'react';
import { hero } from '../../motion/tokens.ts';

/** The three font families the hero uses, read from the design tokens (no names hard-coded). */
const FONT_TOKENS = ['--font-display', '--font-body', '--font-hand'] as const;

function fontsReady(): Promise<unknown> {
  if (typeof document === 'undefined' || !('fonts' in document)) return Promise.resolve();
  const root = getComputedStyle(document.documentElement);
  return Promise.all(
    FONT_TOKENS.map((token) => {
      const family = root.getPropertyValue(token).trim();
      return family ? document.fonts.load(`1em ${family}`) : Promise.resolve();
    }),
  );
}

function imageReady(img: HTMLImageElement | null | undefined): Promise<void> {
  if (!img || img.complete) return Promise.resolve();
  return new Promise((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true }); // fallback panel shows instead
  });
}

/**
 * @param container   the hero section (the portrait image is looked up inside it)
 * @param hasPortrait whether a portrait is supplied and must be awaited
 * @param motionOn    when false the gate is open immediately
 */
export function useHeroStartGate(
  container: RefObject<HTMLElement | null>,
  hasPortrait: boolean,
  motionOn: boolean,
): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!motionOn) return;
    let done = false;
    const open = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const cap = window.setTimeout(open, hero.startGateCap * 1000);
    const portrait = hasPortrait
      ? imageReady(container.current?.querySelector<HTMLImageElement>('[data-hero-portrait] img'))
      : Promise.resolve();
    // A font that fails to load must not hold the hero back: the cap or the settled promise opens.
    void Promise.allSettled([fontsReady(), portrait]).then(open);
    return () => {
      done = true;
      window.clearTimeout(cap);
    };
  }, [container, hasPortrait, motionOn]);

  return ready || !motionOn;
}
