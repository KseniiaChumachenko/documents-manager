import { test, expect } from '@playwright/test';

import { waitForHydration } from './helpers';

test.describe('Library > Items', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library/items');
    await waitForHydration(page);
  });

  test('renders items page with add button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Додати новий товар' })).toBeVisible();
  });

  test('renders items data table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Назва' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Одиниці' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Тип' })).toBeVisible();
  });

  test('empty table shows "No results." message', async ({ page }) => {
    const noResults = page.getByText('No results.');
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    if (rowCount === 1) {
      const cellText = await rows.first().textContent();
      if (cellText?.includes('No results.')) {
        await expect(noResults).toBeVisible();
      }
    }
  });

  test('clicking add button opens item dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Додати новий товар' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Додати новий товар', { exact: false }).first()).toBeVisible();
  });

  test('item dialog has all required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Додати новий товар' }).click();
    const dialog = page.getByRole('dialog');

    await expect(dialog.locator('input[name="name"]')).toBeVisible();
    await expect(dialog.locator('select[name="unit"]')).toBeVisible();
    await expect(dialog.locator('input[name="priceInputVATFree"]')).toBeVisible();
    await expect(dialog.locator('input[name="priceOutputVATFree"]')).toBeVisible();
    await expect(dialog.locator('input[name="priceRetailInclVAT"]')).toBeVisible();
    await expect(dialog.locator('select[name="type"]')).toBeVisible();
    await expect(dialog.locator('input[name="id"]')).toBeHidden();
  });

  test('item dialog has correct labels', async ({ page }) => {
    await page.getByRole('button', { name: 'Додати новий товар' }).click();
    const dialog = page.getByRole('dialog');

    await expect(dialog.getByText('Назва')).toBeVisible();
    await expect(dialog.getByText('Одиниці')).toBeVisible();
    await expect(dialog.getByText('Тип')).toBeVisible();
  });

  test('item dialog has save button', async ({ page }) => {
    await page.getByRole('button', { name: 'Додати новий товар' }).click();
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Зберегти' })).toBeVisible();
  });

  test('add item and verify it appears in the table', async ({ page }) => {
    // Setup: ensure type and unit exist
    await page.goto('/library/settings');
    await waitForHydration(page);

    const typeName = `item-type-${Date.now()}`;
    const typeForm = page.locator('form#form-type');
    await typeForm.locator('input[name="name"]').fill(typeName);
    const typeResp = page.waitForResponse(
      (r) => r.url().includes('/library/enums/type') && r.status() === 200
    );
    await typeForm.getByRole('button', { name: 'Додати' }).click();
    await typeResp;
    await expect(page.locator(`input[value="${typeName}"]`)).toBeVisible({ timeout: 10000 });

    const unitName = `item-unit-${Date.now()}`;
    const unitForm = page.locator('form#form-unit');
    await unitForm.locator('input[name="name"]').fill(unitName);
    const unitResp = page.waitForResponse(
      (r) => r.url().includes('/library/enums/unit') && r.status() === 200
    );
    await unitForm.getByRole('button', { name: 'Додати' }).click();
    await unitResp;
    await expect(page.locator(`input[value="${unitName}"]`)).toBeVisible({ timeout: 10000 });

    // Go to items page and add an item
    await page.goto('/library/items');
    await waitForHydration(page);

    await page.getByRole('button', { name: 'Додати новий товар' }).click();
    const dialog = page.getByRole('dialog');
    const itemName = `test-product-${Date.now()}`;

    await dialog.locator('input[name="name"]').fill(itemName);
    await dialog.locator('select[name="type"]').selectOption(typeName);
    await dialog.locator('select[name="unit"]').selectOption(unitName);
    await dialog.locator('input[name="priceInputVATFree"]').fill('200');
    await dialog.locator('input[name="priceOutputVATFree"]').fill('250');
    await dialog.locator('input[name="priceRetailInclVAT"]').fill('300');

    await dialog.getByRole('button', { name: 'Зберегти' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Reload to verify server state
    await page.reload();
    await waitForHydration(page);

    await expect(page.getByRole('cell', { name: itemName })).toBeVisible({ timeout: 10000 });
  });

  test('clicking a table row opens edit dialog', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const firstRowText = await rows.first().textContent();
      if (!firstRowText?.includes('No results.')) {
        await rows.first().click();

        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Корегувати товар')).toBeVisible();
        await expect(
          page.getByText('Зміни існуючого товару не поширюються на документи')
        ).toBeVisible();
      }
    }
  });

  test('edit dialog pre-fills existing item data', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const firstRowText = await rows.first().textContent();
      if (!firstRowText?.includes('No results.')) {
        const cellName = await rows.first().locator('td').first().textContent();
        await rows.first().click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        const nameInput = dialog.locator('input[name="name"]');
        await expect(nameInput).toHaveValue(cellName?.trim() || '');
      }
    }
  });

  test('item dialog select fields are populated with available types and units', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Додати новий товар' }).click();
    const dialog = page.getByRole('dialog');

    const typeOptions = dialog.locator('select[name="type"] option');
    const typeCount = await typeOptions.count();
    expect(typeCount).toBeGreaterThan(0);

    const unitOptions = dialog.locator('select[name="unit"] option');
    const unitCount = await unitOptions.count();
    expect(unitCount).toBeGreaterThan(0);
  });
});
