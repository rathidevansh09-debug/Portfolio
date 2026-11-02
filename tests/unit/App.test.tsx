import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import App from '../../src/App.tsx';

// Phase 1 sample: proves Vitest + jsdom + Testing Library + React 19 work together.
describe('App (Phase 1 shell)', () => {
  it('renders a main landmark', () => {
    const { container } = render(<App />);
    expect(container.querySelector('main')).not.toBeNull();
  });
});
