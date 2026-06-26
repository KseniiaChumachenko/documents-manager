import { test, expect } from '@playwright/test';

import { waitForHydration } from './helpers';

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

test.describe('Documents Pages', () => {
  test('documents/invoices route renders document list', async ({ page }) => {
    await page.goto('/documents/invoices');
    await waitForHydration(page);

    // Should show the "New document" button
    await expect(page.getByRole('button', { name: 'Новий документ' })).toBeVisible();
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

  test('documents settings route is reachable', async ({ page }) => {
    const response = await page.goto('/documents/settings');

    expect(response?.status()).toBe(200);
  });
});
