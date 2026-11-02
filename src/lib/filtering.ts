// Selected Work filtering, search and "show more" (ARCHITECTURE §4.6; PRD FR-W1–W7, D-03).
// Pure functions: the Selected Work section keeps the UI state and calls these.

import { isPending } from '../content/pending.ts';
import type { Filter, FilterKey, Project, ProjectIndex } from '../content/schema.ts';

/** Projects shown per page in "All" mode; "Show more" adds another page (FR-W6). */
export const PAGE_SIZE = 9;

export type FilterChoice = 'all' | FilterKey;
export type WorkMode = 'selected' | 'all';

const tagsOf = (p: Project): readonly FilterKey[] => (isPending(p.tags) ? [] : p.tags);

/** Filter tabs to show: only filters at least one (published) project carries (FR-W2). */
export function availableFilters(
  projects: readonly Project[],
  filters: readonly Filter[],
): Filter[] {
  return filters.filter((f) => projects.some((p) => tagsOf(p).includes(f.key)));
}

/** A project appears under every filter whose tag it carries; "All" shows everything. */
export function matchesFilter(project: Project, choice: FilterChoice): boolean {
  return choice === 'all' || tagsOf(project).includes(choice);
}

/** Case-insensitive search over title, tag labels and client (FR-W3). */
export function matchesSearch(
  project: Project,
  query: string,
  filters: readonly Filter[],
): boolean {
  const q = query.trim().toLocaleLowerCase();
  if (q === '') return true;
  const labels = tagsOf(project).map((t) => filters.find((f) => f.key === t)?.label ?? '');
  const client = isPending(project.client) || project.client === null ? '' : project.client;
  return [project.title, client, ...labels].some((text) => text.toLocaleLowerCase().includes(q));
}

/**
 * Full list in the owner's display order. While that order is PENDING (FR-W9) the content-file
 * order is used for development review only; the launch check blocks publishing until it is set.
 */
export function orderProjects(projects: readonly Project[], index: ProjectIndex): Project[] {
  if (isPending(index.displayOrder)) return [...projects];
  const order = index.displayOrder;
  return [...projects].sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
}

/** Featured projects in their confirmed order (DS-4), limited to those that may be shown. */
export function featuredProjects(projects: readonly Project[], index: ProjectIndex): Project[] {
  return index.featured.flatMap((slug) => projects.filter((p) => p.slug === slug));
}

export interface BrowseInput {
  readonly projects: readonly Project[];
  readonly index: ProjectIndex;
  readonly filters: readonly Filter[];
  readonly mode: WorkMode;
  readonly filter: FilterChoice;
  readonly query: string;
  /** How many results are currently revealed in "All" mode (a multiple of PAGE_SIZE). */
  readonly revealed: number;
}

export interface BrowseResult {
  readonly items: Project[];
  /** Number of matching projects in the current mode. */
  readonly total: number;
  readonly hasMore: boolean;
}

/**
 * "Selected" mode: the featured projects. "All" mode: the full ordered list, PAGE_SIZE at a time.
 * Filter and search apply in both modes. Callers reset `revealed` to PAGE_SIZE whenever the
 * filter or search changes, so results start from the beginning (FR-W7).
 */
export function browse(input: BrowseInput): BrowseResult {
  const base =
    input.mode === 'selected'
      ? featuredProjects(input.projects, input.index)
      : orderProjects(input.projects, input.index);
  const matching = base.filter(
    (p) => matchesFilter(p, input.filter) && matchesSearch(p, input.query, input.filters),
  );
  const items = input.mode === 'all' ? matching.slice(0, Math.max(0, input.revealed)) : matching;
  return { items, total: matching.length, hasMore: items.length < matching.length };
}

/** Next "Show more" step: another PAGE_SIZE results (FR-W6). */
export function revealMore(revealed: number): number {
  return revealed + PAGE_SIZE;
}
