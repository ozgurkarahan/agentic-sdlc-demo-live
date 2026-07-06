import { defineConfig } from 'vitest/config';

// Scope vitest to the API unit/e2e suites so it never tries to run the Playwright UI specs
// (test/e2e-ui/*.spec.ts), which use @playwright/test — not vitest. Without this, `vitest run test/e2e`
// substring-matches `test/e2e-ui/` and breaks.
export default defineConfig({
  test: {
    include: ['test/unit/**/*.test.ts', 'test/e2e/**/*.test.ts'],
  },
});
