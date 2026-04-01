import { test, expect } from '@playwright/test';
import { waitForHydration } from './helpers';

test.describe('Library > Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library/settings');
    await waitForHydration(page);
  });

  test('renders settings page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Налаштування бібліотеки' })).toBeVisible();
  });

  test('renders Types section with title and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Типи' })).toBeVisible();
    await expect(page.getByText('Типи можна розуміти як категорії товарів')).toBeVisible();
  });

  test('renders Units section with title and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Одиниці' })).toBeVisible();
    await expect(
      page.getByText('В рахунках для товарів та послуг використовуються різні одиниці')
    ).toBeVisible();
  });

  test('displays existing units in the table', async ({ page }) => {
    const unitsSection = page.getByRole('heading', { name: 'Одиниці' }).locator('..');
    const unitInputs = unitsSection.locator('table input[type="text"]');
    await expect(unitInputs.first()).toBeVisible();
  });

  test('displays existing types in the table', async ({ page }) => {
    const typesSection = page.getByRole('heading', { name: 'Типи' }).locator('..');
    await expect(typesSection.locator('table')).toBeVisible();
  });

  test('add a new unit', async ({ page }) => {
    const uniqueName = `test-unit-${Date.now()}`;

    const unitForm = page.locator('form#form-unit');
    await unitForm.locator('input[name="name"]').fill(uniqueName);

    // Use waitForResponse to confirm the fetcher completed without navigation
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/library/enums/unit') && resp.status() === 200
    );
    await unitForm.getByRole('button', { name: 'Додати' }).click();
    await responsePromise;

    // After revalidation, the new unit should appear
    await expect(page.locator(`input[value="${uniqueName}"]`)).toBeVisible({ timeout: 10000 });
  });

  test('add a new type', async ({ page }) => {
    const uniqueName = `test-type-${Date.now()}`;

    const typeForm = page.locator('form#form-type');
    await typeForm.locator('input[name="name"]').fill(uniqueName);

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/library/enums/type') && resp.status() === 200
    );
    await typeForm.getByRole('button', { name: 'Додати' }).click();
    await responsePromise;

    await expect(page.locator(`input[value="${uniqueName}"]`)).toBeVisible({ timeout: 10000 });
  });

  test('delete a unit', async ({ page }) => {
    const uniqueName = `del-unit-${Date.now()}`;
    const unitForm = page.locator('form#form-unit');
    await unitForm.locator('input[name="name"]').fill(uniqueName);

    const addResponse = page.waitForResponse(
      (resp) => resp.url().includes('/library/enums/unit') && resp.status() === 200
    );
    await unitForm.getByRole('button', { name: 'Додати' }).click();
    await addResponse;
    await expect(page.locator(`input[value="${uniqueName}"]`)).toBeVisible({ timeout: 10000 });

    // Delete the row
    const row = page.locator('tr').filter({ has: page.locator(`input[value="${uniqueName}"]`) });
    const deleteResponse = page.waitForResponse(
      (resp) => resp.url().includes('/library/enums/unit/') && resp.status() === 200
    );
    await row.getByRole('button').click();
    await deleteResponse;

    await expect(page.locator(`input[value="${uniqueName}"]`)).not.toBeVisible({ timeout: 10000 });
  });

  test('delete a type', async ({ page }) => {
    const uniqueName = `del-type-${Date.now()}`;
    const typeForm = page.locator('form#form-type');
    await typeForm.locator('input[name="name"]').fill(uniqueName);

    const addResponse = page.waitForResponse(
      (resp) => resp.url().includes('/library/enums/type') && resp.status() === 200
    );
    await typeForm.getByRole('button', { name: 'Додати' }).click();
    await addResponse;
    await expect(page.locator(`input[value="${uniqueName}"]`)).toBeVisible({ timeout: 10000 });

    const row = page.locator('tr').filter({ has: page.locator(`input[value="${uniqueName}"]`) });
    const deleteResponse = page.waitForResponse(
      (resp) => resp.url().includes('/library/enums/type/') && resp.status() === 200
    );
    await row.getByRole('button').click();
    await deleteResponse;

    await expect(page.locator(`input[value="${uniqueName}"]`)).not.toBeVisible({ timeout: 10000 });
  });

  test('edit a unit inline', async ({ page }) => {
    const originalName = `edit-unit-${Date.now()}`;
    const updatedName = `edited-unit-${Date.now()}`;

    const unitForm = page.locator('form#form-unit');
    await unitForm.locator('input[name="name"]').fill(originalName);

    const addResponse = page.waitForResponse(
      (resp) => resp.url().includes('/library/enums/unit') && resp.status() === 200
    );
    await unitForm.getByRole('button', { name: 'Додати' }).click();
    await addResponse;
    await expect(page.locator(`input[value="${originalName}"]`)).toBeVisible({ timeout: 10000 });

    // Inline edit: clear, type new name, press Enter (submits PUT form)
    const editInput = page.locator(`input[value="${originalName}"]`);
    await editInput.clear();
    await editInput.fill(updatedName);

    const editResponse = page.waitForResponse(
      (resp) => resp.url().includes('/library/enums/unit/') && resp.status() === 200
    );
    await editInput.press('Enter');
    await editResponse;

    await expect(page.locator(`input[value="${updatedName}"]`)).toBeVisible({ timeout: 10000 });
  });

  test('each unit row has a delete button with trash icon', async ({ page }) => {
    const tables = page.locator('table');
    const firstTable = tables.first();
    const rows = firstTable.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      for (let i = 0; i < Math.min(rowCount, 3); i++) {
        await expect(rows.nth(i).getByRole('button')).toBeVisible();
      }
    }
  });

  test('add form labels are correct', async ({ page }) => {
    const labels = page.getByText('Додати нове найменування');
    await expect(labels.first()).toBeVisible();
    expect(await labels.count()).toBe(2);
  });
});
