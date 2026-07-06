import { defineConfig } from '@playwright/test';

// Dual-mode, mirroring the API E2E convention:
//   - PR-time gate: no TEST_BASE_URL → Playwright starts the app locally (webServer) and tests localhost.
//   - post-deploy gate: TEST_BASE_URL=<live staging URL> → tests the live deployment, no local server.
const baseURL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './test/e2e-ui',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 2,
  reporter: [['list'], ['json', { outputFile: 'ui-e2e-result.json' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  // Start a local server ONLY when not targeting a live URL.
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: 'npm run build && npm start',
        url: 'http://localhost:3000/healthz',
        timeout: 60_000,
        reuseExistingServer: false,
      },
});
