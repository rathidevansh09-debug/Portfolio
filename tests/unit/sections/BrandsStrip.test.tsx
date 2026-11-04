import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Brand } from '../../../src/content/schema.ts';
import { MotionPreferenceProvider } from '../../../src/motion/MotionPreference.tsx';
import {
  BrandsStrip,
  type BrandsStripLabels,
} from '../../../src/sections/SelectedWork/BrandsStrip.tsx';
import { image } from '../fixtures.ts';

// Fictional logos only.
const scrollTo = vi.fn();
beforeEach(() => {
  scrollTo.mockClear();
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
  window.ResizeObserver = class {
    observe() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollTo = scrollTo as unknown as Element['scrollTo'];
});

const labels: BrandsStripLabels = {
  headingLine1: 'BEEN PART OF',
  headingLine2: 'THE BIGGER PICTURE.',
  seeAll: 'SEE ALL ({count})',
  showStrip: 'Test show strip',
  autoScroll: 'Logo auto-scroll',
  previous: 'Test previous',
  next: 'Test next',
  region: 'Test strip',
  imageFallback: { mark: 'D.', label: 'Preview unavailable' },
};
const brands: Brand[] = [1, 2, 3].map((n) => ({
  name: `Test logo ${n}`,
  logo: image(`Test logo ${n}`),
  permissionConfirmed: true,
}));

const renderStrip = () =>
  render(
    <MotionPreferenceProvider>
      <BrandsStrip brands={brands} labels={labels} />
    </MotionPreferenceProvider>,
  );

describe('Brands strip (FR-B1–B5; M-12, M-07b)', () => {
  it('H3 heading; a labelled, focusable strip region; copies hidden from screen readers', () => {
    const { container } = renderStrip();
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(
      'BEEN PART OFTHE BIGGER PICTURE.',
    );
    const region = screen.getByRole('region', { name: 'Test strip' });
    expect(region.getAttribute('tabindex')).toBe('0');
    const sets = region.firstElementChild?.children ?? [];
    expect(sets.length).toBeGreaterThanOrEqual(2);
    expect((sets[0] as HTMLElement).getAttribute('aria-hidden')).toBeNull();
    for (const set of [...sets].slice(1)) expect(set.getAttribute('aria-hidden')).toBe('true');
    // Only the first set is in the accessibility tree: each logo is named once.
    expect(screen.getAllByRole('img', { name: 'Test logo 1' })).toHaveLength(1);
    expect(container.querySelectorAll('img')).toHaveLength(3 * sets.length);
  });

  it('"Logo auto-scroll" keeps one name; aria-pressed is true while auto-scrolling', () => {
    renderStrip();
    const toggle = screen.getByRole('button', { name: 'Logo auto-scroll' });
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.querySelector('svg')?.getAttribute('class')).toContain('lucide-pause');
    fireEvent.click(toggle);
    const same = screen.getByRole('button', { name: 'Logo auto-scroll' });
    expect(same.getAttribute('aria-pressed')).toBe('false');
    expect(same.querySelector('svg')?.getAttribute('class')).toContain('lucide-play');
    fireEvent.click(same);
    expect(same.getAttribute('aria-pressed')).toBe('true');
    // [OBSERVED] a press on the strip switches auto-scroll off.
    fireEvent.pointerDown(screen.getByRole('region', { name: 'Test strip' }));
    expect(same.getAttribute('aria-pressed')).toBe('false');
  });

  it('motion off: the strip does not auto-scroll, so the toggle is not offered', () => {
    window.matchMedia = ((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    renderStrip();
    expect(screen.queryByRole('button', { name: 'Logo auto-scroll' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Test next' })).toBeTruthy();
  });

  it('ArrowLeft/ArrowRight scroll the focused strip 40 px; the page does not scroll', () => {
    renderStrip();
    const region = screen.getByRole('region', { name: 'Test strip' });
    Object.defineProperty(region, 'clientWidth', { configurable: true, value: 1000 });
    Object.defineProperty(region, 'scrollWidth', { configurable: true, value: 5000 });
    region.scrollLeft = 1000;
    region.focus();
    const right = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    region.dispatchEvent(right);
    expect(right.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 1040, behavior: 'smooth' });
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 960, behavior: 'smooth' });
    // Other keys keep their normal behaviour (e.g. ArrowDown still scrolls the page).
    const down = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });
    region.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(false);
  });

  it('arrow keys are not intercepted when focus is on a control inside the strip', () => {
    renderStrip();
    const region = screen.getByRole('region', { name: 'Test strip' });
    const inner = document.createElement('button');
    region.appendChild(inner);
    scrollTo.mockClear();
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    inner.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('arrows scroll 70 % of the visible width', () => {
    renderStrip();
    const region = screen.getByRole('region', { name: 'Test strip' });
    Object.defineProperty(region, 'clientWidth', { configurable: true, value: 1000 });
    Object.defineProperty(region, 'scrollWidth', { configurable: true, value: 5000 });
    region.scrollLeft = 1000;
    fireEvent.click(screen.getByRole('button', { name: 'Test next' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 1700, behavior: 'smooth' });
  });

  it('"See all" swaps the strip for a grid with names and hides the strip controls', () => {
    renderStrip();
    const seeAll = screen.getByRole('button', { name: /SEE ALL \(3\)/ });
    expect(seeAll.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(seeAll);
    const back = screen.getByRole('button', { name: /Test show strip/ });
    expect(back.getAttribute('aria-expanded')).toBe('true');
    const grid = document.getElementById(back.getAttribute('aria-controls') ?? '') as HTMLElement;
    expect(within(grid).getByText('Test logo 2')).toBeTruthy();
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Logo auto-scroll' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Test next' })).toBeNull();
  });
});
