// Breakdown: Wireframe → Final (PRD FR-BD1–BD4). D-09 is OPEN: no project is pre-selected.

import { pending } from './pending.ts';
import type { BreakdownContent } from './schema.ts';

export const breakdown: BreakdownContent = {
  project: pending('D-09: project chosen after matching wireframe + final images are supplied'),
  pair: pending('Wireframe and final-design images of the same screen'),
  credit: pending('Credit line: project / year / role'),
  paragraph: pending('Short description'),
};
