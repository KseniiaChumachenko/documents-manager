import { test, expect } from '@playwright/test';

// Turbo-stream encoder for React Router 7 single-fetch responses.
// Encodes a loader return value into the format expected by the client decoder.
const ROUTE_ID = 'routes/library/_api/search-company';
const NULL = -5;

function encodeTurboStream(routeId: string, loaderData: unknown): string {
  const arr: unknown[] = [];

  function encode(value: unknown): number {
    if (value === null) return NULL;
    if (value === undefined) return -7;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      const idx = arr.length;
      arr.push(value);
      return idx;
    }

    if (Array.isArray(value)) {
      const idx = arr.length;
      arr.push(null); // placeholder
      arr[idx] = value.map((v) => encode(v));
      return idx;
    }

    if (typeof value === 'object') {
      const idx = arr.length;
      const obj: Record<string, number> = {};
      arr.push(obj);
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        const keyIdx = encode(key);
        const valIdx = encode(val);
        obj[`_${keyIdx}`] = valIdx;
      }
      return idx;
    }

    const idx = arr.length;
    arr.push(value);
    return idx;
  }

  // Position 0: root object { _<routeKeyIdx>: routeDataIdx }
  // Position 1: route ID string
  // Position 2: route data wrapper { _<dataKeyIdx>: loaderDataIdx }
  // Position 3: "data" key
  // Position 4+: encoded loader data
  const rootIdx = arr.length;
  arr.push(null); // 0 - root placeholder
  const routeKeyIdx = arr.length;
  arr.push(routeId); // 1 - route ID
  const wrapperIdx = arr.length;
  arr.push(null); // 2 - wrapper placeholder
  const dataKeyIdx = arr.length;
  arr.push('data'); // 3 - "data" key

  const loaderDataIdx = encode(loaderData);

  arr[rootIdx] = { [`_${routeKeyIdx}`]: wrapperIdx };
  arr[wrapperIdx] = { [`_${dataKeyIdx}`]: loaderDataIdx };

  return JSON.stringify(arr);
}

function mockRoute(data: unknown) {
  return encodeTurboStream(ROUTE_ID, data);
}

const mockCompanyData = {
  egrpou: '12345678',
  name: 'ТОВ Тестова Компанія',
  name_short: 'Тестова',
  address: 'м. Київ, вул. Тестова, 1',
  director: 'Іванов Іван Іванович',
  director_gen: 'Іванова Івана Івановича',
  kved: 'Тестова діяльність',
  kved_number: '62.01',
  inn: '123456789012',
  inn_date: '2020-01-01',
};

const mockFopData = {
  id: 1,
  ik: '1234567890',
  entity_type: 'fop',
  name: 'ФОП Петренко П.П.',
  address: 'м. Львів, вул. Тестова, 5',
  phone: '+380501234567',
};

