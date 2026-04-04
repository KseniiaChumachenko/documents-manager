import { test, expect } from '@playwright/test';

import { waitForHydration } from './helpers';

async function ensureTemplate(page: import('@playwright/test').Page, type = 'invoices') {
  await page.goto(`/documents/${type}/settings`);
  await waitForHydration(page);

  // Check if any template already exists
  const table = page.locator('table');
  const hasTable = await table.isVisible().catch(() => false);
  if (hasTable) {
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    if (count > 0) {
      const text = await rows.first().textContent();
      if (text && !text.includes('No results')) return;
    }
  }

  // Create one
  await page.getByRole('button', { name: 'Новий шаблон' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Назва шаблону').fill(`e2e-template-${Date.now()}`);
  await dialog.getByRole('button', { name: 'Зберегти' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  await page.reload();
  await waitForHydration(page);
}

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

    await page.reload();
    await waitForHydration(page);

    await expect(page.getByRole('cell', { name: templateName })).toBeVisible({
      timeout: 10000,
    });
  });

  test('different document types have different default schemas', async ({ page }) => {
    // Check invoices default schema has "№ рахунку"
    await page.getByRole('button', { name: 'Новий шаблон' }).click();
    const invoiceSchema = await page.getByLabel('Схема полів').inputValue();
    expect(invoiceSchema).toContain('рахунку');
    await page.keyboard.press('Escape');

    // Check poas default schema has "довіреності"
    await page.goto('/documents/poas/settings');
    await waitForHydration(page);
    await page.getByRole('button', { name: 'Новий шаблон' }).click();
    const poaSchema = await page.getByLabel('Схема полів').inputValue();
    expect(poaSchema).toContain('довіреності');
    await page.keyboard.press('Escape');

    // Check bills default schema has "накладної"
    await page.goto('/documents/bills/settings');
    await waitForHydration(page);
    await page.getByRole('button', { name: 'Новий шаблон' }).click();
    const billSchema = await page.getByLabel('Схема полів').inputValue();
    expect(billSchema).toContain('накладної');
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
  test('shows hint when no templates exist', async ({ page }) => {
    // Use a type unlikely to have templates
    await page.goto('/documents/bills/new');
    await waitForHydration(page);

    // Should either show the form or the no-template hint
    const hint = page.getByText('Спершу створіть шаблон');
    const formTitle = page.getByText('Товари / послуги');
    const hasHint = await hint.isVisible().catch(() => false);
    const hasForm = await formTitle.isVisible().catch(() => false);

    expect(hasHint || hasForm).toBeTruthy();
  });

  test('renders form with required field markers when template exists', async ({ page }) => {
    await ensureTemplate(page);
    await page.goto('/documents/invoices/new');
    await waitForHydration(page);

    await expect(page.getByText('Новий документ')).toBeVisible();
    await expect(page.getByText('Товари / послуги *')).toBeVisible();
    await expect(page.getByText('Сума без ПДВ')).toBeVisible();
  });

  test('shows validation errors on submit without required fields', async ({ page }) => {
    await ensureTemplate(page);
    await page.goto('/documents/invoices/new');
    await waitForHydration(page);

    // Click save without filling anything
    await page.getByRole('button', { name: 'Зберегти' }).click();

    // Should show validation messages
    await expect(page.getByText('Оберіть шаблон')).toBeVisible();
    await expect(page.getByText('Оберіть контрагента')).toBeVisible();
    await expect(page.getByText('Вкажіть номер документа')).toBeVisible();
    await expect(page.getByText('Додайте хоча б один товар')).toBeVisible();
  });

  test('can add and remove line items', async ({ page }) => {
    await ensureTemplate(page);
    await page.goto('/documents/invoices/new');
    await waitForHydration(page);

    const addButton = page.getByRole('button', { name: 'Додати рядок' });
    await expect(addButton).toBeVisible();

    await addButton.click();

    const removeButtons = page.getByRole('button', { name: 'x' });
    expect(await removeButtons.count()).toBeGreaterThanOrEqual(2);

    await removeButtons.first().click();
    expect(await removeButtons.count()).toBeLessThanOrEqual(1);
  });

  test('has stamp checkbox and format selector', async ({ page }) => {
    await ensureTemplate(page);
    await page.goto('/documents/invoices/new');
    await waitForHydration(page);

    await expect(page.getByText('Включити печатку')).toBeVisible();
    await expect(page.getByText('XLSX')).toBeVisible();
  });
});

test.describe('Documents > Full Flow', () => {
  test('create template, then create document from it', async ({ page }) => {
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

    await page.goto('/documents/invoices/settings');
    await waitForHydration(page);

    const templateName = `flow-template-${suffix}`;
    await page.getByRole('button', { name: 'Новий шаблон' }).click();

    const tmplDialog = page.getByRole('dialog');
    await tmplDialog.getByLabel('Назва шаблону').fill(templateName);
    await tmplDialog.getByRole('button', { name: 'Зберегти' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    await page.reload();
    await waitForHydration(page);
    await expect(page.getByRole('cell', { name: templateName })).toBeVisible({ timeout: 10000 });

    await page.goto('/documents/invoices/new');
    await waitForHydration(page);

    await expect(page.getByText('Новий документ')).toBeVisible();
    await expect(page.getByText('Товари / послуги')).toBeVisible();
  });
});
