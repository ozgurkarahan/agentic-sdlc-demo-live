import { randomUUID } from 'node:crypto';
import { type Page, expect, test } from '@playwright/test';

async function deleteTodoByTitle(page: Page, title: string): Promise<void> {
  const item = page.locator('li', { hasText: title }).first();
  if ((await item.count()) > 0) {
    await item.getByRole('button', { name: 'Delete' }).click();
  }
}

test('todo UI supports add, toggle, and delete without assuming empty list', async ({ page }) => {
  const marker = `ui-e2e-${randomUUID()}`;

  await page.goto('/');

  await page.getByLabel('Title').fill(marker);
  await page.getByRole('button', { name: 'Add' }).click();

  const item = page.locator('li', { hasText: marker }).first();
  await expect(item).toBeVisible();

  const checkbox = item.getByRole('checkbox');
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await expect(checkbox).toBeChecked();

  await item.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('li', { hasText: marker })).toHaveCount(0);
});

test('todo titles are rendered as inert text (xss-safe)', async ({ page }) => {
  const payload = '<img src=x onerror="window.__xss=1;alert(\'xss\')">';
  let dialogTriggered = false;

  page.on('dialog', async (dialog) => {
    dialogTriggered = true;
    await dialog.dismiss();
  });

  await page.goto('/');
  await page.getByLabel('Title').fill(payload);
  await page.getByRole('button', { name: 'Add' }).click();

  const item = page.locator('li', { hasText: payload }).first();
  await expect(item).toBeVisible();
  await expect(item.getByText(payload, { exact: true })).toBeVisible();
  await expect.poll(async () =>
    page.evaluate(() => (globalThis as typeof globalThis & { __xss?: unknown }).__xss),
  ).toBeUndefined();
  expect(dialogTriggered).toBe(false);

  await deleteTodoByTitle(page, payload);
});

test('gracefully handles partial failures without crashing (PR-time)', async ({ page }) => {
  test.skip(Boolean(process.env.TEST_BASE_URL), 'route interception is PR-time only');

  const marker = `ui-failure-${randomUUID()}`;
  let failedInitialGet = false;

  await page.route('**/api/todos', async (route) => {
    if (!failedInitialGet && route.request().method() === 'GET') {
      failedInitialGet = true;
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' });
      return;
    }
    await route.continue();
  });

  await page.goto('/');
  await expect(page.getByText('Failed to load todos.')).toBeVisible();

  await page.getByLabel('Title').fill(marker);
  await page.getByRole('button', { name: 'Add' }).click();

  const item = page.locator('li', { hasText: marker }).first();
  await expect(item).toBeVisible();
  await expect(page.getByText('Failed to load todos.')).toHaveCount(0);

  await deleteTodoByTitle(page, marker);
});
