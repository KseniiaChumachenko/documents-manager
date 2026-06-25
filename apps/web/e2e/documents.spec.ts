import zlib from 'node:zlib';

import { test, expect } from '@playwright/test';

import { waitForHydration } from './helpers';

/** Build a valid NxN RGB PNG buffer (proper IDAT) for stamp-upload tests. */
function makePngBuffer(n: number): Buffer {
  const crc = (buf: Buffer) => {
    let c = ~0;
    for (const b of buf) {
      c ^= b;
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const t = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crcBuf]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(n, 0);
  ihdr.writeUInt32BE(n, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc(n * (1 + n * 3));
  for (let y = 0; y < n; y++) {
    raw[y * (1 + n * 3)] = 0;
    for (let x = 0; x < n; x++) {
      const o = y * (1 + n * 3) + 1 + x * 3;
      raw[o] = 20;
      raw[o + 1] = 60;
      raw[o + 2] = 200;
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

async function ensureTemplate(page: import('@playwright/test').Page, type = 'invoices') {
  await page.goto('/documents/settings');
  await waitForHydration(page);

  // Check if any template for this type already exists
  const heading = page.getByRole('heading', {
    name:
      type === 'invoices'
        ? 'Рахунки фактури'
        : type === 'bills'
          ? 'Видаткові накладні'
          : 'Довіренності',
  });
  const section = heading.locator('..');
  const table = section.locator('~ div table');
  const hasTable = await table.isVisible().catch(() => false);
  if (hasTable) {
    const rows = table.locator('tbody tr');
    const count = await rows.count();
    if (count > 0) {
      const text = await rows.first().textContent();
      if (text && !text.includes('No results')) return;
    }
  }

  // Create one via the editor route
  await page.goto(`/documents/${type}/settings/new`);
  await waitForHydration(page);

  await page.getByLabel('Назва шаблону').fill(`e2e-template-${Date.now()}`);
  await page.getByRole('button', { name: 'Зберегти' }).click();

  // Should redirect back to settings
  await page.waitForURL(/\/documents\/settings$/, { timeout: 10000 });
}

test.describe('Documents > Template Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/documents/settings');
    await waitForHydration(page);
  });

  test('renders settings page with sections and new template buttons', async ({ page }) => {
    await expect(page.getByText('Налаштування шаблонів')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Рахунки фактури' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Видаткові накладні' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Довіренності' })).toBeVisible();
    // Each section has a type-specific add button
    await expect(page.getByRole('link', { name: 'Новий шаблон Рахунки фактури' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Новий шаблон Видаткові накладні' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Новий шаблон Довіренності' })).toBeVisible();
  });

  test('clicking new template button navigates to editor with type-specific title', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'Новий шаблон Рахунки фактури' }).click();
    await page.waitForURL('**/documents/invoices/settings/new');
    await waitForHydration(page);

    await expect(page.getByText('Новий шаблон Рахунки фактури')).toBeVisible();
    await expect(page.getByLabel('Назва шаблону')).toBeVisible();
    await expect(page.getByLabel('Схема полів')).toBeVisible();
    await expect(page.getByText('Попередній перегляд')).toBeVisible();
  });

  test('template editor shows live preview', async ({ page }) => {
    await page.goto('/documents/invoices/settings/new');
    await waitForHydration(page);

    await expect(page.getByRole('cell', { name: 'Постачальник' })).toBeVisible();
  });

  test('create a template and verify it appears in settings', async ({ page }) => {
    const templateName = `test-template-${Date.now()}`;

    await page.getByRole('link', { name: 'Новий шаблон Рахунки фактури' }).click();
    await page.waitForURL('**/documents/invoices/settings/new');
    await waitForHydration(page);

    await page.getByLabel('Назва шаблону').fill(templateName);
    await page.getByRole('button', { name: 'Зберегти' }).click();

    // Should redirect back to /documents/settings
    await page.waitForURL(/\/documents\/settings$/, { timeout: 10000 });
    await page.reload();
    await waitForHydration(page);

    await expect(page.getByRole('cell', { name: templateName })).toBeVisible({
      timeout: 15000,
    });
  });

  test('different document types have different default schemas', async ({ page }) => {
    await page.goto('/documents/invoices/settings/new');
    await waitForHydration(page);
    const invoiceSchema = await page.getByLabel('Схема полів').inputValue();
    expect(invoiceSchema).toContain('рахунку');

    await page.goto('/documents/poas/settings/new');
    await waitForHydration(page);
    const poaSchema = await page.getByLabel('Схема полів').inputValue();
    expect(poaSchema).toContain('довіреності');

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

  test('settings button navigates to settings page', async ({ page }) => {
    await page.goto('/documents/invoices');
    await waitForHydration(page);

    await page.getByRole('link', { name: 'Налаштування шаблонів' }).click();
    await page.waitForURL(/\/documents\/settings$/);
    await waitForHydration(page);

    await expect(page.getByText('Налаштування шаблонів')).toBeVisible();
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

    // A template is auto-selected; required schema fields and the missing line
    // item are flagged.
    await expect(page.getByText("Обов'язкове поле").first()).toBeVisible();
    await expect(page.getByText('Додайте хоча б один товар')).toBeVisible();
  });

  test('renders type-specific fields from the template schema (М-2 passport)', async ({ page }) => {
    await ensureTemplate(page, 'poas');
    await page.goto('/documents/poas/new');
    await waitForHydration(page);

    // These fields only exist on the power-of-attorney schema — proof the form
    // is driven by the template's schema_json, not hardcoded.
    await expect(page.getByText('ПІБ довіреної особи')).toBeVisible();
    await expect(page.getByText('Серія паспорту')).toBeVisible();
    await expect(page.getByText('Ким виданий паспорт')).toBeVisible();
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
    await dialog.locator('input[name="priceSaleVATFree"]').fill('100');
    await dialog.locator('input[name="priceCostVATFree"]').fill('150');
    await dialog.locator('input[name="priceRetailInclVAT"]').fill('180');

    await dialog.getByRole('button', { name: 'Зберегти' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Create template via editor route
    await page.goto('/documents/invoices/settings/new');
    await waitForHydration(page);

    const templateName = `flow-template-${suffix}`;
    await page.getByLabel('Назва шаблону').fill(templateName);
    await page.getByRole('button', { name: 'Зберегти' }).click();

    // Wait for redirect back to settings, then reload to get fresh data
    await page.waitForURL(/\/documents\/settings$/, { timeout: 10000 });
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

test.describe('Documents > My company settings', () => {
  test('shows seeded supplier data and persists edits', async ({ page }) => {
    await page.goto('/documents/settings');
    await waitForHydration(page);

    await expect(page.getByRole('heading', { name: 'Моя компанія' })).toBeVisible();
    await expect(page.locator('#mc-name')).toHaveValue(/Чумаченко/);

    const phone = `050${Date.now() % 10000000}`;
    await page.locator('#mc-phone').fill(phone);
    await page
      .locator('form[action="/documents/my-company"]')
      .getByRole('button', { name: 'Зберегти' })
      .click();
    await expect(page.getByText('Збережено')).toBeVisible({ timeout: 10000 });

    await page.reload();
    await waitForHydration(page);
    await expect(page.locator('#mc-phone')).toHaveValue(phone);
  });
});

test.describe('Documents > Generation happy path', () => {
  type Page = import('@playwright/test').Page;

  // Create an item type (units are seeded) + an item; returns the item name.
  async function makeItem(page: Page, suffix: number): Promise<string> {
    await page.goto('/library/settings');
    await waitForHydration(page);
    const typeName = `gen-type-${suffix}`;
    const typeForm = page.locator('form#form-type');
    await typeForm.locator('input[name="name"]').fill(typeName);
    const typeResp = page.waitForResponse(
      (r) => r.url().includes('/library/enums/type') && r.status() === 200
    );
    await typeForm.getByRole('button', { name: 'Додати' }).click();
    await typeResp;

    await page.goto('/library/items');
    await waitForHydration(page);
    await page.getByRole('button', { name: 'Додати новий товар' }).click();
    const dialog = page.getByRole('dialog');
    const itemName = `gen-item-${suffix}`;
    await dialog.locator('input[name="name"]').fill(itemName);
    await dialog.locator('select[name="type"]').selectOption(typeName);
    await dialog.locator('input[name="priceSaleVATFree"]').fill('1000');
    await dialog.locator('input[name="priceCostVATFree"]').fill('800');
    await dialog.locator('input[name="priceRetailInclVAT"]').fill('1200');
    await dialog.getByRole('button', { name: 'Зберегти' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    return itemName;
  }

  async function pickCompany(page: Page, comboboxLabel: string) {
    await page.getByRole('combobox', { name: comboboxLabel }).click();
    await page.getByRole('option', { name: /Тестовий Контрагент/ }).click();
  }
  async function pickItem(page: Page, itemName: string) {
    await page.getByRole('combobox').filter({ hasText: 'Товар' }).first().click();
    await page.getByRole('option', { name: itemName }).click();
  }

  test('composes an invoice (XLSX) and lands on a downloadable document', async ({ page }) => {
    const suffix = Date.now();
    const itemName = await makeItem(page, suffix);
    await ensureTemplate(page, 'invoices');

    await page.goto('/documents/invoices/new');
    await waitForHydration(page);
    await page.locator('#number').fill(`INV-${suffix}`);
    await pickCompany(page, 'Одержувач');
    await pickItem(page, itemName);
    await page.getByRole('button', { name: 'Зберегти' }).click();

    await page.waitForURL(/\/documents\/invoices\/\d+$/, { timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Завантажити XLSX' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(`INV-${suffix}`)).toBeVisible({ timeout: 15000 });
  });

  test('downloads a document as both XLSX and PDF', async ({ page }) => {
    const suffix = Date.now();
    const itemName = await makeItem(page, suffix);
    await ensureTemplate(page, 'invoices');

    await page.goto('/documents/invoices/new');
    await waitForHydration(page);
    await page.locator('#number').fill(`BOTH-${suffix}`);
    await pickCompany(page, 'Одержувач');
    await pickItem(page, itemName);
    await page.getByRole('button', { name: 'Зберегти' }).click();
    await page.waitForURL(/\/documents\/invoices\/\d+$/, { timeout: 20000 });

    // The document was created as XLSX, but both formats are downloadable —
    // the PDF is rendered on demand from the stored data.
    const xlsxDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Завантажити XLSX' }).click();
    expect((await xlsxDownload).suggestedFilename()).toMatch(/\.xlsx$/);

    const pdfDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Завантажити PDF' }).click();
    expect((await pdfDownload).suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('embeds an uploaded stamp on the PDF export', async ({ page }) => {
    const suffix = Date.now();
    const itemName = await makeItem(page, suffix);
    await ensureTemplate(page, 'invoices');

    // Upload a stamp in settings (a real PNG buffer — jsPDF rejects malformed PNGs).
    await page.goto('/documents/settings');
    await waitForHydration(page);
    await page.getByPlaceholder('Назва печатки').fill(`e2e-stamp-${suffix}`);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'stamp.png',
      mimeType: 'image/png',
      buffer: makePngBuffer(64),
    });
    await expect(page.getByText(`e2e-stamp-${suffix}`)).toBeVisible({ timeout: 10000 });

    // Compose an invoice with the stamp included (the template is not linked to a
    // stamp, so this also exercises the "use the latest uploaded stamp" fallback).
    await page.goto('/documents/invoices/new');
    await waitForHydration(page);
    await page.locator('#number').fill(`STAMP-${suffix}`);
    await pickCompany(page, 'Одержувач');
    await pickItem(page, itemName);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Зберегти' }).click();
    await page.waitForURL(/\/documents\/invoices\/\d+$/, { timeout: 20000 });

    // The PDF is rendered in the worker; assert the stamp image was embedded
    // (jsPDF writes images as /Image XObjects) — proves R2 fetch + addImage work
    // in workerd, not just under Node.
    const id = new URL(page.url()).pathname.split('/').pop();
    const res = await page.request.get(`/documents/export-document?id=${id}&format=pdf`);
    expect(res.ok()).toBeTruthy();
    const body = await res.body();
    expect(body.toString('latin1')).toContain('/Image');
  });

  test('composes an invoice as PDF', async ({ page }) => {
    const suffix = Date.now();
    const itemName = await makeItem(page, suffix);
    await ensureTemplate(page, 'invoices');

    await page.goto('/documents/invoices/new');
    await waitForHydration(page);
    await page.locator('#number').fill(`PDF-${suffix}`);
    await pickCompany(page, 'Одержувач');
    await pickItem(page, itemName);
    // Switch the format selector from XLSX to PDF.
    await page.getByRole('combobox').filter({ hasText: 'XLSX' }).click();
    await page.getByRole('option', { name: 'PDF' }).click();
    await page.getByRole('button', { name: 'Зберегти' }).click();

    await page.waitForURL(/\/documents\/invoices\/\d+$/, { timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Завантажити PDF' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('composes a bill (Видаткова накладна)', async ({ page }) => {
    const suffix = Date.now();
    const itemName = await makeItem(page, suffix);
    await ensureTemplate(page, 'bills');

    await page.goto('/documents/bills/new');
    await waitForHydration(page);
    await page.locator('#number').fill(`BILL-${suffix}`);
    await pickCompany(page, 'Одержувач');
    await pickItem(page, itemName);
    await page.getByRole('button', { name: 'Зберегти' }).click();

    await page.waitForURL(/\/documents\/bills\/\d+$/, { timeout: 20000 });
    // Both export formats are offered on every document.
    await expect(page.getByRole('button', { name: 'Завантажити XLSX' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: 'Завантажити PDF' })).toBeVisible();
    await expect(page.getByText(`BILL-${suffix}`)).toBeVisible({ timeout: 15000 });
  });

  test('composes a power of attorney (M-2 довіреність)', async ({ page }) => {
    const suffix = Date.now();
    const itemName = await makeItem(page, suffix);
    await ensureTemplate(page, 'poas');

    await page.goto('/documents/poas/new');
    await waitForHydration(page);
    await page.locator('#number').fill(`POA-${suffix}`);
    await page.locator('#valid_until').fill('2026-12-31');
    await page.locator('#recipient_name').fill('Тест Довірена Особа');
    await pickCompany(page, 'Постачальник (від кого отримати)');
    await pickItem(page, itemName);
    await page.getByRole('button', { name: 'Зберегти' }).click();

    await page.waitForURL(/\/documents\/poas\/\d+$/, { timeout: 20000 });
    // Both export formats are offered on every document.
    await expect(page.getByRole('button', { name: 'Завантажити XLSX' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: 'Завантажити PDF' })).toBeVisible();
    await expect(page.getByText(`POA-${suffix}`)).toBeVisible({ timeout: 15000 });
  });
});
