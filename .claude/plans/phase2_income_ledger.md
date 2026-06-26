# Phase 2: Income Ledger + Tax Calculator

> **Legal basis:** validate against `.claude/skills/ukrainian-accounting/` (refs `02-simplified-single-tax`, `03-vat-pdv`, `04-military-levy-esv`, `07-reporting-deadlines`, `08-volatile-values-2026`). This plan was corrected on 2026-06-25 per `findings-initial-review.md` (conflicts C1, C4; gaps G4, G5).

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
  // єдиний податок: rate depends on group + VAT status — NOT a fixed 3%.
  // Group 3 non-VAT = 5% of income; Group 3 VAT payer = 3% of income (ПКУ ст. 293.3).
  // Groups 1/2 = fixed monthly amount (council-set), not a % of income.
  taxUnified: integer('tax_unified'), // kopecks
  // військовий збір: Group 3 = 1% of income; Groups 1/2/4 = fixed 10% of min wage/month.
  taxMilitary: integer('tax_military'), // kopecks
  esvSelf: integer('esv_self'), // minimum_wage × 22%, kopecks — derived at runtime
  status: text().notNull().default('open'), // 'open' | 'filed'
});
```

After adding, run `npm run db:generate`.

---

## 2. Tax Calculation Logic (`apps/web/app/lib/tax-calculator.ts`)

```typescript
// All rates/thresholds are sourced from dated config (see below), NEVER hardcoded.
// Mirror .claude/skills/ukrainian-accounting/references/08-volatile-values-2026.md.

// ESV for self: derived from minimum wage
export function calculateEsvSelf(minimumWageKopecks: number): number {
  return Math.round(minimumWageKopecks * 0.22); // ЄСВ 22% (Закон 2464)
}

type SingleTaxGroup = 1 | 2 | 3;

// Єдиний податок + військовий збір for the typical SaaS user (Group 3 FOP).
// ⚠ Group 3 rate is 5% (non-VAT) or 3% (VAT payer) — NOT a flat 3% (ПКУ ст. 293.3).
export function calculateGroup3Tax(
  incomeKopecks: number,
  isVatPayer: boolean,
) {
  const unifiedRate = isVatPayer ? 0.03 : 0.05; // 3% + ПДВ vs 5% non-VAT
  return {
    unified: Math.round(incomeKopecks * unifiedRate), // єдиний податок
    military: Math.round(incomeKopecks * 0.01), // військовий збір 1% of income (since 2025)
  };
}

// Groups 1 & 2 do NOT pay a % of income:
//   - єдиний податок = fixed monthly amount set by the local council
//     (max: G1 = 10% of subsistence min; G2 = 20% of min wage) — ПКУ ст. 293.2
//   - військовий збір = fixed 10% of the 1-Jan minimum wage per month — ПКУ підрозд. 10 розд. XX
// These come from config (per-group fixed kopeck amounts), not from income.
export function group12FixedCharges(cfg: {
  unifiedMonthlyKopecks: number; // council-set fixed єдиний податок
  minimumWageKopecks: number;
}) {
  return {
    unifiedQuarter: cfg.unifiedMonthlyKopecks * 3,
    militaryQuarter: Math.round(cfg.minimumWageKopecks * 0.10) * 3, // 10% МЗП × 3 months
  };
}
```

**Config:** add a `config` table or Cloudflare KV holding the dated indicators —
`minimum_wage_kopecks`, `subsistence_min_kopecks`, per-group fixed єдиний-податок
amounts, and `is_vat_payer` for the owner. Update once a year (1 Jan) and on ad-hoc
law changes; each value carries an effective date. The owner's **group** and
**VAT-payer status** drive which calculation path runs — store them in settings.

---

## 3. Monobank Integration

### Webhook endpoint: `apps/web/app/routes/_api/monobank-webhook.ts`

- `POST /monobank-webhook`
- Validates the request (Monobank sends a `X-Token` header)
- Parses `StatementItem`: `{ id, time, description, amount, counterEdrpou, counterName }`
- `amount` is in kopecks; negative = expense (skip), positive = income
- Upserts `income_entry` with `source: 'monobank_webhook'`, `bankTxId: item.id`
- Auto-matches counteragent by the incoming code against **both** `company.egrpou` (8-digit ЮО) **and** `company.ik` (10-digit ФОП РНОКПП). Monobank's `counterEdrpou` carries the 8-digit code for legal entities and the 10-digit РНОКПП for ФОП — matching only `egrpou` silently drops every ФОП counterparty (`references/01-entities-registries.md`).

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
- Shows: total income, єдиний податок (5% non-VAT / 3% VAT — by the owner's group & VAT status, see §2), військовий збір (1% for Group 3; fixed 10%-of-min-wage/month for Groups 1/2), ESV (derived from current minimum wage)
- "Сформувати звіт" → generates printable summary for filing via cabinet.tax.gov.ua
- Note: ЄП Group 3 declaration is **quarterly** (within 40 days of quarter-end); Groups 1/2 file **annually** but pay єдиний податок + ВЗ **monthly by the 20th** (`references/07-reporting-deadlines.md`).
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
- [ ] Tax calculator computes єдиний податок by group + VAT status (5%/3% for G3; fixed for G1/2), військовий збір (1% G3 / fixed G1/2), and ESV — all from dated config, none hardcoded
- [ ] VAT ledger shows monthly input/output summary
- [ ] All E2E tests pass
