// Project: TruFlo Intelligence. Name CONFIRMED (PRD FR-W9); every other detail PENDING — nothing invented.
// PRD FR-W9 lists it as "TruFlo Intelligence — AI-powered analytics platform"; the descriptor is not placed in any field until the owner supplies the summary.

import { pending } from '../pending.ts';
import type { Project } from '../schema.ts';

export const trufloIntelligence: Project = {
  slug: 'truflo-intelligence',
  title: 'TruFlo Intelligence',
  client: pending('Client name (or confirm there is no separate client)'),
  tags: pending('One or more filter tags (D-03)'),
  primaryCategory: pending('Primary category label for the card and pop-up'),
  type: pending('Project type: case study, website, video/motion or before/after'),
  year: pending('Project year'),
  cover: pending('Cover image (≥ 1920 × 1164 px) with alt text'),
  heroMedia: pending('Pop-up hero media: image, video or before/after pair'),
  summary: pending('One-paragraph summary'),
  facts: pending('Verified facts: client, year, my role, team, platform, tools'),
  externalLink: pending('Live link, or confirm there is none'),
  sections: pending('Case-study content for any of the six sections'),
  permissionConfirmed: pending('Permission to show this project (NDA check, PRD A-10)'),
};
