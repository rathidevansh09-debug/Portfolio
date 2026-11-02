// Small formatting helpers (ARCHITECTURE §2.3 lib/format.ts).

import type { YearMonth } from '../content/schema.ts';

/** Two-digit index for cards, milestones and steps: 1 → "01" (FR-W4). */
export function twoDigit(n: number): string {
  return String(n).padStart(2, '0');
}

/** Fills `{name}` placeholders in UI copy. Unknown placeholders are left visible. */
export function fillTemplate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Mar 2024", or "2024" when no month is given. Case is applied by CSS. */
export function formatYearMonth(value: YearMonth): string {
  const month = value.month ? MONTHS[value.month - 1] : undefined;
  return month ? `${month} ${value.year}` : String(value.year);
}

/** "Mar 2022 – Jan 2024", or "Mar 2022 – <presentLabel>" for a current role. */
export function formatDateRange(
  start: YearMonth,
  end: YearMonth | 'present',
  presentLabel: string,
): string {
  const to = end === 'present' ? presentLabel : formatYearMonth(end);
  return `${formatYearMonth(start)} – ${to}`;
}
