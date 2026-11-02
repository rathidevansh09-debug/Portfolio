// Site metadata (PRD FR-G5, FR-G6, NFR-C2, D-11, D-24; ARCHITECTURE §4.2).

import { pending } from './pending.ts';
import { draft, type SiteContent } from './schema.ts';

export const site: SiteContent = {
  title: draft('Devansh — UX Designer & Product Designer'),
  description: draft(
    'Devansh is a UX Designer & Product Designer crafting clear, usable digital products — from AI analytics platforms to eCommerce experiences.',
  ),
  shareImage: pending('Share image (1200 × 630), supplied or approved to be created from the hero'),
  shareImageWording: pending(
    'Exact wording shown on the share image (scanned by the launch check)',
  ),
  favicon: { monogram: 'D.' }, // CONFIRMED (D-24)
  // CONFIRMED (D-11): author metadata and JSON-LD only. Never visitor-facing.
  fullNameForMetadata: 'Devansh Rathi',
  // CONFIRMED (NFR-C2): the no-JavaScript fallback text; the email link comes from contact.ts.
  noscriptText: 'Devansh — UX Designer & Product Designer',
};
