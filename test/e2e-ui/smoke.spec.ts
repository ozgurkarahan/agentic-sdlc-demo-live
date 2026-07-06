import { test, expect } from '@playwright/test';

// Minimal PASSING smoke so the PR-time gate is armed BEFORE the UI exists. Uses Playwright's request
// fixture (no page needed) to assert the service is reachable. The real UI specs arrive with U-D1.
test('healthz is reachable (Playwright smoke)', async ({ request }) => {
  const res = await request.get('/healthz');
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: 'ok' });
});
