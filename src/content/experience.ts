// Journey (PRD FR-J1–J5, D-10, D-15, D-19; ARCHITECTURE §4.4).
// Five roles, one row per role, newest first (D-10). Roles and companies CONFIRMED; dates and
// descriptions PENDING. Promotions are linked once via `promotedFrom` (D-15); no connector line (D-19).

import { pending } from './pending.ts';
import type { ExperienceContent } from './schema.ts';

export const experience: ExperienceContent = {
  roles: [
    {
      id: 'amplicomm-lead-ux-designer',
      role: 'Lead UX Designer',
      company: 'Amplicomm',
      start: pending('Start month/year'),
      end: pending('End month/year, or present'),
      description: pending('1–2 line description'),
      promotedFrom: 'amplicomm-ux-designer',
    },
    {
      id: 'amplicomm-ux-designer',
      role: 'UX Designer',
      company: 'Amplicomm',
      start: pending('Start month/year'),
      end: pending('End month/year'),
      description: pending('1–2 line description'),
    },
    {
      id: 'xebec-ui-designer-video-editor',
      role: 'UI Designer & Video Editor',
      company: 'Xebec Communications',
      start: pending('Start month/year'),
      end: pending('End month/year'),
      description: pending('1–2 line description'),
      promotedFrom: 'xebec-junior-visualizer',
    },
    {
      id: 'xebec-junior-visualizer',
      role: 'Junior Visualizer',
      company: 'Xebec Communications',
      start: pending('Start month/year'),
      end: pending('End month/year'),
      description: pending('1–2 line description'),
    },
    {
      id: 'internship',
      role: pending('Internship role title'),
      company: pending('Internship company'),
      start: pending('Start month/year'),
      end: pending('End month/year'),
      description: pending('1–2 line description'),
    },
  ],
  milestones: pending(
    'Journey "A few milestones" items (verified), each opening an image or document',
  ),
  emptyPanelDecision: pending(
    'Owner decision if there are no verified Journey milestones: hide the panel or add content (FR-J5)',
  ),
};
