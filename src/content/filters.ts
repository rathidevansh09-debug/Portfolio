// Project filters — CONFIRMED (PRD D-03, FR-W2; DESIGN DS-11).
// "All" is not a tag; it is a UI option (src/content/ui.ts). Shopify is a Platform fact, never a
// filter. A filter tab is shown only if at least one published project carries its tag.

import type { Filter } from './schema.ts';

export const filters: readonly Filter[] = [
  { key: 'product-saas', label: 'Product & SaaS' },
  { key: 'dashboards-data', label: 'Dashboards & Data' },
  { key: 'ecommerce', label: 'eCommerce' },
  { key: 'design-systems', label: 'Design Systems' },
  { key: 'motion-video', label: 'Motion & Video' },
  { key: 'visual-design', label: 'Visual Design' },
];
