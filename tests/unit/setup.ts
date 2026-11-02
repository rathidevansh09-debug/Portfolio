import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Testing Library only auto-cleans when Vitest globals are enabled; they are not, so unmount
// rendered components after every test to keep tests independent.
afterEach(() => {
  cleanup();
});
