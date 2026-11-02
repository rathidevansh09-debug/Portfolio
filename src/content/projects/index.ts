// Project list and featured selection (ARCHITECTURE §4.2; PRD FR-W1, FR-W9; DESIGN DS-4).
// Display order and featured order are data, not code. No project priority is invented.

import { pending } from '../pending.ts';
import type { Project, ProjectIndex } from '../schema.ts';
import { dsMills } from './ds-mills.ts';
import { healthify } from './healthify.ts';
import { plantigo } from './plantigo.ts';
import { pngJewellers } from './png-jewellers.ts';
import { purpleUnitedKids } from './purple-united-kids.ts';
import { rankaJewellers } from './ranka-jewellers.ts';
import { trufloIntelligence } from './truflo-intelligence.ts';
import { yeraGlassware } from './yera-glassware.ts';
import { yoouByPng } from './yoou-by-png.ts';

/** All nine projects, listed in the order PRD FR-W9 names them (not a display priority). */
export const projects: readonly Project[] = [
  trufloIntelligence,
  pngJewellers,
  yoouByPng,
  rankaJewellers,
  yeraGlassware,
  purpleUnitedKids,
  dsMills,
  healthify,
  plantigo,
];

export const projectIndex: ProjectIndex = {
  displayOrder: pending('Display order of all projects in "All work" (FR-W9)'),
  // CONFIRMED (DS-4): featured = PNG Jewellers, YOOU by PNG, Yera Glassware, in this order.
  featured: ['png-jewellers', 'yoou-by-png', 'yera-glassware'],
};
