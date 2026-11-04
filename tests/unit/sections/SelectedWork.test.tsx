import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { content } from '../../../src/content/index.ts';
import { PENDING_LABEL } from '../../../src/content/pending.ts';
import type { Brand, FilterKey, Project } from '../../../src/content/schema.ts';
import { approved } from '../../../src/content/schema.ts';
import { MotionPreferenceProvider } from '../../../src/motion/MotionPreference.tsx';
import {
  SelectedWork,
  type SelectedWorkLabels,
} from '../../../src/sections/SelectedWork/SelectedWork.tsx';
import { image, index, makeProject } from '../fixtures.ts';

// Fictional test data only.
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
afterEach(() => vi.unstubAllEnvs());

const chip = approved('TEST TYPE');
const labels: SelectedWorkLabels = {
  eyebrow: '01 / SELECTED WORK',
  headline: 'WORK THAT SPEAKS.',
  allWork: 'ALL WORK',
  selectedWork: 'SELECTED WORK',
  filterAll: 'All',
  filtersLabel: 'Test filters',
  search: 'Search',
  showMore: 'Show more work',
  count: '{shown} of {total} projects',
  empty: "No work found for '{query}'.",
  resetSearch: 'Reset search',
  announcement: '{count} projects shown',
  chips: { 'case-study': chip, website: chip, 'video-motion': chip, 'before-after': chip },
  imageFallback: { mark: 'D.', label: 'Preview unavailable' },
  brands: {
    headingLine1: 'BEEN PART OF',
    headingLine2: 'THE BIGGER PICTURE.',
    seeAll: 'SEE ALL ({count})',
    showStrip: 'Test show strip',
    autoScroll: 'Logo auto-scroll',
    previous: 'Test previous',
    next: 'Test next',
    region: 'Test strip',
    imageFallback: { mark: 'D.', label: 'Preview unavailable' },
  },
};

const tags: FilterKey[][] = [['ecommerce'], ['ecommerce', 'visual-design'], ['product-saas']];
const projects: Project[] = Array.from({ length: 14 }, (_, i) =>
  makeProject({ slug: `p${i + 1}`, title: `Test project ${i + 1}`, tags: tags[i % 3] }),
);
const unpermitted = makeProject({
  slug: 'secret',
  title: 'Secret project',
  permissionConfirmed: false,
});
const brands: Brand[] = [
  { name: 'Test logo 1', logo: image('Test logo 1'), permissionConfirmed: true },
  { name: 'Hidden logo', logo: image('Hidden logo'), permissionConfirmed: false },
];

const renderWork = (props: Partial<Parameters<typeof SelectedWork>[0]> = {}) =>
  render(
    <MotionPreferenceProvider>
      <SelectedWork
        id="portfolio"
        projects={[...projects, unpermitted]}
        index={index(
          ['p3', 'p1', 'p2'],
          projects.map((p) => p.slug),
        )}
        filters={content.filters}
        brands={brands}
        labels={labels}
        {...props}
      />
    </MotionPreferenceProvider>,
  );

const titles = () =>
  screen
    .queryAllByRole('heading', { level: 3 })
    .filter((h) => /^Test project/.test(h.textContent ?? ''))
    .map((h) => h.textContent);
const toggle = () => screen.getByRole('button', { name: /ALL WORK|SELECTED WORK/ });
const tab = (name: string) => screen.getByRole('button', { name, pressed: undefined });