test.describe('Library > Clients (/library/client)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library/client');
    await page.waitForSelector('table', { timeout: 30000 });
  });

  test('renders clients page with add button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Додати нового клієнта' })
    ).toBeVisible();
  });

  test('renders clients data table with headers', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'ЄДРПОУ' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'ІК' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Форма' })).toBeVisible();
    const headers = page.locator('th');
    expect(await headers.count()).toBeGreaterThanOrEqual(5);
  });

  test('clicking add button opens add company dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Додати нового клієнта' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText('Введіть ЄДРПОУ (8 цифр) або ІК (10 цифр)')
    ).toBeVisible();
  });

  test('add company dialog has code search input and button', async ({ page }) => {
    await page.getByRole('button', { name: 'Додати нового клієнта' }).click();
    const dialog = page.getByRole('dialog');

    await expect(dialog.locator('input[name="code"]')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Пошук' })).toBeVisible();
  });

  test('code input has correct constraints', async ({ page }) => {
    await page.getByRole('button', { name: 'Додати нового клієнта' }).click();
    const input = page.getByRole('dialog').locator('input[name="code"]');

    await expect(input).toHaveAttribute('minLength', '8');
    await expect(input).toHaveAttribute('maxLength', '10');
    await expect(input).toHaveAttribute('type', 'text');
  });

  test('search company via EGRPOU and display results', async ({ page }) => {
    await page.route('**/*.data*', async (route) => {
      if (route.request().url().includes('search-company')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/x-script',
          body: mockRoute({ data: mockCompanyData, error: null, entity_type: 'legal' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('button', { name: 'Додати нового клієнта' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[name="code"]').fill('12345678');
    await dialog.getByRole('button', { name: 'Пошук' }).click();

    await expect(dialog.getByText('ТОВ Тестова Компанія')).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText('м. Київ, вул. Тестова, 1')).toBeVisible();
  });

  test('search ФОП by ІК shows manual entry form when not in DB', async ({ page }) => {
    await page.route('**/*.data*', async (route) => {
      if (route.request().url().includes('search-company')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/x-script',
          body: mockRoute({ data: null, error: null, entity_type: 'fop' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('button', { name: 'Додати нового клієнта' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[name="code"]').fill('1234567890');
    await dialog.getByRole('button', { name: 'Пошук' }).click();

    await expect(dialog.getByText('ФОП не знайдено в базі')).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByPlaceholder('ПІБ / Назва')).toBeVisible();
    await expect(dialog.getByPlaceholder('Адреса')).toBeVisible();
    await expect(dialog.getByPlaceholder('Телефон')).toBeVisible();
  });

  test('ФОП manual entry enables save when name is filled', async ({ page }) => {
    await page.route('**/*.data*', async (route) => {
      if (route.request().url().includes('search-company')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/x-script',
          body: mockRoute({ data: null, error: null, entity_type: 'fop' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('button', { name: 'Додати нового клієнта' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[name="code"]').fill('1234567890');
    await dialog.getByRole('button', { name: 'Пошук' }).click();

    await expect(dialog.getByText('ФОП не знайдено в базі')).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByRole('button', { name: 'Зберегти' })).toBeDisabled();

    await dialog.getByPlaceholder('ПІБ / Назва').fill('ФОП Петренко П.П.');
    await expect(dialog.getByRole('button', { name: 'Зберегти' })).toBeEnabled();
  });

  test('search ФОП by ІК shows cached data when found in DB', async ({ page }) => {
    await page.route('**/*.data*', async (route) => {
      if (route.request().url().includes('search-company')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/x-script',
          body: mockRoute({ data: mockFopData, error: null, entity_type: 'fop' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('button', { name: 'Додати нового клієнта' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[name="code"]').fill('1234567890');
    await dialog.getByRole('button', { name: 'Пошук' }).click();

    await expect(dialog.getByText('ФОП Петренко П.П.')).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByRole('button', { name: 'Зберегти' })).toBeEnabled();
  });

  test('save button is disabled when no search results', async ({ page }) => {
    await page.getByRole('button', { name: 'Додати нового клієнта' }).click();
    const saveButton = page.getByRole('dialog').getByRole('button', { name: 'Зберегти' });
    await expect(saveButton).toBeDisabled();
  });

  test('save button is enabled after successful search', async ({ page }) => {
    await page.route('**/*.data*', async (route) => {
      if (route.request().url().includes('search-company')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/x-script',
          body: mockRoute({ data: mockCompanyData, error: null, entity_type: 'legal' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('button', { name: 'Додати нового клієнта' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[name="code"]').fill('12345678');
    await dialog.getByRole('button', { name: 'Пошук' }).click();

    await expect(dialog.getByText('ТОВ Тестова Компанія')).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByRole('button', { name: 'Зберегти' })).toBeEnabled();
  });

  test('displays error message when search fails', async ({ page }) => {
    await page.route('**/*.data*', async (route) => {
      if (route.request().url().includes('search-company')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/x-script',
          body: mockRoute({ data: null, error: 'Компанію не знайдено', entity_type: 'legal' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('button', { name: 'Додати нового клієнта' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[name="code"]').fill('99999999');
    await dialog.getByRole('button', { name: 'Пошук' }).click();

    await expect(dialog.getByText('Компанію не знайдено')).toBeVisible({ timeout: 10000 });
  });

  test('save company closes dialog', async ({ page }) => {
    await page.route('**/*.data*', async (route) => {
      const url = route.request().url();
      if (url.includes('search-company')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/x-script',
          body: mockRoute({ data: mockCompanyData, error: null, entity_type: 'legal' }),
        });
      } else if (url.includes('save-company')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/x-script',
          body: encodeTurboStream('routes/library/_api/save-company', {
            data: [mockCompanyData],
            error: null,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('button', { name: 'Додати нового клієнта' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[name="code"]').fill('12345678');
    await dialog.getByRole('button', { name: 'Пошук' }).click();
    await expect(dialog.getByText('ТОВ Тестова Компанія')).toBeVisible({ timeout: 10000 });

    await dialog.getByRole('button', { name: 'Зберегти' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Library > Sources (/library/source)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library/source');
    await page.waitForSelector('table', { timeout: 30000 });
  });

  test('renders sources page with add button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Додати нового продавця' })
    ).toBeVisible();
  });

  test('renders sources data table with headers', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'ЄДРПОУ' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'ІК' })).toBeVisible();
    const headers = page.locator('th');
    expect(await headers.count()).toBeGreaterThanOrEqual(5);
  });

  test('clicking add button opens add source dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Додати нового продавця' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText('Введіть ЄДРПОУ (8 цифр) або ІК (10 цифр)')
    ).toBeVisible();
  });

  test('save button disabled without search results', async ({ page }) => {
    await page.getByRole('button', { name: 'Додати нового продавця' }).click();
    const saveButton = page.getByRole('dialog').getByRole('button', { name: 'Зберегти' });
    await expect(saveButton).toBeDisabled();
  });
});
