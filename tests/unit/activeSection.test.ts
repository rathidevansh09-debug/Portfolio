import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BAND_ROOT_MARGIN,
  pickActiveSection,
  watchActiveSection,
} from '../../src/lib/activeSection.ts';

const ORDER = ['home', 'portfolio', 'impact', 'about', 'experience', 'contact'];
const CLEARS = new Set(['home']);
const pick = (inBand: string[], previous: string | null) =>
  pickActiveSection(new Set(inBand), ORDER, previous, CLEARS);

describe('active section (M-16)', () => {
  it('uses the 15 %–35 % band from the top of the screen', () => {
    expect(BAND_ROOT_MARGIN).toBe('-15% 0px -65% 0px');
  });

  it('activates the section crossing the band', () => {
    expect(pick(['about'], null)).toBe('about');
    expect(pick(['portfolio'], 'about')).toBe('portfolio');
  });

  it('the Hero clears the active link [OBSERVED reference]', () => {
    expect(pick(['home'], 'portfolio')).toBeNull();
  });

  it('an unwatched section (Breakdown, footer) keeps the previous link [OBSERVED reference]', () => {
    expect(pick([], 'impact')).toBe('impact');
    expect(pick([], null)).toBeNull();
  });

  it('when two sections share the band, the lower one wins', () => {
    expect(pick(['impact', 'about'], 'impact')).toBe('about');
    expect(pick(['home', 'portfolio'], null)).toBe('portfolio');
  });
});

describe('watchActiveSection (IntersectionObserver)', () => {
  type Callback = (entries: { target: Element; isIntersecting: boolean }[]) => void;
  let callback: Callback = () => {};
  const observed: Element[] = [];
  let options: IntersectionObserverInit | undefined;
  const disconnect = vi.fn();

  beforeEach(() => {
    observed.length = 0;
    document.body.innerHTML = ORDER.map((id) => `<section id="${id}"></section>`).join('');
    window.IntersectionObserver = class {
      constructor(cb: Callback, init?: IntersectionObserverInit) {
        callback = cb;
        options = init;
      }
      observe(el: Element) {
        observed.push(el);
      }
      disconnect = disconnect;
    } as unknown as typeof IntersectionObserver;
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const entry = (id: string, isIntersecting: boolean) => ({
    target: document.getElementById(id) as Element,
    isIntersecting,
  });

  it('observes every watched section with the band margin and reports changes only', () => {
    const onChange = vi.fn();
    const stop = watchActiveSection(ORDER, CLEARS, onChange);
    expect(observed.map((el) => el.id)).toEqual(ORDER);
    expect(options).toEqual({ rootMargin: '-15% 0px -65% 0px', threshold: 0 });

    callback([entry('home', true)]);
    expect(onChange).not.toHaveBeenCalled(); // already "none"
    callback([entry('home', false), entry('portfolio', true)]);
    expect(onChange).toHaveBeenLastCalledWith('portfolio');
    callback([entry('portfolio', false)]); // Breakdown-like gap: keeps Work
    expect(onChange).toHaveBeenCalledTimes(1);
    callback([entry('home', true)]);
    expect(onChange).toHaveBeenLastCalledWith(null);

    stop();
    expect(disconnect).toHaveBeenCalled();
  });
});
