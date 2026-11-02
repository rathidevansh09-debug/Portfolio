import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** WCAG 2.2 AA target (PRD §9.3; ARCHITECTURE §10): all A and AA rules up to WCAG 2.2. */
export const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const;

export interface A11yCheckOptions {
  /** Limit the scan to these selectors (e.g. one section, or an open pop-up). */
  readonly include?: readonly string[];
  /** Skip these selectors. Each use needs a documented reason. */
  readonly exclude?: readonly string[];
}

/** Runs axe-core with the WCAG A/AA rule set and fails with a readable list of violations. */
export async function expectNoA11yViolations(
  page: Page,
  options: A11yCheckOptions = {},
): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags([...WCAG_AA_TAGS]);
  for (const selector of options.include ?? []) builder = builder.include(selector);
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector);

  const { violations } = await builder.analyze();
  const summary = violations.map(
    (v) =>
      `${v.id} [${v.impact ?? 'unknown'}] ${v.help} — ${v.nodes.length} node(s): ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(' '))
        .join(' | ')}`,
  );
  expect(summary, 'axe WCAG A/AA violations').toEqual([]);
}