describe('Selected Work (FR-W1–W7; owner decisions, Phase 10)', () => {
  it('Selected view shows the featured projects in their confirmed order', () => {
    renderWork();
    expect(titles()).toEqual(['Test project 3', 'Test project 1', 'Test project 2']);
    expect(toggle().textContent).toContain('ALL WORK');
  });

  it('featured projects without permission are missing, never substituted', () => {
    renderWork({
      index: index(
        ['secret', 'p1'],
        projects.map((p) => p.slug),
      ),
    });
    expect(titles()).toEqual(['Test project 1']);
    expect(screen.queryByText('Secret project')).toBeNull();
  });

  it('toggle: "ALL WORK →" in Selected view, "SELECTED WORK" without an arrow in All view', () => {
    renderWork();
    expect(toggle().textContent).toBe('ALL WORK');
    expect(toggle().querySelector('svg')?.getAttribute('class')).toContain('lucide-arrow-right');
    fireEvent.click(toggle());
    expect(toggle().textContent).toBe('SELECTED WORK');
    expect(toggle().querySelector('svg')).toBeNull();
  });

  it('All view: 9 at a time, "Show more work" adds 9, with "X of Y projects"', () => {
    renderWork();
    fireEvent.click(toggle());
    expect(toggle().textContent).toContain('SELECTED WORK');
    expect(titles()).toHaveLength(9);
    expect(screen.getByText('9 of 14 projects')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show more work' }));
    expect(titles()).toHaveLength(14);
    expect(screen.queryByRole('button', { name: 'Show more work' })).toBeNull();
  });

  it('only filters carried by a published project appear, with All first', () => {
    renderWork();
    const group = screen.getByRole('group', { name: 'Test filters' });
    expect(
      within(group)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['All', 'Product & SaaS', 'eCommerce', 'Visual Design']);
    expect(tab('All').getAttribute('aria-pressed')).toBe('true');
  });

  it('[OBSERVED] a filter in Selected view switches to All view and filters the full list', async () => {
    renderWork();
    fireEvent.click(tab('Visual Design'));
    expect(tab('Visual Design').getAttribute('aria-pressed')).toBe('true');
    expect(toggle().textContent).toContain('SELECTED WORK');
    // Cards that leave finish their M-05 exit first.
    await waitFor(() =>
      expect(titles()).toEqual([
        'Test project 2',
        'Test project 5',
        'Test project 8',
        'Test project 11',
        'Test project 14',
      ]),
    );
  });

  it('[OBSERVED] searching switches to All view; back to Selected resets filter and search', async () => {
    renderWork();
    const input = screen.getByRole('searchbox', { name: 'Search' });
    fireEvent.change(input, { target: { value: 'project 1' } });
    expect(toggle().textContent).toContain('SELECTED WORK');
    await waitFor(() =>
      expect(titles()).toEqual([
        'Test project 1',
        'Test project 10',
        'Test project 11',
        'Test project 12',
        'Test project 13',
        'Test project 14',
      ]),
    );
    fireEvent.click(tab('eCommerce'));
    fireEvent.click(toggle());
    expect(toggle().textContent).toContain('ALL WORK');
    expect((input as HTMLInputElement).value).toBe('');
    expect(tab('All').getAttribute('aria-pressed')).toBe('true');
    await waitFor(() =>
      expect(titles()).toEqual(['Test project 3', 'Test project 1', 'Test project 2']),
    );
  });

  it('empty state; "Reset search" clears search and filter and focuses the search box', async () => {
    renderWork();
    fireEvent.click(tab('eCommerce'));
    const input = screen.getByRole('searchbox', { name: 'Search' });
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByText("No work found for 'zzz'.")).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reset search' }));
    expect((input as HTMLInputElement).value).toBe('');
    expect(tab('All').getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(input);
    await waitFor(() => expect(titles()).toHaveLength(9));
  });

  it('announces the result count politely after each change (A-8), not on load', () => {
    const { container } = renderWork();
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(live.textContent).toBe('');
    fireEvent.click(tab('eCommerce'));
    expect(live.textContent?.trim()).toBe('10 projects shown');
    fireEvent.click(tab('eCommerce'));
    expect(live.textContent?.trim()).toBe('10 projects shown'); // re-announced (content changes)
  });

  it('cards are static until Phase 11: no button, link or focus stop; category only', () => {
    const { container } = renderWork();
    const grid = container.querySelector('ul') as HTMLElement;
    expect(grid.querySelectorAll('button, a, [tabindex]')).toHaveLength(0);
    const first = within(grid).getAllByRole('listitem')[0] as HTMLElement;
    expect(first.textContent).toBe('TEST TYPE01Test project 3Test category');
    expect(first.querySelectorAll('svg')).toHaveLength(0); // no hover circle, no caption arrow
  });

  it('only permitted client logos reach the Brands strip', () => {
    renderWork();
    expect(screen.getByRole('heading', { level: 3, name: /THE BIGGER PICTURE/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'SEE ALL (1)' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Hidden logo' })).toBeNull();
  });
});

describe('PENDING and production behaviour (owner decisions 3 and 4)', () => {
  it('development: the real content shows the featured projects with PENDING markers', () => {
    renderWork({ projects: content.projects, index: content.projectIndex, brands: content.brands });
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toContain(
      'PNG Jewellers',
    );
    expect(document.querySelectorAll('[data-pending]').length).toBeGreaterThan(0);
  });

  it('production with no published project: the heading row only', () => {
    vi.stubEnv('DEV', false);
    const { container } = renderWork({
      projects: content.projects,
      index: content.projectIndex,
      brands: content.brands,
    });
    const section = container.querySelector('#portfolio') as HTMLElement;
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('WORK THAT SPEAKS.');
    expect(section.querySelectorAll('button, input, ul, [role="region"]')).toHaveLength(0);
    expect(section.textContent).not.toContain(PENDING_LABEL);
    expect(section.textContent).toBe('01 / SELECTED WORKWORK THAT SPEAKS.');
  });

  it('production: an unpublished featured project never appears', () => {
    vi.stubEnv('DEV', false);
    renderWork({ projects: [unpermitted], index: index(['secret']) });
    expect(screen.queryByText('Secret project')).toBeNull();
  });
});

describe('motion off (MO-5)', () => {
  it('everything renders in its final state', async () => {
    window.matchMedia = ((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    const { container } = renderWork();
    await act(async () => {});
    const item = container.querySelector('li') as HTMLElement;
    expect(item.style.opacity === '' || item.style.opacity === '1').toBe(true);
  });
});
