# Phase 2: Income Ledger + Tax Calculator

## Goal
Track all business income (from generated documents, Monobank webhook, CSV import, and manual entry). Calculate quarterly tax obligations. Provide a VAT ledger. Export declaration-ready summaries.

## Prerequisites
- Phase 1 complete: `document` table exists (income entries link to documents)
- `company` table exists with `id` FK
- Cloudflare Worker can receive webhook POST requests (standard — no extra config)

---

## 1. Schema Changes

Add to `apps/web/app/database/schema.ts`:

```typescript
export const incomeEntry = sqliteTable('income_entry', {
  id: integer().primaryKey({ autoIncrement: true }),
  date: text().notNull(), // ISO date
  amountUah: integer('amount_uah').notNull(), // kopecks
  counteragentId: integer('counteragent_id').references(() => company.id),
  documentId: integer('document_id').references(() => document.id),
  paymentType: text('payment_type'), // 'bank' | 'cash'
  notes: text(),
  source: text().notNull(), // 'monobank_webhook' | 'csv_import' | 'manual' | 'document'
  bankTxId: text('bank_tx_id').unique(), // dedupe key; null for non-bank sources
});

export const bankConnection = sqliteTable('bank_connection', {
  id: integer().primaryKey({ autoIncrement: true }),
  bank: text().notNull(), // 'monobank'
  tokenEncrypted: text('token_encrypted').notNull(), // encrypt with a KV-stored key
  webhookUrl: text('webhook_url'),
  lastSync: text('last_sync'),
  status: text().notNull(), // 'active' | 'error'
});

export const vatRecord = sqliteTable('vat_record', {
  id: integer().primaryKey({ autoIncrement: true }),
  date: text().notNull(),
  taxInvoiceNumber: text('tax_invoice_number'),
  counteragentId: integer('counteragent_id').references(() => company.id),
  amount: integer().notNull(), // base amount, kopecks
  vatAmount: integer('vat_amount').notNull(), // kopecks
  direction: text().notNull(), // 'input' | 'output'
  erpnRegistered: integer('erpn_registered', { mode: 'boolean' }).default(false),
});

export const taxPeriod = sqliteTable('tax_period', {
  id: integer().primaryKey({ autoIncrement: true }),
  year: integer().notNull(),
  quarter: integer().notNull(), // 1–4
  incomeTotal: integer('income_total'), // kopecks
  taxUnified: integer('tax_unified'), // 3% of income, kopecks
  taxMilitary: integer('tax_military'), // 1% of income, kopecks
  esvSelf: integer('esv_self'), // minimum_wage × 22%, kopecks — derived at runtime
  status: text().notNull().default('open'), // 'open' | 'filed'
});
```

After adding, run `npm run db:generate`.

---

## 2. Tax Calculation Logic (`apps/web/app/lib/tax-calculator.ts`)

```typescript
// ESV for self: derived from minimum wage, never hardcoded
// Store minimum wage in a config table or KV, update annually
export function calculateEsvSelf(minimumWageKopecks: number): number {
  return Math.round(minimumWageKopecks * 0.22);
}

export function calculateQuarterlyTax(incomeKopecks: number) {
  return {
    unified: Math.round(incomeKopecks * 0.03),   // 3% єдиний податок
    military: Math.round(incomeKopecks * 0.01),   // 1% військовий збір
  };
}
```

Add a `config` table or use Cloudflare KV to store `minimum_wage_kopecks` — updated manually once a year when the minimum wage changes (typically Jan 1).

---

## 3. Monobank Integration

### Webhook endpoint: `apps/web/app/routes/_api/monobank-webhook.ts`
- `POST /monobank-webhook`
- Validates the request (Monobank sends a `X-Token` header)
- Parses `StatementItem`: `{ id, time, description, amount, counterEdrpou, counterName }`
- `amount` is in kopecks; negative = expense (skip), positive = income
- Upserts `income_entry` with `source: 'monobank_webhook'`, `bankTxId: item.id`
- Auto-matches counteragent by `counterEdrpou` → `company.egrpou`

### Cron poller: add to wrangler.jsonc cron triggers
- Schedule: `0 6 * * *` (daily at 6 AM)
- Calls Monobank `GET /personal/statement/{account}/{from}/{to}` for the previous day
- Respects 1 req/60s rate limit (single account, single call per day = no issue)
- Upserts income entries, deduplicates by `bankTxId`
- File: `apps/web/app/workers/monobank-poller.ts`

### Setup UI: `apps/web/app/routes/library/settings/bank-connection.tsx`
- Form to enter Monobank personal API token
- "Зареєструвати webhook" button → calls Monobank `POST /personal/webhook` with our endpoint URL
- Shows connection status (last sync, active/error)

---

## 4. CSV Import (`apps/web/app/routes/_api/bank-csv-import.ts`)

- `POST /bank-csv-import` accepting multipart form with CSV file
- Auto-detect bank format by CSV headers (support: Приват24 для бізнесу, ПУМБ)
- Parse: date, amount, counterparty name, EDRPOU, IBAN, payment purpose
- Skip expenses (negative amounts)
- Deduplicate by `bankTxId` (hash of date + amount + IBAN)
- Return summary: `{ imported: N, skipped: N, unmatched: N }`

UI: upload page at `/income/import`

---

## 5. UI Routes

### `/income` — Income Register
- DataTable: date, amount, counteragent, source badge, document link
- Filter by: date range, source, counteragent
- "Додати вручну" button → inline form (date, amount, counteragent, notes)
- "Імпортувати CSV" button → navigates to import page

### `/income/tax` — Tax Calculator
- Quarterly selector (year + quarter)
- Shows: total income, 3% tax, 1% military levy, ESV (derived from current minimum wage)
- "Сформувати звіт" → generates printable summary for filing via cabinet.tax.gov.ua
- Marks quarter as `filed` when user confirms

### `/income/vat` — VAT Ledger
- DataTable of VAT records (input and output)
- Monthly filter
- Summary: output VAT - input VAT = liability/refund
- Manual entry form for tax invoices not linked to generated documents

---

## 6. Reconciliation View

On the income register, unmatched bank transactions (no `counteragentId`) appear highlighted.
User can click → link to existing company or create new one inline.

---

## 7. E2E Tests (`apps/web/e2e/income.spec.ts`)

Required:
1. Navigate to `/income` — income register renders
2. Add manual income entry — appears in list
3. Navigate to `/income/tax` — quarterly tax summary renders with correct calculations
4. Upload a CSV file — verify parsed entries appear in income register
5. Navigate to `/income/vat` — VAT ledger renders

---

## Definition of Done
- [ ] All schema tables created and migration applied
- [ ] Monobank webhook endpoint receives and stores transactions
- [ ] Cron poller configured in wrangler.jsonc
- [ ] CSV import handles at least Приват24 format
- [ ] Income register lists all entries with source badges
- [ ] Tax calculator correctly computes 3% + 1% + ESV (derived)
- [ ] VAT ledger shows monthly input/output summary
- [ ] All E2E tests pass
