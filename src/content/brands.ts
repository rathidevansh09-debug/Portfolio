// Brands strip — client brands only (PRD D-12, FR-B1–B5). Employers are not shown here.
// Each logo is published only with permission confirmed.

import { pending } from './pending.ts';
import type { Brand } from './schema.ts';
import type { OrPending } from './pending.ts';

export const brands: OrPending<readonly Brand[]> = pending(
  'Client brands to show, logo files (SVG preferred) and permission to display each logo',
);
