// Runtime content validation for rules a type cannot express (ARCHITECTURE §4.1 rule 2).
// Used by unit tests and the launch check. Returns readable error messages with the content path.

import { isPending } from './pending.ts';
import {
  FACT_KEYS,
  FILTER_KEYS,
  type PortfolioContent,
  type Project,
  type Role,
} from './schema.ts';

/** Visits every value in a content tree with its dotted path. Does not descend into Pending. */
export function walk(
  value: unknown,
  path: string,
  visit: (value: unknown, path: string) => void,
): void {
  visit(value, path);
  if (isPending(value) || value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, `${path}[${i}]`, visit));
    return;
  }
  for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`, visit);
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateMedia(root: unknown, rootPath: string, errors: string[]): void {
  walk(root, rootPath, (v, path) => {
    if (!isRecord(v)) return;
    if (v.kind === 'image') {
      const alt = typeof v.alt === 'string' ? v.alt.trim() : '';
      if (v.decorative !== true && alt === '') errors.push(`${path}: image has no alt text`);
      if (v.decorative === true && alt !== '') {
        errors.push(`${path}: decorative image must have empty alt text`);
      }
    }
    if (v.kind === 'video') {
      const source = isRecord(v.source) ? v.source : {};
      if (typeof v.hasSpeech !== 'boolean') {
        errors.push(`${path}: video must set hasSpeech explicitly`);
      } else if (v.hasSpeech && source.type === 'local' && !isRecord(v.captionsFile)) {
        errors.push(`${path}: local video with speech has no captions file (A-10)`);
      } else if (v.hasSpeech && source.type !== 'local' && v.platformCaptionsConfirmed !== true) {
        errors.push(
          `${path}: embedded video with speech has no confirmed platform captions (A-10)`,
        );
      }
    }
  });
}

function validateProject(p: Project, path: string, errors: string[]): void {
  if (!SLUG.test(p.slug)) errors.push(`${path}.slug: "${p.slug}" is not kebab-case`);
  if (p.title.trim() === '') errors.push(`${path}.title: empty`);
  if (!isPending(p.tags)) {
    const unknown = p.tags.filter((t) => !(FILTER_KEYS as readonly string[]).includes(t));
    if (unknown.length) errors.push(`${path}.tags: unknown tag(s) ${unknown.join(', ')}`);
    if (new Set(p.tags).size !== p.tags.length) errors.push(`${path}.tags: duplicate tag`);
  }
  if (!isPending(p.facts)) {
    const extra = Object.keys(p.facts).filter((k) => !(FACT_KEYS as readonly string[]).includes(k));
    if (extra.length)
      errors.push(`${path}.facts: unknown fact field(s) ${extra.join(', ')} (D-22)`);
  }
  validateMedia(p, path, errors);
}

function validateRoles(roles: readonly Role[], errors: string[]): void {
  const ids = new Map<string, Role>();
  for (const r of roles) {
    if (ids.has(r.id)) errors.push(`experience.roles: duplicate id ${r.id}`);
    ids.set(r.id, r);
  }
  for (const r of roles) {
    if (r.promotedFrom === undefined) continue;
    const previous = ids.get(r.promotedFrom);
    if (!previous) {
      errors.push(`experience.roles.${r.id}.promotedFrom: no role "${r.promotedFrom}"`);
    } else if (
      !isPending(r.company) &&
      !isPending(previous.company) &&
      r.company !== previous.company
    ) {
      errors.push(`experience.roles.${r.id}.promotedFrom: previous role is at another company`);
    }
  }
}

export function validateContent(c: PortfolioContent): string[] {
  const errors: string[] = [];

  const slugs = c.projects.map((p) => p.slug);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length) errors.push(`projects: duplicate slug(s) ${dupes.join(', ')}`);
  c.projects.forEach((p) => validateProject(p, `projects.${p.slug}`, errors));

  for (const slug of c.projectIndex.featured) {
    if (!slugs.includes(slug)) errors.push(`projectIndex.featured: unknown project "${slug}"`);
  }
  if (new Set(c.projectIndex.featured).size !== c.projectIndex.featured.length) {
    errors.push('projectIndex.featured: duplicate project');
  }
  if (!isPending(c.projectIndex.displayOrder)) {
    const order = c.projectIndex.displayOrder;
    const missing = slugs.filter((s) => !order.includes(s));
    const unknown = order.filter((s) => !slugs.includes(s));
    if (missing.length) errors.push(`projectIndex.displayOrder: missing ${missing.join(', ')}`);
    if (unknown.length) errors.push(`projectIndex.displayOrder: unknown ${unknown.join(', ')}`);
    if (new Set(order).size !== order.length) errors.push('projectIndex.displayOrder: duplicate');
  }

  const filterKeys = c.filters.map((f) => f.key);
  if (
    filterKeys.length !== FILTER_KEYS.length ||
    FILTER_KEYS.some((k) => !filterKeys.includes(k))
  ) {
    errors.push('filters: must list each approved filter exactly once (D-03)');
  }

  if (!isPending(c.profile.stats) && c.profile.stats.length > 3) {
    errors.push('profile.stats: at most three stats (FR-HE6)');
  }
  if (c.about.processSteps.length !== 5) errors.push('about.processSteps: must be five (D-13)');
  validateRoles(c.experience.roles, errors);

  validateMedia(c.profile, 'profile', errors);
  validateMedia(c.brands, 'brands', errors);
  validateMedia(c.impact, 'impact', errors);
  validateMedia(c.breakdown, 'breakdown', errors);
  validateMedia(c.about, 'about', errors);
  validateMedia(c.experience, 'experience', errors);
  validateMedia(c.site, 'site', errors);

  return errors;
}
