import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isScrollLocked, lockScroll, unlockScroll } from '../../src/lib/scrollLock.ts';

describe('page scroll lock (FR-M7; ARCHITECTURE R-7)', () => {
  const scrollTo = vi.fn();
  beforeEach(() => {
    scrollTo.mockClear();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 640 });
    document.body.setAttribute('style', 'color: red;');
  });
  afterEach(() => {
    unlockScroll();
    document.body.removeAttribute('style');
  });

  it('fixes the body at the current offset (works on iOS Safari) and restores it', () => {
    lockScroll();
    expect(isScrollLocked()).toBe(true);
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-640px');
    unlockScroll();
    expect(isScrollLocked()).toBe(false);
    expect(document.body.getAttribute('style')).toBe('color: red;');
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith(0, 640);
  });

  it('is idempotent: a second lock keeps the first offset; a second unlock does nothing', () => {
    lockScroll();
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    lockScroll();
    expect(document.body.style.top).toBe('-640px');
    unlockScroll();
    unlockScroll();
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(0, 640);
  });
});
