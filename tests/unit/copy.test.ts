import { describe, expect, it } from 'vitest';
import { pending, PENDING_LABEL } from '../../src/content/pending.ts';
import { approved, draft } from '../../src/content/schema.ts';
import { copyText } from '../../src/lib/copy.ts';

describe('copyText (AGENTS §5 PENDING rule)', () => {
  it('returns approved and draft wording as written', () => {
    expect(copyText(approved('Skip to work'))).toBe('Skip to work');
    expect(copyText(draft('Work'))).toBe('Work');
  });

  it('shows the visible PENDING marker, never invented text, for wording not yet supplied', () => {
    expect(copyText(pending('Menu button label'))).toBe(PENDING_LABEL);
  });
});
