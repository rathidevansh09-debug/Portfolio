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
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
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
    render(<App />);
    const sections = [...within(screen.getByRole('main')).getAllByText(/PENDING/)].map(
      (p) => p.closest('section') as HTMLElement,
    );
    expect(sections.map((s) => [s.dataset.placeholder, s.id])).toEqual([
      ['Hero', 'home'],
      ['Selected Work', 'portfolio'],
      ['Impact & Milestones', 'impact'],
      ['Breakdown', ''],
      ['About', 'about'],
      ['Journey', 'experience'],
      ['Contact', 'contact'],
    ]);
  });

  it('nav labels come from ui.ts; no footer yet (Phase 14)', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Work' })).toBeTruthy();
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });
});
