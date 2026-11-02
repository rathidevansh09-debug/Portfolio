import { describe, expect, it } from 'vitest';
import { filters } from '../../src/content/filters.ts';
import { pending } from '../../src/content/pending.ts';
import {
  PAGE_SIZE,
  availableFilters,
  browse,
  matchesSearch,
  orderProjects,
  revealMore,
} from '../../src/lib/filtering.ts';
import { index, makeProject } from './fixtures.ts';

const a = makeProject({
  slug: 'a',
  title: 'Alpha Store',
  tags: ['ecommerce', 'visual-design'],
  client: 'Acme',
});
const b = makeProject({ slug: 'b', title: 'Beta Dashboard', tags: ['dashboards-data'] });
const c = makeProject({ slug: 'c', title: 'Gamma', tags: pending('tags') });

describe('filtering (ARCHITECTURE §4.6, D-03)', () => {
  it('shows only filters that at least one project carries', () => {
    expect(availableFilters([a, b, c], filters).map((f) => f.key)).toEqual([
      'dashboards-data',
      'ecommerce',
      'visual-design',
    ]);
  });

  it('lists a project under every filter whose tag it carries', () => {
    const run = (filter: 'ecommerce' | 'visual-design' | 'all') =>
      browse({
        projects: [a, b],
        index: index([], ['a', 'b']),
        filters,
        mode: 'all',
        filter,
        query: '',
        revealed: 9,
      }).items.map((p) => p.slug);
    expect(run('ecommerce')).toEqual(['a']);
    expect(run('visual-design')).toEqual(['a']);
    expect(run('all')).toEqual(['a', 'b']);
  });

  it('searches title, tag labels and client, case-insensitively (FR-W3)', () => {
    expect(matchesSearch(a, 'alpha', filters)).toBe(true);
    expect(matchesSearch(a, 'ECOMMERCE', filters)).toBe(true);
    expect(matchesSearch(a, 'acme', filters)).toBe(true);
    expect(matchesSearch(b, 'acme', filters)).toBe(false);
    expect(matchesSearch(b, '   ', filters)).toBe(true);
  });

  it('uses the owner display order, or the content order while it is PENDING', () => {
    expect(orderProjects([a, b], index([], ['b', 'a'])).map((p) => p.slug)).toEqual(['b', 'a']);
    expect(
      orderProjects([a, b], { featured: [], displayOrder: pending('order') }).map((p) => p.slug),
    ).toEqual(['a', 'b']);
  });

  it('Selected mode shows the featured projects in their order', () => {
    const r = browse({
      projects: [a, b, c],
      index: index(['c', 'a']),
      filters,
      mode: 'selected',
      filter: 'all',
      query: '',
      revealed: PAGE_SIZE,
    });
    expect(r.items.map((p) => p.slug)).toEqual(['c', 'a']);
    expect(r.hasMore).toBe(false);
  });

  it('All mode shows 9 at a time, "Show more" adds 9, and reports X of Y (FR-W6)', () => {
    const many = Array.from({ length: 20 }, (_, i) => makeProject({ slug: `p${i}` }));
    const input = {
      projects: many,
      index: index(
        [],
        many.map((p) => p.slug),
      ),
      filters,
      mode: 'all' as const,
      filter: 'all' as const,
      query: '',
    };
    const first = browse({ ...input, revealed: PAGE_SIZE });
    expect([first.items.length, first.total, first.hasMore]).toEqual([9, 20, true]);
    const second = browse({ ...input, revealed: revealMore(PAGE_SIZE) });
    expect([second.items.length, second.hasMore]).toEqual([18, true]);
    const third = browse({ ...input, revealed: revealMore(revealMore(PAGE_SIZE)) });
    expect([third.items.length, third.hasMore]).toEqual([20, false]);
  });

  it('returns an empty result for a search with no matches (empty state, FR-W7)', () => {
    const r = browse({
      projects: [a, b],
      index: index([], ['a', 'b']),
      filters,
      mode: 'all',
      filter: 'all',
      query: 'zzz',
      revealed: 9,
    });
    expect([r.items.length, r.total]).toEqual([0, 0]);
  });
});
