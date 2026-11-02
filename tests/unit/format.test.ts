import { describe, expect, it } from 'vitest';
import { fillTemplate, formatDateRange, formatYearMonth, twoDigit } from '../../src/lib/format.ts';

describe('format helpers', () => {
  it('pads indexes to two digits (FR-W4)', () => {
    expect([1, 9, 10, 12].map(twoDigit)).toEqual(['01', '09', '10', '12']);
  });

  it('fills {placeholders} and leaves unknown ones visible', () => {
    expect(fillTemplate('{shown} of {total} projects', { shown: 9, total: 20 })).toBe(
      '9 of 20 projects',
    );
    expect(fillTemplate("No work found for '{query}'.", {})).toBe("No work found for '{query}'.");
  });

  it('formats months and date ranges, with the present label supplied by content', () => {
    expect(formatYearMonth({ year: 2024, month: 3 })).toBe('Mar 2024');
    expect(formatYearMonth({ year: 2024 })).toBe('2024');
    expect(formatDateRange({ year: 2022, month: 1 }, { year: 2024, month: 12 }, 'X')).toBe(
      'Jan 2022 – Dec 2024',
    );
    expect(formatDateRange({ year: 2025 }, 'present', 'Present')).toBe('2025 – Present');
  });
});
