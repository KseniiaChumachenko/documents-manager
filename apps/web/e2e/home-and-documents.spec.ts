import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('renders home page with greeting message', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Hello, home!')).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Головна');
  });
});

test.describe('Documents Pages (stubs)', () => {
  // Note: /documents parent route has no <Outlet>, so child routes
  // don't render their own content — only the parent "Hello, home!" shows.

  test('documents index page renders', async ({ page }) => {
    await page.goto('/documents');

    await expect(page.getByText('Hello, home!')).toBeVisible();
  });

  test('documents/poas route is reachable', async ({ page }) => {
    const response = await page.goto('/documents/poas');

    expect(response?.status()).toBe(200);
  });

  test('documents/bills route is reachable', async ({ page }) => {
    const response = await page.goto('/documents/bills');

    expect(response?.status()).toBe(200);
  });

  test('documents/invoices route is reachable', async ({ page }) => {
    const response = await page.goto('/documents/invoices');

    expect(response?.status()).toBe(200);
  });

  test('documents type settings route is reachable', async ({ page }) => {
    const response = await page.goto('/documents/poas/settings');

    expect(response?.status()).toBe(200);
  });

  test('documents individual document route is reachable', async ({ page }) => {
    const response = await page.goto('/documents/poas/123');

    expect(response?.status()).toBe(200);
  });
});
