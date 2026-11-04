// Logo strip maths (M-12; ARCHITECTURE R-2). Framework-free.
// The strip holds two identical logo sets; scrolling one set width further looks identical, so the
// position wraps by one set width for a seamless endless loop. The position is kept fractional
// internally because browsers round scroll positions, which would stall a slow strip (R-2).

import { logoStrip } from '../motion/tokens.ts';

/**
 * Longest frame gap the strip will catch up on. After a background tab or a long frame, the strip
 * resumes smoothly instead of jumping (implementation guard, not a design value).
 */
export const MAX_FRAME_MS = 64;

/** Wraps a position into [0, setWidth). */
export function wrapStrip(position: number, setWidth: number): number {
  if (setWidth <= 0) return position;
  return ((position % setWidth) + setWidth) % setWidth;
}

/** Advances the fractional position by speed × elapsed time, then wraps it. */
export function advanceStrip(
  position: number,
  elapsedMs: number,
  setWidth: number,
  speed: number = logoStrip.speed,
): number {
  const ms = Math.min(Math.max(elapsedMs, 0), MAX_FRAME_MS);
  return wrapStrip(position + (speed * ms) / 1000, setWidth);
}

/** Arrow-key step when the strip has keyboard focus (owner decision, Checkpoint 10). */
export const KEY_STEP = 40;

/** Distance the previous/next arrows scroll: 70 % of the visible width (M-12). */
export function arrowStep(visibleWidth: number): number {
  return visibleWidth * logoStrip.arrowScroll;
}
