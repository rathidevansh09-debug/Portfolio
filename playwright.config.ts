import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// macOS 27 workaround (Playwright issue #42768): the bundled Firefox resolves its app-data folder to
// ~/Library/Application Support/Firefox, which macOS 27 privacy protection (TCC) blocks, so Firefox
// exits with "Could not find profile folder." CFFIXED_USER_HOME gives Firefox a private, empty
// app-data location outside the project. Review and remove when upgrading to a Playwright version
// that bundles Firefox 158 or later (upstream fix; expected in Playwright 1.65).
const firefoxAppHome = join(tmpdir(), 'devansh-portfolio-playwright-firefox-home');
mkdirSync(firefoxAppHome, { recursive: true });

// Browser tests (ARCHITECTURE §11.4). Phase 3 adds the viewport presets, reduced-motion
// variant and reference-capture helpers. WebKit is supplementary: it is not Safari.
export default defineConfig({
  testDir: 'tests',
  testMatch: ['e2e/**/*.spec.ts', 'a11y/**/*.spec.ts'],
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: { env: { ...process.env, CFFIXED_USER_HOME: firefoxAppHome } },
      },
    },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
