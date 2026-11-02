// Honesty rules enforced in code (ARCHITECTURE §4.1 rule 4; AGENTS §5): only verified figures,
// outcomes, milestones and facts; only content with permission confirmed; empty sections hidden.
//
// Mode: 'production' shows only confirmed content. 'development' also returns items whose
// permission is still PENDING so their layout can be reviewed with PENDING placeholders; the
// launch check blocks publishing while any remain. Items explicitly not permitted never show.

import { isPending, type OrPending } from '../content/pending.ts';
import {
  FACT_KEYS,
  SECTION_ORDER,
  type Brand,
  type CaseStudySection,
  type CaseStudySections,
  type EmptyPanelDecision,
  type Fact,
  type Facts,
  type HighlightFigure,
  type Outcome,
  type Project,
  type Stat,
} from '../content/schema.ts';

export type ContentMode = 'production' | 'development';

const allowed = (permission: OrPending<boolean>, mode: ContentMode): boolean =>
  permission === true || (mode === 'development' && isPending(permission));

/** Projects that may be shown (PRD A-10). */
export function publishedProjects(projects: readonly Project[], mode: ContentMode): Project[] {
  return projects.filter((p) => allowed(p.permissionConfirmed, mode));
}

/** Client logos that may be shown (D-12). */
export function publishedBrands(brands: OrPending<readonly Brand[]>): Brand[] {
  return isPending(brands) ? [] : brands.filter((b) => b.permissionConfirmed);
}

/** Facts in the fixed D-22 order, only when present, non-empty and verified (D-20). */
export function verifiedFacts(facts: OrPending<Facts>): { key: keyof Facts; fact: Fact }[] {
  if (isPending(facts)) return [];
  return FACT_KEYS.flatMap((key) => {
    const fact = facts[key];
    return fact && fact.verified && fact.value.trim() !== '' ? [{ key, fact }] : [];
  });
}

export function verifiedOutcomes(outcomes: readonly Outcome[] | undefined): Outcome[] {
  return (outcomes ?? []).filter((o) => o.verified && o.label.trim() !== '');
}

export type VisibleSection =
  | { key: Exclude<(typeof SECTION_ORDER)[number], 'outcomes'>; section: CaseStudySection }
  | { key: 'outcomes'; outcomes: Outcome[] };

/** Case-study sections in D-16 order; empty sections and unverified outcomes are hidden. */
export function visibleSections(sections: OrPending<CaseStudySections>): VisibleSection[] {
  if (isPending(sections)) return [];
  return SECTION_ORDER.flatMap((key): VisibleSection[] => {
    if (key === 'outcomes') {
      const outcomes = verifiedOutcomes(sections.outcomes);
      return outcomes.length ? [{ key, outcomes }] : [];
    }
    const section = sections[key];
    return section && section.items.length > 0 ? [{ key, section }] : [];
  });
}

/** Verified items only, keeping their order. Pending lists yield nothing. */
export function verifiedOnly<T extends { verified: boolean }>(items: OrPending<readonly T[]>): T[] {
  return isPending(items) ? [] : items.filter((i) => i.verified);
}

/** 0–3 verified hero stats; fewer are shown if fewer are verified (FR-HE6). */
export function verifiedStats(stats: OrPending<readonly Stat[]>): Stat[] {
  return verifiedOnly(stats).slice(0, 3);
}

/** The highlight figure only if verified; never an unverified number (FR-I2). */
export function verifiedHighlight(
  highlight: OrPending<HighlightFigure | null>,
): HighlightFigure | null {
  return !isPending(highlight) && highlight?.verified ? highlight : null;
}

export type ImpactLayout = 'full' | 'compact' | 'hidden' | 'awaiting-decision' | 'awaiting-content';

/**
 * Impact layout from the number of verified milestones (D-23; ARCHITECTURE §4.5):
 * ≥ 4 full · 1–3 compact · 0 → owner decision (FR-I4). The two "awaiting" states render a
 * development placeholder and block launch.
 */
export function selectImpactLayout(
  verifiedCount: number,
  zeroDecision: OrPending<EmptyPanelDecision>,
): ImpactLayout {
  if (verifiedCount >= 4) return 'full';
  if (verifiedCount >= 1) return 'compact';
  return emptyState(zeroDecision);
}

export type PanelState = 'shown' | 'hidden' | 'awaiting-decision' | 'awaiting-content';

/** Journey milestones panel (FR-J5): hidden only when the owner has decided to hide it. */
export function selectJourneyPanel(
  verifiedCount: number,
  emptyDecision: OrPending<EmptyPanelDecision>,
): PanelState {
  return verifiedCount > 0 ? 'shown' : emptyState(emptyDecision);
}

function emptyState(
  decision: OrPending<EmptyPanelDecision>,
): 'hidden' | 'awaiting-decision' | 'awaiting-content' {
  if (isPending(decision)) return 'awaiting-decision';
  return decision === 'hide' ? 'hidden' : 'awaiting-content';
}
