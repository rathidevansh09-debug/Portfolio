import { describe, expect, it } from 'vitest';
import { pending } from '../../src/content/pending.ts';
import type { Brand, Milestone, Stat } from '../../src/content/schema.ts';
import {
  publishedBrands,
  publishedProjects,
  selectImpactLayout,
  selectJourneyPanel,
  verifiedFacts,
  verifiedHighlight,
  verifiedOnly,
  verifiedStats,
  visibleSections,
} from '../../src/lib/selectors.ts';
import { image, makeProject } from './fixtures.ts';

describe('selectors enforce honesty rules (ARCHITECTURE §4.1 rule 4)', () => {
  it('publishes only permitted projects; PENDING permission shows only in development', () => {
    const yes = makeProject({ slug: 'yes' });
    const no = makeProject({ slug: 'no', permissionConfirmed: false });
    const tbc = makeProject({ slug: 'tbc', permissionConfirmed: pending('permission') });
    expect(publishedProjects([yes, no, tbc], 'production').map((p) => p.slug)).toEqual(['yes']);
    expect(publishedProjects([yes, no, tbc], 'development').map((p) => p.slug)).toEqual([
      'yes',
      'tbc',
    ]);
  });

  it('publishes only client logos with permission (D-12)', () => {
    const logos: Brand[] = [
      { name: 'Ok', logo: image('Ok logo'), permissionConfirmed: true },
      { name: 'No', logo: image('No logo'), permissionConfirmed: false },
    ];
    expect(publishedBrands(logos).map((b) => b.name)).toEqual(['Ok']);
    expect(publishedBrands(pending('brands'))).toEqual([]);
  });

  it('shows only present, verified facts in the fixed D-22 order', () => {
    const facts = verifiedFacts({
      tools: { value: 'Figma', verified: true },
      client: { value: 'Acme', verified: true },
      myRole: { value: 'Lead', verified: false },
      team: { value: '  ', verified: true },
    });
    expect(facts.map((f) => f.key)).toEqual(['client', 'tools']);
    expect(verifiedFacts(pending('facts'))).toEqual([]);
  });

  it('hides empty case-study sections and unverified outcomes (D-16, FR-M4)', () => {
    const sections = visibleSections({
      problem: { items: [{ kind: 'paragraph', text: 'P' }] },
      overview: { items: [{ kind: 'paragraph', text: 'O' }] },
      research: { items: [] },
      outcomes: [
        { label: 'Real', verified: true },
        { label: 'Claimed', verified: false },
      ],
    });
    expect(sections.map((s) => s.key)).toEqual(['overview', 'problem', 'outcomes']);
    const outcomes = sections.at(-1);
    expect(outcomes?.key === 'outcomes' ? outcomes.outcomes.map((o) => o.label) : []).toEqual([
      'Real',
    ]);
    expect(visibleSections({ outcomes: [{ label: 'x', verified: false }] })).toEqual([]);
  });

  it('shows 0–3 verified stats only, and never an unverified highlight figure', () => {
    const s = (v: string, verified: boolean): Stat => ({ value: v, label: v, verified });
    expect(
      verifiedStats([s('1', true), s('2', false), s('3', true), s('4', true), s('5', true)]).map(
        (x) => x.value,
      ),
    ).toEqual(['1', '3', '4']);
    expect(verifiedHighlight({ value: '10', label: 'x', verified: false })).toBeNull();
    expect(verifiedHighlight({ value: '10', label: 'x', verified: true })?.value).toBe('10');
    expect(verifiedHighlight(null)).toBeNull();
  });

  it('selects the Impact layout: ≥ 4 full, 1–3 compact, 0 owner decision (D-23, FR-I4)', () => {
    expect(selectImpactLayout(6, 'hide')).toBe('full');
    expect(selectImpactLayout(4, pending('d'))).toBe('full');
    expect(selectImpactLayout(3, pending('d'))).toBe('compact');
    expect(selectImpactLayout(1, 'hide')).toBe('compact');
    expect(selectImpactLayout(0, pending('d'))).toBe('awaiting-decision');
    expect(selectImpactLayout(0, 'hide')).toBe('hidden');
    expect(selectImpactLayout(0, 'add-content-before-launch')).toBe('awaiting-content');
  });

  it('hides the Journey milestones panel only on the owner decision (FR-J5)', () => {
    const m = (verified: boolean): Milestone => ({
      title: 't',
      context: 'c',
      year: 2024,
      verified,
    });
    expect(verifiedOnly([m(true), m(false)])).toHaveLength(1);
    expect(selectJourneyPanel(1, pending('d'))).toBe('shown');
    expect(selectJourneyPanel(0, pending('d'))).toBe('awaiting-decision');
    expect(selectJourneyPanel(0, 'hide')).toBe('hidden');
  });
});
