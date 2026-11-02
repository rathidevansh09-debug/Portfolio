// About (PRD FR-A1–A2, D-13; DESIGN §8.6).

import { pending } from './pending.ts';
import type { AboutContent } from './schema.ts';

export const about: AboutContent = {
  intro: pending('First-person intro paragraph'),
  education: pending('Education rows: institution, course, year, one line'),
  courses: pending('Courses & workshops'),
  // CONFIRMED skills and grouping (PRD FR-A2, §1.5).
  primarySkills: [
    'UX Research',
    'Information Architecture',
    'Interaction Design',
    'Design Systems',
    'Dashboard Design',
    'eCommerce Design',
    'Shopify Storefronts',
    'CRO',
    'Developer Handoff',
  ],
  supportingSkills: ['Video Editing', 'Visual Design', 'Motion Graphics'],
  toolkit: pending('Toolkit: software you use, with icons'),
  // CONFIRMED titles (D-13); one-line descriptions PENDING.
  processSteps: [
    { number: '01', title: 'RESEARCH', description: pending('One-line description') },
    { number: '02', title: 'STRUCTURE', description: pending('One-line description') },
    { number: '03', title: 'DESIGN', description: pending('One-line description') },
    { number: '04', title: 'HANDOFF', description: pending('One-line description') },
    { number: '05', title: 'OPTIMISE', description: pending('One-line description') },
  ],
  quote: pending('Short design-philosophy quote'),
  signature: 'Devansh', // CONFIRMED (FR-A2)
};
