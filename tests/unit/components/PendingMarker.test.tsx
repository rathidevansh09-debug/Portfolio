import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PendingMarker } from '../../../src/components/PendingMarker/PendingMarker.tsx';
import { PENDING_LABEL } from '../../../src/content/pending.ts';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('PendingMarker (owner decision 3, Phase 9)', () => {
  it('development: a visible PENDING placeholder with the note', () => {
    const { container } = render(<PendingMarker note="Test note" />);
    expect(container.textContent).toBe(`${PENDING_LABEL}Test note`);
    expect(container.querySelector('[data-pending]')).not.toBeNull();
  });

  it('production: renders nothing', () => {
    vi.stubEnv('DEV', false);
    const { container } = render(<PendingMarker note="Test note" variant="fill" />);
    expect(container.innerHTML).toBe('');
  });
});
