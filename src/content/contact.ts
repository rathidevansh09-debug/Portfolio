// Contact (PRD FR-C1–C6, D-18, NFR-PR3; ARCHITECTURE §4.2).
// Contact details are published only as approved by the owner (NFR-PR3).
// LinkedIn and other social links live in profile.ts (ARCHITECTURE §4.2); the Contact section
// lists them alongside these channels, and the footer reuses them (FR-F1).

import { pending } from './pending.ts';
import { draft, type ContactContent } from './schema.ts';

export const contact: ContactContent = {
  closingStatement: "LET'S MAKE THE NEXT SCREEN COUNT.", // CONFIRMED (D-18)
  email: pending('Public email address (owner approval to publish, NFR-PR3)'),
  whatsapp: pending('WhatsApp number with country code (owner approval to publish, NFR-PR3)'),
  basedIn: pending('"Based in" location'),
  // [DRAFT COPY] (FR-C4)
  projectTypes: [
    draft('UX/UI Design'),
    draft('Product Design'),
    draft('Dashboard / SaaS'),
    draft('eCommerce / Shopify'),
    draft('Design System'),
    draft('Video / Motion'),
    draft('Other'),
  ],
  messageTemplates: pending('Pre-written WhatsApp message and email subject/body wording (FR-C5)'),
};
