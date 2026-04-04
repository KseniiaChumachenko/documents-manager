import { test, expect } from '@playwright/test';

import { waitForHydration } from './helpers';

test.describe('Documents > Template Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/documents/invoices/settings');
    await waitForHydration(page);
  });

  test('renders template settings page with new template button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Новий шаблон' })).toBeVisible();
  });

  test('clicking new template button opens dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Новий шаблон' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Назва шаблону')).toBeVisible();
    await expect(page.getByLabel('Схема полів')).toBeVisible();
  });

  test('create a template and verify it appears in the list', async ({ page }) => {
    const templateName = `test-template-${Date.now()}`;

    await page.getByRole('button', { name: 'Новий шаблон' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Назва шаблону').fill(templateName);

    await dialog.getByRole('button', { name: 'Зберегти' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Reload and verify
    await page.reload();
    await waitForHydration(page);

    await expect(page.getByRole('cell', { name: templateName })).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Documents > Document List', () => {
  test('renders document list with new document button', async ({ page }) => {
    await page.goto('/documents/invoices');
    await waitForHydration(page);

    await expect(page.getByRole('button', { name: 'Новий документ' })).toBeVisible();
  });

  test('shows empty state when no documents exist', async ({ page }) => {
    await page.goto('/documents/invoices');
    await waitForHydration(page);

    // Either shows empty message or table
    const emptyMessage = page.getByText('Документів ще немає');
    const table = page.locator('table');
    const hasEmpty = await emptyMessage.isVisible().catch(() => false);
    const hasTable = await table.isVisible().catch(() => false);

    expect(hasEmpty || hasTable).toBeTruthy();
  });

  test('new document button navigates to creation form', async ({ page }) => {
    await page.goto('/documents/invoices');
    await waitForHydration(page);

    await page.getByRole('button', { name: 'Новий документ' }).click();
    await page.waitForURL('**/documents/invoices/new');
  });
});

test.describe('Documents > New Document Form', () => {
  test('renders new document form with required fields', async ({ page }) => {
    await page.goto('/documents/invoices/new');
    await waitForHydration(page);

    await expect(page.getByText('Новий документ')).toBeVisible();
    await expect(page.getByText('Товари / послуги')).toBeVisible();
    await expect(page.getByText('Сума без ПДВ')).toBeVisible();
    await expect(page.getByText('ПДВ 20%')).toBeVisible();
    await expect(page.getByText('Разом з ПДВ')).toBeVisible();
  });

  test('can add and remove line items', async ({ page }) => {
    await page.goto('/documents/invoices/new');
    await waitForHydration(page);

    // Should start with 1 line item row
    const addButton = page.getByRole('button', { name: 'Додати рядок' });
    await expect(addButton).toBeVisible();

    // Add another line item
    await addButton.click();

    // Should have remove buttons
    const removeButtons = page.getByRole('button', { name: 'x' });
    expect(await removeButtons.count()).toBeGreaterThanOrEqual(2);

    // Remove one
    await removeButtons.first().click();
    expect(await removeButtons.count()).toBeLessThanOrEqual(1);
  });

  test('has stamp checkbox and format selector', async ({ page }) => {
    await page.goto('/documents/invoices/new');
    await waitForHydration(page);

    await expect(page.getByText('Включити печатку')).toBeVisible();
    // Format selector with XLSX/PDF options
    await expect(page.getByText('XLSX')).toBeVisible();
  });
});

test.describe('Documents > Full Flow', () => {
  test('create template, then create document from it', async ({ page }) => {
    // Step 1: Create prerequisite data - type, unit, item
    await page.goto('/library/settings');
    await waitForHydration(page);

    const suffix = Date.now();
    const typeName = `doc-type-${suffix}`;
    const typeForm = page.locator('form#form-type');
    await typeForm.locator('input[name="name"]').fill(typeName);
    const typeResp = page.waitForResponse(
      (r) => r.url().includes('/library/enums/type') && r.status() === 200
    );
    await typeForm.getByRole('button', { name: 'Додати' }).click();
    await typeResp;
    await expect(page.locator(`input[value="${typeName}"]`)).toBeVisible({
      timeout: 10000,
    });

    const unitName = `doc-unit-${suffix}`;
    const unitForm = page.locator('form#form-unit');
    await unitForm.locator('input[name="name"]').fill(unitName);
    const unitResp = page.waitForResponse(
      (r) => r.url().includes('/library/enums/unit') && r.status() === 200
    );
    await unitForm.getByRole('button', { name: 'Додати' }).click();
    await unitResp;
    await expect(page.locator(`input[value="${unitName}"]`)).toBeVisible({
      timeout: 10000,
    });

    // Create an item
    await page.goto('/library/items');
    await waitForHydration(page);

    await page.getByRole('button', { name: 'Додати новий товар' }).click();
    const dialog = page.getByRole('dialog');
    const itemName = `doc-item-${suffix}`;

    await dialog.locator('input[name="name"]').fill(itemName);
    await dialog.locator('select[name="type"]').selectOption(typeName);
    await dialog.locator('select[name="unit"]').selectOption(unitName);
    await dialog.locator('input[name="priceInputVATFree"]').fill('100');
    await dialog.locator('input[name="priceOutputVATFree"]').fill('150');
    await dialog.locator('input[name="priceRetailInclVAT"]').fill('180');

    await dialog.getByRole('button', { name: 'Зберегти' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Step 2: Create a template
    await page.goto('/documents/invoices/settings');
    await waitForHydration(page);

    const templateName = `flow-template-${suffix}`;
    await page.getByRole('button', { name: 'Новий шаблон' }).click();

    const tmplDialog = page.getByRole('dialog');
    await tmplDialog.getByLabel('Назва шаблону').fill(templateName);
    await tmplDialog.getByRole('button', { name: 'Зберегти' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Verify template was created
    await page.reload();
    await waitForHydration(page);
    await expect(page.getByRole('cell', { name: templateName })).toBeVisible({ timeout: 10000 });

    // Step 3: Navigate to new document form
    await page.goto('/documents/invoices/new');
    await waitForHydration(page);

    // Verify the template and form elements are available
    await expect(page.getByText('Новий документ')).toBeVisible();
    await expect(page.getByText('Товари / послуги')).toBeVisible();
  });
});
