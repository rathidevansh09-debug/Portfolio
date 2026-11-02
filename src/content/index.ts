// All site content in one typed object (ARCHITECTURE §4.1). Components import from here.

import { about } from './about.ts';
import { brands } from './brands.ts';
import { breakdown } from './breakdown.ts';
import { contact } from './contact.ts';
import { experience } from './experience.ts';
import { filters } from './filters.ts';
import { impact } from './impact.ts';
import { profile } from './profile.ts';
import { projectIndex, projects } from './projects/index.ts';
import type { PortfolioContent } from './schema.ts';
import { site } from './site.ts';
import { ui } from './ui.ts';

export const content: PortfolioContent = {
  site,
  ui,
  profile,
  projects,
  projectIndex,
  filters,
  brands,
  impact,
  breakdown,
  about,
  experience,
  contact,
};
