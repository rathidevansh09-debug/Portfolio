import { describe, expect, it } from 'vitest';
import {
  advanceStrip,
  arrowStep,
  KEY_STEP,
  MAX_FRAME_MS,
  wrapStrip,
} from '../../src/lib/logoStrip.ts';
import { logoStrip } from '../../src/motion/tokens.ts';

describe('logo strip maths (M-12; ARCHITECTURE R-2)', () => {
  it('advances by the token speed, keeping fractions (no rounding stall)', () => {
    expect(advanceStrip(0, 16, 1000)).toBeCloseTo((logoStrip.speed * 16) / 1000, 6);
    expect(advanceStrip(10.25, 10, 1000, 38)).toBeCloseTo(10.63, 6);
  });

  it('wraps by one set width for a seamless loop', () => {
    expect(wrapStrip(1005, 1000)).toBeCloseTo(5);
    expect(wrapStrip(-5, 1000)).toBeCloseTo(995);
    expect(advanceStrip(999.9, 16, 1000, 38)).toBeCloseTo(0.508, 3);
  });

  it('catches up at most one long frame (no jump after a background tab)', () => {
    expect(advanceStrip(0, 5000, 10_000, 38)).toBeCloseTo((38 * MAX_FRAME_MS) / 1000, 6);
    expect(advanceStrip(7, -20, 10_000, 38)).toBe(7);
  });

  it('arrow buttons step 70 % of the visible width; arrow keys step 40 px', () => {
    expect(logoStrip.arrowScroll).toBe(0.7);
    expect(arrowStep(1000)).toBeCloseTo(700);
    expect(KEY_STEP).toBe(40);
  });

  it('a zero-width set leaves the position unchanged', () => {
    expect(wrapStrip(42, 0)).toBe(42);
  });
});
