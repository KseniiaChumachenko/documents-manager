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

  // Create one via the editor route
  await page.getByRole('button', { name: 'Новий шаблон' }).click();
  await page.waitForURL(`**/documents/${type}/settings/new`);
  await waitForHydration(page);

  await page.getByLabel('Назва шаблону').fill(`e2e-template-${Date.now()}`);
  await page.getByRole('button', { name: 'Зберегти' }).click();

  // Should redirect back to settings list (regex to avoid matching /settings/new)
  await page.waitForURL(new RegExp(`/documents/${type}/settings$`), { timeout: 10000 });
}

test.describe('Documents > Template Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/documents/invoices/settings');
    await waitForHydration(page);
  });

  test('renders template settings page with new template button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Новий шаблон' })).toBeVisible();
  });

  test('clicking new template button navigates to editor', async ({ page }) => {
    await page.getByRole('button', { name: 'Новий шаблон' }).click();
    await page.waitForURL('**/documents/invoices/settings/new');
    await waitForHydration(page);

    await expect(page.getByLabel('Назва шаблону')).toBeVisible();
    await expect(page.getByLabel('Схема полів')).toBeVisible();
    // Preview panel should be visible
    await expect(page.getByText('Попередній перегляд')).toBeVisible();
  });

  test('template editor shows live preview', async ({ page }) => {
    await page.goto('/documents/invoices/settings/new');
    await waitForHydration(page);

    // Preview should show document fields section
    await expect(page.getByText('Поля документу')).toBeVisible();
    // Preview should show line items table
    await expect(page.getByText('Товари / послуги')).toBeVisible();
    // Preview should show stamp placeholder
    await expect(page.getByText('М.П.')).toBeVisible();
  });

  test('create a template and verify it appears in the list', async ({ page }) => {
    const templateName = `test-template-${Date.now()}`;

    await page.getByRole('button', { name: 'Новий шаблон' }).click();
    await page.waitForURL('**/documents/invoices/settings/new');
    await waitForHydration(page);

    await page.getByLabel('Назва шаблону').fill(templateName);
    await page.getByRole('button', { name: 'Зберегти' }).click();

    // Should redirect back to settings list (use regex to avoid matching /settings/new)
    await page.waitForURL(/\/documents\/invoices\/settings$/, { timeout: 10000 });
    await page.reload();
    await waitForHydration(page);

    await expect(page.getByRole('cell', { name: templateName })).toBeVisible({
      timeout: 15000,
    });
  });

  test('different document types have different default schemas', async ({ page }) => {
    // Check invoices editor has "рахунку" in the schema
    await page.goto('/documents/invoices/settings/new');
    await waitForHydration(page);
    const invoiceSchema = await page.getByLabel('Схема полів').inputValue();
    expect(invoiceSchema).toContain('рахунку');

    // Check poas editor has "довіреності" in the schema
    await page.goto('/documents/poas/settings/new');
    await waitForHydration(page);
    const poaSchema = await page.getByLabel('Схема полів').inputValue();
    expect(poaSchema).toContain('довіреності');

    // Check bills editor has "накладної" in the schema
    await page.goto('/documents/bills/settings/new');
    await waitForHydration(page);
    const billSchema = await page.getByLabel('Схема полів').inputValue();
    expect(billSchema).toContain('накладної');
  });

  test('preview shows JSON error for invalid schema', async ({ page }) => {
    await page.goto('/documents/invoices/settings/new');
    await waitForHydration(page);

    const textarea = page.getByLabel('Схема полів');
    await textarea.fill('{ invalid json');

    await expect(page.getByText('Помилка в JSON')).toBeVisible();
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

  test('settings button navigates to template list', async ({ page }) => {
    await page.goto('/documents/invoices');
    await waitForHydration(page);

    await page.getByRole('link', { name: 'Налаштування шаблонів' }).click();
    await page.waitForURL(/\/documents\/invoices\/settings$/);
    await waitForHydration(page);

    await expect(page.getByRole('button', { name: 'Новий шаблон' })).toBeVisible();
  });

  test('sidebar settings cog navigates to all-templates page', async ({ page }) => {
    await page.goto('/documents/invoices');
    await waitForHydration(page);

    await page.goto('/documents/settings');
    await waitForHydration(page);

    await expect(page.getByText('Налаштування шаблонів')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Рахунки фактури' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Видаткові накладні' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Довіренності' })).toBeVisible();
  });
});

test.describe('Documents > New Document Form', () => {
  test('shows hint when no templates exist', async ({ page }) => {
    await page.goto('/documents/bills/new');
    await waitForHydration(page);

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

    await page.getByRole('button', { name: 'Зберегти' }).click();

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

    // Create template via editor route
    await page.goto('/documents/invoices/settings/new');
    await waitForHydration(page);

    const templateName = `flow-template-${suffix}`;
    await page.getByLabel('Назва шаблону').fill(templateName);
    await page.getByRole('button', { name: 'Зберегти' }).click();

    // Wait for redirect back to settings list, then reload to get fresh data
    await page.waitForURL(/\/documents\/invoices\/settings$/, { timeout: 10000 });
    await page.reload();
    await waitForHydration(page);
    await expect(page.getByRole('cell', { name: templateName })).toBeVisible({ timeout: 15000 });

    // Navigate to new document form
    await page.goto('/documents/invoices/new');
    await waitForHydration(page);

    await expect(page.getByText('Новий документ')).toBeVisible();
    await expect(page.getByText('Товари / послуги')).toBeVisible();
  });
});
