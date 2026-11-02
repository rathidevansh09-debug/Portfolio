// Impact & Milestones (PRD FR-I1–I5, D-04, D-23; ARCHITECTURE §4.5).
// Nothing is invented: no milestone, figure or outcome exists until the owner supplies and verifies it.
// Note: PRD assumption A-12 (the promotion to Lead UX Designer as a milestone) is not added here —
// it is an assumption, and its year is not yet supplied.

import { pending } from './pending.ts';
import type { ImpactContent } from './schema.ts';

export const impact: ImpactContent = {
  paragraph: pending('Short Impact paragraph'),
  proofLink: pending('Optional proof link (e.g. LinkedIn), or confirm there is none'),
  highlight: pending('Optional verified highlight figure and label, or confirm there is none'),
  milestones: pending(
    'Verified milestones, launches, certifications or outcomes, each with a year',
  ),
  zeroItemsDecision: pending(
    'Owner decision if there are no verified milestones: hide the section or add content before launch (FR-I4)',
  ),
};
