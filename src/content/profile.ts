// Profile and hero content (PRD §1.5, FR-HE1–HE8; DESIGN §8.1; ARCHITECTURE §4.2).

import { pending } from './pending.ts';
import { approved, draft, type ProfileContent } from './schema.ts';

export const profile: ProfileContent = {
  displayName: 'Devansh', // CONFIRMED (D-01, D-11)
  wordmark: 'DEVANSH', // CONFIRMED (FR-H1, no ®)
  heroName: 'DEVANSH.', // CONFIRMED (FR-HE4)
  heroWord: 'PORTFOLIO', // FR-HE2 (decorative giant word)
  portrait: pending(
    'Hero portrait: transparent PNG, at least 1024 × 1536 (2 : 3), waist-up, with alt text (DESIGN §11.2)',
  ),
  topStripRole: 'UX DESIGNER & PRODUCT DESIGNER', // FR-HE1
  supportingLine: draft('VIDEO · VISUAL · MOTION'),
  helloLine: approved("Hello, I'm"), // FR-HE4 (not marked draft)
  roleLines: ['UX DESIGNER &', 'PRODUCT DESIGNER'], // CONFIRMED (FR-HE4)
  intro: pending('Short intro description (2–3 lines)'),
  location: pending('Location (city, country)'),
  availability: {
    text: draft('AVAILABLE FOR COLLABORATION'),
    shown: pending('Availability status: open to roles / freelance / both / not shown'),
  },
  manifestoLines: [draft('Every screen.'), draft('A clearer decision.')],
  stats: pending('Up to three verified hero stats (fewer are shown if fewer are verified)'),
  cv: pending('CV / résumé PDF'),
  showreel: pending('Showreel video or link, or confirm there is none (A-7 fallback)'),
  editionStartYear: pending('Start year for the "SELECTED WORK / [year]–2026" label'),
  socialLinks: {
    linkedin: pending('LinkedIn URL'),
    others: pending('Optional Behance / Dribbble / Instagram links, or confirm none'),
  },
};
