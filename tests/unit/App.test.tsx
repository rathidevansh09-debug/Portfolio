import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../src/App.tsx';

beforeEach(() => {
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
});

describe('App: page shell (ARCHITECTURE §3.1; PRD §5)', () => {
  it('skip link first, then header and main', () => {
    const { container } = render(<App />);
    const first = container.querySelector('a, button');
    expect(first?.textContent).toBe('Skip to work');
    expect(first?.getAttribute('href')).toBe('#portfolio');
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('sections in the fixed order with their anchors (Breakdown has none)', () => {
    const { container } = render(<App />);
    const sections = [...container.querySelectorAll('main > section')] as HTMLElement[];
    expect(sections.map((s) => [s.dataset.placeholder ?? 'real', s.id])).toEqual([
      ['real', 'home'], // Hero (Phase 9)
      ['real', 'portfolio'], // Selected Work (Phase 10)
      ['Impact & Milestones', 'impact'],
      ['Breakdown', ''],
      ['About', 'about'],
      ['Journey', 'experience'],
      ['Contact', 'contact'],
    ]);
    expect(within(sections[0] as HTMLElement).getByRole('heading', { level: 1 }).textContent).toBe(
      'DEVANSH.',
    );
  });

  it('nav labels come from ui.ts; no footer yet (Phase 14)', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Work' })).toBeTruthy();
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });
});
