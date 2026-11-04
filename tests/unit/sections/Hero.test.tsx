import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { content } from '../../../src/content/index.ts';
import { isPending, PENDING_LABEL } from '../../../src/content/pending.ts';
import type { ProfileContent, Stat } from '../../../src/content/schema.ts';
import { MotionPreferenceProvider } from '../../../src/motion/MotionPreference.tsx';
import { REDUCED_MOTION_QUERY } from '../../../src/motion/preference.ts';
import { hero as heroTokens } from '../../../src/motion/tokens.ts';
import { Hero, type HeroLabels } from '../../../src/sections/Hero/Hero.tsx';

let systemReduced = false;
beforeEach(() => {
  systemReduced = false;
  localStorage.clear();
  window.matchMedia = ((query: string) => ({
    matches: query === REDUCED_MOTION_QUERY ? systemReduced : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  delete (document as { fonts?: unknown }).fonts; // undo per-test font stubs (jsdom has none)
});

const labels: HeroLabels = {
  supportingLine: 'VIDEO · VISUAL · MOTION',
  hello: "Hello, I'm",
  availability: 'AVAILABLE FOR COLLABORATION',
  manifestoLines: ['Every screen.', 'A clearer decision.'],
  seeMyWork: 'See my work',
  downloadCv: 'Download CV',
  playShowreel: 'PLAY SHOWREEL',
  showreelSecondary: 'MOTION / VIDEO',
  scrollToDiscover: 'SCROLL TO DISCOVER',
  editionTemplate: 'SELECTED WORK / {start}–2026',
  imageFallback: { mark: 'D.', label: 'Preview unavailable' },
};

// Fictional test values only (never site content).
const stat = (n: number, verified = true): Stat => ({
  value: String(n),
  suffix: '+',
  label: `TEST STAT ${n}`,
  verified,
});
const supplied: ProfileContent = {
  ...content.profile,
  intro: 'Test intro',
  location: 'TEST CITY',
  availability: { ...content.profile.availability, shown: true },
  stats: [],
  cv: {
    kind: 'document',
    href: '/documents/test.pdf',
    label: 'Test CV',
    preview: {
      kind: 'image',
      alt: 'Test preview',
      asset: { sources: {}, img: { src: '/t.png', w: 10, h: 10 } },
    },
  },
  editionStartYear: 2000,
};

const renderHero = (profile: ProfileContent = supplied) =>
  render(
    <MotionPreferenceProvider>
      <Hero id="home" profile={profile} labels={labels} workHref="#portfolio" />
    </MotionPreferenceProvider>,
  );

describe('Hero content and structure (FR-HE1–HE7)', () => {
  it('one H1 "DEVANSH." with an accent stop; the giant word is hidden from screen readers', () => {
    const { container } = renderHero();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]?.textContent).toBe('DEVANSH.');
    const word = [...container.querySelectorAll('[aria-hidden="true"]')].find(
      (el) => el.textContent === 'PORTFOLIO',
    );
    expect(word).toBeTruthy();
  });

  it('top strip, role in two lines, "See my work →" to Selected Work, location', () => {
    const { container } = renderHero();
    expect(container.textContent).toContain('UX DESIGNER & PRODUCT DESIGNER');
    expect(container.textContent).toContain('VIDEO · VISUAL · MOTION');
    expect(screen.getByText('UX DESIGNER &').tagName).toBe('SPAN');
    const work = screen.getByRole('link', { name: 'See my work' });
    expect(work.getAttribute('href')).toBe('#portfolio');
    expect(work.querySelector('svg')?.getAttribute('class')).toContain('lucide-arrow-right');
    expect(screen.getByText('TEST CITY')).toBeTruthy();
    expect(screen.getByText('Test intro')).toBeTruthy();
  });

  it('availability badge only when shown; its static dot is decorative (M-18)', () => {
    renderHero();
    const badge = screen.getByText('AVAILABLE FOR COLLABORATION');
    expect(badge.querySelector('span')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('"Play showreel" is visual only until Phase 11 (no dead control)', () => {
    renderHero();
    expect(screen.getByText('PLAY SHOWREEL')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('edition label uses the draft wording with the supplied start year', () => {
    renderHero();
    expect(screen.getByText('SELECTED WORK / 2000–2026')).toBeTruthy();
  });
});

describe('stats rule (FR-HE6; DESIGN §8.1)', () => {
  const statsColumn = (container: HTMLElement) =>
    container.querySelector('a[download]')?.parentElement as HTMLElement;

  for (const count of [0, 1, 2, 3]) {
    it(`${count} verified stat(s): shown in order, then the CV link`, () => {
      const stats = Array.from({ length: count }, (_, i) => stat(i + 1));
      const { container } = renderHero({ ...supplied, stats });
      const column = statsColumn(container);
      const numbers = [...column.querySelectorAll('span')].filter((s) =>
        /^\d/.test(s.textContent ?? ''),
      );
      expect(numbers.map((n) => n.textContent)).toEqual(stats.map((s) => `${s.value}+`));
      expect(column.lastElementChild?.getAttribute('download')).not.toBeNull();
      expect(screen.getByText('Every screen.')).toBeTruthy(); // manifesto always shown
    });
  }

  it('never shows unverified figures, and at most three', () => {
    const stats = [stat(1), stat(2, false), stat(3), stat(4), stat(5)];
    const { container } = renderHero({ ...supplied, stats });
    expect(container.textContent).not.toContain('TEST STAT 2');
    expect(container.textContent).not.toContain('TEST STAT 5');
    expect(
      ['TEST STAT 1', 'TEST STAT 3', 'TEST STAT 4'].every((l) =>
        container.textContent?.includes(l),
      ),
    ).toBe(true);
  });
});

describe('PENDING content (owner decision 3)', () => {
  it('real content: portrait, intro, location, stats, CV, availability and edition year are PENDING', () => {
    const p = content.profile;
    for (const value of [
      p.portrait,
      p.intro,
      p.location,
      p.stats,
      p.cv,
      p.availability.shown,
      p.editionStartYear,
    ]) {
      expect(isPending(value)).toBe(true);
    }
  });

  it('development: each pending item shows a PENDING marker in its place', () => {
    const { container } = renderHero(content.profile);
    expect(container.querySelectorAll('[data-pending]')).toHaveLength(7);
    expect(screen.queryByRole('link', { name: /Download CV/ })).toBeNull();
  });

  it('production: pending items render nothing; confirmed content still shows', () => {
    vi.stubEnv('DEV', false);
    const { container } = renderHero(content.profile);
    expect(container.querySelectorAll('[data-pending]')).toHaveLength(0);
    expect(container.textContent).not.toContain(PENDING_LABEL);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('DEVANSH.');
    expect(screen.getByRole('link', { name: 'See my work' })).toBeTruthy();
  });

  it('a supplied portrait loads first and eagerly, with its alt text', () => {
    renderHero({
      ...supplied,
      portrait: {
        kind: 'image',
        alt: 'Test portrait alt',
        asset: { sources: {}, img: { src: '/test-portrait.png', w: 1024, h: 1536 } },
      },
    });
    const img = within(document.querySelector('[data-hero-portrait]') as HTMLElement).getByRole(
      'img',
      { name: 'Test portrait alt' },
    );
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('fetchpriority')).toBe('high');
  });
});

describe('hero start gate (PRD §13)', () => {
  const started = (c: HTMLElement) => c.querySelector('section')?.hasAttribute('data-started');

  it('motion off: no gate, final state at once', () => {
    systemReduced = true;
    const { container } = renderHero();
    expect(started(container)).toBe(true);
  });

  it('motion on: waits for the fonts, then starts', async () => {
    let release: () => void = () => {};
    const load = vi.fn(() => new Promise<void>((r) => (release = r)));
    Object.defineProperty(document, 'fonts', { configurable: true, value: { load } });
    document.documentElement.style.setProperty('--font-display', "'Anton'");
    const { container } = renderHero();
    expect(started(container)).toBe(false);
    await act(async () => release());
    expect(load).toHaveBeenCalledWith("1em 'Anton'");
    expect(started(container)).toBe(true);
  });

  it(`motion on: never waits longer than the ${heroTokens.startGateCap} s cap`, () => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { load: () => new Promise(() => {}) }, // fonts never arrive
    });
    const { container } = renderHero();
    expect(started(container)).toBe(false);
    act(() => vi.advanceTimersByTime(heroTokens.startGateCap * 1000));
    expect(started(container)).toBe(true);
  });
});
