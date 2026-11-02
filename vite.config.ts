import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { imagetools } from 'vite-imagetools';

// Build: React + build-time responsive images (ARCHITECTURE §1.1, §8.1).
// Test: Vitest unit/component tests run in jsdom (ARCHITECTURE §11.4).
export default defineConfig({
  plugins: [react(), imagetools()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/unit/setup.ts'],
  },
});
