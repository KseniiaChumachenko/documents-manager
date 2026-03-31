import { test, expect } from '@playwright/test';

test.describe('Navigation & Layout', () => {
  test('renders sidebar with app branding', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('[data-slot="sidebar"]');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText('AeroClime')).toBeVisible();
  });

  test('sidebar contains all top-level navigation items', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('[data-slot="sidebar"]');

    // Top-level items (Ukrainian labels from i18n)
    await expect(sidebar.getByText('Головна')).toBeVisible();
    await expect(sidebar.getByText('Документи')).toBeVisible();
    await expect(sidebar.getByText('Бібліотека')).toBeVisible();
  });

  test('sidebar contains Documents sub-navigation items', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('[data-slot="sidebar"]');

    await expect(sidebar.getByText('Довіренності')).toBeVisible();
    await expect(sidebar.getByText('Видаткові накладні')).toBeVisible();
    await expect(sidebar.getByText('Рахунки фактури')).toBeVisible();
  });

  test('sidebar contains Library sub-navigation items', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('[data-slot="sidebar"]');

    await expect(sidebar.getByText('Покупці')).toBeVisible();
    await expect(sidebar.getByText('Продавці')).toBeVisible();
    await expect(sidebar.getByText('Товари')).toBeVisible();
  });

  test('sidebar shows user footer section', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('[data-slot="sidebar"]');
    const footer = sidebar.locator('[data-slot="sidebar-footer"]');
    await expect(footer).toBeVisible();

    // The user button shows "Default" when no CF auth header
    await expect(footer.getByText('Default')).toBeVisible();
  });

  test('navigating to home page via sidebar', async ({ page }) => {
    await page.goto('/library/items');
    await page.locator('[data-slot="sidebar"]').getByText('Головна').click();

    await expect(page).toHaveURL('/');
  });

  test('navigating to library items via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-slot="sidebar"]').getByText('Товари').click();

    await expect(page).toHaveURL('/library/items');
  });

  test('navigating to library clients via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-slot="sidebar"]').getByText('Покупці').click();

    await expect(page).toHaveURL('/library/client');
  });

  test('navigating to library sources via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-slot="sidebar"]').getByText('Продавці').click();

    await expect(page).toHaveURL('/library/source');
  });

  test('navigating to library settings via sidebar gear icon', async ({ page }) => {
    await page.goto('/');

    // The settings action link for Library
    await page.locator('a[href="/library/settings"]').click();

    await expect(page).toHaveURL('/library/settings');
  });

  test('navigating to documents sub-pages via sidebar', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-slot="sidebar"]').getByText('Довіренності').click();
    await expect(page).toHaveURL('/documents/poas');

    await page.locator('[data-slot="sidebar"]').getByText('Видаткові накладні').click();
    await expect(page).toHaveURL('/documents/bills');

    await page.locator('[data-slot="sidebar"]').getByText('Рахунки фактури').click();
    await expect(page).toHaveURL('/documents/invoices');
  });

  test('layout has sidebar and main content area', async ({ page }) => {
    await page.goto('/');

    // The flex layout container
    const layout = page.locator('div.flex').first();
    await expect(layout).toBeVisible();

    // Sidebar exists
    await expect(page.locator('[data-slot="sidebar"]')).toBeVisible();

    // Main content area with padding
    await expect(page.locator('div.p-4.w-full')).toBeVisible();
  });
});
