import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PENDING_LABEL } from '../../../src/content/pending.ts';
import { ReadingProgress } from '../../../src/layout/ReadingProgress/ReadingProgress.tsx';
import { SectionBoundary } from '../../../src/layout/SectionBoundary/SectionBoundary.tsx';
import { SectionPlaceholder } from '../../../src/layout/SectionPlaceholder/SectionPlaceholder.tsx';
import { SkipLink } from '../../../src/layout/SkipLink/SkipLink.tsx';
import { MotionPreferenceProvider } from '../../../src/motion/MotionPreference.tsx';

describe('SkipLink (FR-G2)', () => {
  it('links to the target section with its label', () => {
    render(<SkipLink targetId="portfolio" label="Skip to work" />);
    expect(screen.getByRole('link', { name: 'Skip to work' }).getAttribute('href')).toBe(
      '#portfolio',
    );
  });
});

describe('ReadingProgress (M-15)', () => {
  it('is a decorative bar hidden from screen readers', () => {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    const { container } = render(
      <MotionPreferenceProvider>
        <ReadingProgress />
      </MotionPreferenceProvider>,
    );
    expect((container.firstElementChild as HTMLElement).getAttribute('aria-hidden')).toBe('true');
  });
});

describe('SectionBoundary (ARCHITECTURE §11.2)', () => {
  function Broken(): never {
    throw new Error('test failure');
  }

  it('replaces only the failing section with the quiet message, keeping its anchor', () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <main>
        <SectionBoundary id="impact" fallback="Test fallback">
          <Broken />
        </SectionBoundary>
        <SectionBoundary id="about" fallback="Test fallback">
          <section id="about">About works</section>
        </SectionBoundary>
      </main>,
    );
    expect(container.querySelector('#impact')?.textContent).toBe('Test fallback');
    expect(container.querySelector('#about')?.textContent).toBe('About works');
    expect(report).toHaveBeenCalled(); // React reports it: nothing is swallowed in development
    report.mockRestore();
  });
});

describe('SectionPlaceholder (temporary, Phase 8)', () => {
  it('is clearly a PENDING development placeholder with its anchor', () => {
    const { container } = render(<SectionPlaceholder id="about" name="About" phase={13} />);
    const section = container.querySelector('section');
    expect(section?.id).toBe('about');
    expect(section?.dataset.placeholder).toBe('About');
    expect(section?.textContent).toBe(
      `${PENDING_LABEL} · Temporary development placeholder: About (Phase 13)`,
    );
    expect(section?.querySelector('h1, h2, h3')).toBeNull(); // no empty headings
  });
});
