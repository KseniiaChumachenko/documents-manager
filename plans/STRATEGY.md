# Strategy: Zero-Maintenance Automation for a Ukrainian FOP

**Target:** ФОП 3-ї групи єдиного податку, платник ПДВ, 3 працівники, поквартальна звітність.

**Core constraint:** Zero maintenance cost — no paid SaaS, no accountant fees, no server bills. Everything runs on Cloudflare free tier + free government services + this app.

---

## 1. The Problem Space

A 3rd-group FOP with VAT and employees has a surprisingly heavy compliance burden:

| Obligation | Frequency | Deadline |
|---|---|---|
| VAT declaration (ПДВ) | **Monthly** | 20th of next month |
| Tax invoices (податкові накладні) in ЄРПН | Per transaction | Within 15 days of first event |
| Unified tax declaration (єдиний податок 3%) | Quarterly (cumulative) | 40 days after quarter |
| Military levy (1% of income, for self) | Quarterly (in tax declaration) | Same as above |
| Unified payroll report (ЄСВ+ПДФО+ВЗ for employees) | Quarterly (since 2026) | 40 days after quarter |
| ESV for self (annual, in declaration appendix) | Annually | With Q4 declaration |
| Statistical reporting | If selected by Derzhstat | Per schedule |
| PRRO fiscal receipts | Per B2C transaction | Real-time |

**Documents to maintain:** income register, employment contracts, payroll sheets, timesheets, acts of work, invoices, tax invoices, delivery notes, HR orders, bank statements.

**The pain:** For a 3-person installation business, the owner is drowning in paperwork instead of doing actual work. An accountant costs 3,000-8,000 UAH/month. Existing free tools (Taxer, cabinet.tax.gov.ua) handle reporting but not document generation, employee tracking, or the full workflow.

---

## 2. Strategic Vision

**Replace the accountant with a self-hosted app that:**

1. **Generates** all primary documents (acts, invoices, delivery notes) from templates
2. **Tracks** income, calculates taxes, and prepares declaration data
3. **Manages** employees (payroll, timesheets, leave)
4. **Reminds** the owner of every deadline before it hits
5. **Exports** declaration-ready data for one-click filing via cabinet.tax.gov.ua

**What we do NOT build** (leverage free government tools instead):
- ЄРПН registration of tax invoices — use cabinet.tax.gov.ua directly
- QES/КЕП signing — use Diia.Підпис (free, phone-based)
- PRRO/касовий апарат — use free DPS PRRO app
- Actual declaration submission — export XML/prefilled data, submit via cabinet.tax.gov.ua

This keeps the product focused on **the gaps** no free tool covers: document generation, employee management, deadline orchestration, and the income/tax ledger.

---

## 3. Architecture (Zero Cost)

```
┌─────────────────────────────────────────┐
│           Cloudflare Free Tier           │
├───────────┬──────────┬──────────────────┤
│  Workers  │    D1    │       R2         │
│  (SSR +   │ (SQLite  │ (documents,      │
│   API)    │  DB)     │  templates)      │
├───────────┴──────────┴──────────────────┤
│  Zero Trust (auth, SSO via Google)       │
└─────────────────────────────────────────┘
         ↑ already built ↑

New additions:
- D1: employee, payroll, document, deadline, income tables
- R2: generated PDFs/XLSXs, template files
- Workers: template engine, tax calculator,
           deadline scheduler (Cron Triggers — free),
           Monobank webhook receiver + nightly statement poller
- Durable Objects or KV: notification state (free tier)

External integrations (free):
- Monobank API (api.monobank.ua) — webhook + polling
- Telegram Bot API — deadline notifications
```

**Free tier limits we care about:**
- Workers: 100K requests/day — more than enough for 1-5 users
- D1: 5M rows read / 100K rows written per day — abundant (accessed via `context.db`, a Drizzle ORM instance bound in root loader)
- R2: 10GB storage, 10M reads/month — plenty for documents
- Cron Triggers: 5 triggers — enough for daily deadline checks

---

## 4. Implementation Phases

### Phase 1: Document Generation Engine (highest impact, solves daily pain)

**What:** Generate acts (акти виконаних робіт), invoices (рахунки), delivery notes (видаткові накладні) from templates, with per-document price overrides, optional stamp/signature images, and Excel math.

**How:**
- Templates stored in R2 as JSON schema (not raw XLSX — too complex to manipulate on Workers)
- Template editor in-app: visual form builder defining document sections, fields, formulas
- Document generation pipeline: template + data → server-side render → XLSX via `ExcelJS` (runs in Workers) and PDF via `jsPDF` or html-to-pdf approach
- Generated documents stored in R2 with audit metadata in D1
- Stamp/signature: uploaded as images to R2, referenced in template, conditionally included

**Schema additions** (`apps/web/app/database/schema.ts`, generate migration with `npm run db:generate`):
```typescript
export const documentTemplate = sqliteTable('document_template', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  type: text().notNull(), // 'act' | 'invoice' | 'delivery_note'
  schemaJson: text('schema_json').notNull(),
  stampImageKey: text('stamp_image_key'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
export const document = sqliteTable('document', {
  id: integer().primaryKey({ autoIncrement: true }),
  templateId: integer('template_id').references(() => documentTemplate.id).notNull(),
  companyId: integer('company_id').references(() => company.id).notNull(),
  dataJson: text('data_json').notNull(),
  createdBy: text('created_by').notNull(), // from context.user.email
  createdAt: text('created_at').notNull(),
  exportedAt: text('exported_at'),
  exportFormat: text('export_format'), // 'xlsx' | 'pdf'
  r2Key: text('r2_key'),
});
export const documentAuditLog = sqliteTable('document_audit_log', {
  id: integer().primaryKey({ autoIncrement: true }),
  documentId: integer('document_id').references(() => document.id).notNull(),
  action: text().notNull(), // 'created' | 'exported' | 'deleted'
  actorEmail: text('actor_email').notNull(),
  timestamp: text().notNull(),
});
```

**Verdict on existing plan ideas:** Plan 1 (DOCUMENTS_GENERATION.md) is solid. The GitHub-as-storage idea is creative but adds complexity for no gain — R2 is free and simpler. Monaco Editor for template editing is overkill for business users; a structured form builder is better.

### Phase 2: Income Ledger + Tax Calculator (enables quarterly reporting)

**What:** Automatic income register from generated documents + bank data. Tax calculation for quarterly declarations.

**How:**
- Every generated invoice/act with a payment date auto-populates the income register
- Manual entry for income not tied to a generated document
- **Automated bank integration (two tiers):**
  - **Tier 1 — Monobank API (fully automated, free):**
    - Owner generates a personal API token at api.monobank.ua (one-time, via Monobank app)
    - App registers a **webhook** (`POST /personal/webhook`) pointing to a Worker endpoint — Monobank pushes every transaction in real-time
    - Each webhook payload includes: `counterEdrpou`, `counterIban`, `counterName`, `amount` (kopecks), `description` (призначення платежу), `time`
    - Auto-match incoming payments to counteragents in the library by EDRPOU
    - Historical backfill via `GET /personal/statement/{account}/{from}/{to}` (max 31-day window, 1 req/60s rate limit) — a Cron Trigger job can pull the last month nightly
    - **Zero cost, zero maintenance** — Monobank pushes data to us
  - **Tier 2 — CSV/Excel import (PrivatBank and all other banks):**
    - Upload page in the app accepting CSV/XLSX exports from Privat24 for Business, ПУМБ Online, Ощад 24/7, etc.
    - Parser handles common bank export formats (date, amount, counterparty, EDRPOU, IBAN, payment purpose)
    - Semi-automated: owner downloads statement from bank → uploads to app → system parses and reconciles
    - Duplicate detection by transaction date + amount + counterparty IBAN to prevent re-imports
- **Reconciliation view:** unmatched bank transactions highlighted for manual linking to documents/counteragents
- Tax calculator: sums quarterly income, computes 3% unified tax + 1% military levy + ESV
- VAT ledger: tracks input/output VAT from tax invoices, computes monthly VAT liability
- Export: pre-filled declaration data as printable summary (the owner submits via cabinet.tax.gov.ua)

**Why Monobank-first:** It is the only Ukrainian bank with a free, documented, public REST API that supports FOP accounts. No other bank (including PrivatBank) offers reliable programmatic access. The NBU open banking framework exists on paper but has no practical adoption yet. If the FOP uses Monobank as their primary business account, income tracking becomes fully hands-off.

**Schema additions** (`apps/web/app/database/schema.ts`):
```typescript
export const incomeEntry = sqliteTable('income_entry', {
  id: integer().primaryKey({ autoIncrement: true }),
  date: text().notNull(),
  amountUah: integer('amount_uah').notNull(), // kopecks
  counteragentId: integer('counteragent_id').references(() => company.id),
  documentId: integer('document_id').references(() => document.id),
  paymentType: text('payment_type'), // 'bank' | 'cash'
  notes: text(),
  source: text().notNull(), // 'monobank_webhook' | 'csv_import' | 'manual' | 'document'
  bankTxId: text('bank_tx_id'), // dedupe key for bank transactions
});
export const bankConnection = sqliteTable('bank_connection', {
  id: integer().primaryKey({ autoIncrement: true }),
  bank: text().notNull(), // 'monobank'
  tokenEncrypted: text('token_encrypted').notNull(),
  webhookUrl: text('webhook_url'),
  lastSync: text('last_sync'),
  status: text().notNull(), // 'active' | 'error'
});
export const vatRecord = sqliteTable('vat_record', {
  id: integer().primaryKey({ autoIncrement: true }),
  date: text().notNull(),
  taxInvoiceNumber: text('tax_invoice_number'),
  counteragentId: integer('counteragent_id').references(() => company.id),
  amount: integer().notNull(), // kopecks
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
  esvSelf: integer('esv_self'), // derived: min_wage × 22%, kopecks
  status: text().notNull(), // 'open' | 'filed'
});
```

### Phase 3: Employee Management + Payroll (quarterly reporting obligation)

**What:** Track 3 employees, calculate salaries, withhold taxes, generate payroll documents.

**How:**
- Employee profiles: name, tax ID, position, hire date, salary
- Monthly salary calculation: gross → ПДФО (18%) → ВЗ (5%) → net
- Employer costs: ESV (22% of gross)
- Timesheet tracking (simple calendar view)
- Payroll statement generation (розрахунково-платіжна відомість)
- Quarterly unified report data preparation (ЄСВ + ПДФО + ВЗ)
- Leave tracking with annual leave balance

**Schema additions** (`apps/web/app/database/schema.ts`):
```typescript
export const employee = sqliteTable('employee', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  taxId: text('tax_id').notNull().unique(), // ІПН
  position: text().notNull(),
  hireDate: text('hire_date').notNull(),
  salaryGross: integer('salary_gross').notNull(), // kopecks
  status: text().notNull(), // 'active' | 'dismissed'
});
export const payroll = sqliteTable('payroll', {
  id: integer().primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').references(() => employee.id).notNull(),
  month: integer().notNull(), // 1–12
  year: integer().notNull(),
  gross: integer().notNull(), // kopecks
  pdfo: integer().notNull(), // 18% of gross, kopecks
  vz: integer().notNull(), // 5% of gross (military levy on wages), kopecks
  esvEmployer: integer('esv_employer').notNull(), // 22% of gross, kopecks
  net: integer().notNull(), // gross - pdfo - vz, kopecks
  paidAt: text('paid_at'),
});
export const timesheetEntry = sqliteTable('timesheet_entry', {
  id: integer().primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').references(() => employee.id).notNull(),
  date: text().notNull(),
  hours: integer().notNull(),
  type: text().notNull(), // 'work' | 'leave' | 'sick' | 'holiday'
});
export const leaveRecord = sqliteTable('leave_record', {
  id: integer().primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').references(() => employee.id).notNull(),
  type: text().notNull(), // 'annual' | 'sick' | 'unpaid'
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  days: integer().notNull(),
});
```

**Verdict on plan 4 (EMPLOYEES_MANAGEMENT.md):** Good direction. The "share from profit" idea is interesting for installation businesses — implement as a bonus/commission field on payroll, linked to documents. Calendar view is useful.

### Phase 4: Deadline Engine + Notifications (prevents penalties)

**What:** Automated reminders for all tax deadlines, document expiry, and pending actions.

**How:**
- Cloudflare Cron Trigger (free, up to 5 schedules): run daily at 8:00 AM
- Deadline rules engine: computes all upcoming deadlines based on current date + tax calendar
- In-app notification bell (as described in plan 2) with unread count
- External notifications via **Telegram Bot API** (free, no server needed — call from Worker):
  - Owner creates a Telegram bot via @BotFather (free)
  - Bot sends reminders to a private chat/group
  - Much simpler than email (no SMTP needed) and more reliable than Viber
- Notification types:
  - "VAT declaration for March due in 5 days"
  - "Quarterly tax declaration due in 10 days"
  - "ESV payment due this week"
  - "Employee leave balance low"
  - "Document #X awaiting export"

**Schema additions** (`apps/web/app/database/schema.ts`):
```typescript
export const notification = sqliteTable('notification', {
  id: integer().primaryKey({ autoIncrement: true }),
  type: text().notNull(), // 'vat_deadline' | 'tax_deadline' | 'esv_payment' | 'kep_expiry' | etc.
  message: text().notNull(),
  dueDate: text('due_date').notNull(),
  acknowledged: integer({ mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});
export const notificationSetting = sqliteTable('notification_setting', {
  id: integer().primaryKey({ autoIncrement: true }),
  channel: text().notNull(), // 'telegram' | 'in_app'
  configJson: text('config_json').notNull(), // { chatId, botToken } for Telegram
  enabled: integer({ mode: 'boolean' }).default(true),
});
```

**Verdict on plan 2 (NOTIFICATIONS.md):** Telegram Bot API is the zero-cost winner. Email requires a mail service. The "OpenClaw on laptop" idea adds maintenance burden. Keep it simple: Telegram + in-app bell.

### Phase 5: Smart Assistance (nice-to-have, leverage free AI when available)

**What:** AI-assisted document generation, value suggestions, basic business analytics.

**How (zero-cost approaches):**
- **Rule-based "AI"** first: auto-fill company details from library, suggest last-used prices, auto-calculate VAT splits. This covers 80% of plan 3's use cases without any AI.
- **Business analytics:** D1 SQL aggregations → charts via lightweight client-side library (Chart.js). Monthly/quarterly income trends, top clients, expense breakdown.
- **Prompt-based generation:** If/when Cloudflare Workers AI offers free-tier LLM access (currently in beta), wire it up. Until then, the structured template approach with smart defaults is more reliable anyway.

**Verdict on plan 3 (ML_TWIST.md):** The "generate invoice for 2000 UAH" prompt idea is genuinely useful, but only viable once a free LLM is available on Workers. Park it. Rule-based auto-fill covers the immediate need.

---

## 5. Priority Matrix

| Phase | Impact | Effort | Dependencies | Priority |
|---|---|---|---|---|
| 1. Document Generation | Critical — daily use | High (2-3 weeks) | Existing library module | **Do first** |
| 2. Income Ledger + Tax | Critical — quarterly compliance | Medium (1-2 weeks) | Phase 1 (documents feed income) | **Do second** |
| 3. Employee Management | High — quarterly reporting | Medium (1-2 weeks) | Independent | **Do third** |
| 4. Deadline + Notifications | High — prevents penalties | Low (3-5 days) | Phases 2+3 (knows what to remind about) | **Do fourth** |
| 5. Smart Assistance | Nice-to-have | Low-Medium | All phases | **Do last** |

---

## 6. Key Decisions

### What to build vs. what to use externally

| Function | Build | Use Externally |
|---|---|---|
| Document generation (acts, invoices, notes) | **Build** | — |
| Income tracking (Monobank webhook + CSV import) | **Build** | — |
| Tax calculation | **Build** | — |
| Payroll calculation | **Build** | — |
| Employee management | **Build** | — |
| Deadline reminders | **Build** | — |
| VAT declaration filing | — | **cabinet.tax.gov.ua** |
| Tax invoice ЄРПН registration | — | **cabinet.tax.gov.ua** |
| QES digital signature | — | **Diia.Підпис** |
| Cash register (PRRO) | — | **Free DPS PRRO app** |
| Bank data — Monobank | **Build** (webhook receiver + API poller) | — |
| Bank data — PrivatBank & others | **Build** (CSV parser) | **Manual export from bank UI** |

### Template format

JSON schema stored in D1/R2, not raw XLSX files. Reasons:
- XLSX manipulation in Workers is fragile and memory-heavy
- JSON schema → ExcelJS rendering is deterministic and testable
- Same schema can render to both XLSX and PDF
- Template editor becomes a form builder, not a spreadsheet editor

### Notification channel

Telegram Bot API. Free, instant, works offline (phone notifications), no email infrastructure needed. Fallback: in-app notifications only.

### Tax calendar approach

Hardcoded rules engine, not a database of dates. Deadlines follow a formula (40 days after quarter end, 20th of next month for VAT, etc.). Weekend/holiday shifting logic included. Updated via code when tax law changes (rare — maybe once a year).

---

## 7. Reporting Calendar Summary (Built Into the App)

### Monthly
- [ ] VAT declaration data prepared (by 15th)
- [ ] Tax invoices registered in ЄРПН (within 15 days of each transaction)

### Quarterly (Q1 example — deadlines shift if weekend)
- [ ] Sum quarterly income → unified tax declaration
- [ ] Prepare unified payroll report (ЄСВ+ПДФО+ВЗ)
- [ ] Pay unified tax (3% of income) by ~May 20
- [ ] Pay military levy (1% of income)
- [ ] Pay ESV for self (minimum wage × 22% × 1 month — derived programmatically at runtime, not hardcoded)
- [ ] File declarations via cabinet.tax.gov.ua by ~May 10

### Annually (with Q4 declaration)
- [ ] Annual ESV report (Appendix 1 to unified tax declaration)
- [ ] Confirm all 12 months of ESV paid

---

## 8. Risk Assessment

| Risk | Mitigation |
|---|---|
| Cloudflare free tier limits exceeded | At 1-5 users and ~100 docs/month, we're at <1% of limits |
| Tax law changes | Tax rules are in code, not config — update annually. Deadline engine tests catch regressions |
| Owner forgets to file despite reminders | Telegram notifications are hard to ignore. Escalating reminder cadence (10 days, 5 days, 2 days, 1 day, overdue) |
| Workers AI free tier disappears or never materializes | Phase 5 is optional. Rule-based auto-fill covers core needs |
| D1/R2 data loss | Cloudflare provides built-in durability. Additionally, periodic R2 backup to a second bucket (free) or local export |
| QES/КЕП expires | Deadline engine tracks КЕП expiry date as a reminder item |

---

## 9. What We're Discarding from Existing Plans

| Idea | Verdict | Why |
|---|---|---|
| GitHub API for document storage | **Discard** | Adds Git complexity, R2 is simpler and free |
| Monaco Editor for templates | **Discard** | Business users need a form builder, not a code editor. Dependency removed from package.json. |
| Email notifications | **Discard** | Requires SMTP service (cost) or Cloudflare Email Workers (limited). Telegram is free and better for mobile |
| Viber integration | **Discard** | Viber Business API is paid. Telegram Bot API is free |
| OpenClaw on laptop | **Discard** | Violates zero-maintenance — requires a running laptop/server |
| Full AI document generation | **Defer to Phase 5** | No reliable free LLM on Workers yet. Rule-based approach first |

---

## 10. Next Steps

1. **Finalize document template schema** — define JSON structure for acts, invoices, delivery notes based on existing Excel templates the business uses today
2. **Implement Phase 1** — document generation is the highest-impact feature and unblocks everything else
3. **Add `employee` and `payroll` tables** to the schema alongside document tables (Phase 3 schema is independent, can be added early)
4. **Set up Cron Trigger** for deadline engine early — even before full implementation, a basic "upcoming deadlines" dashboard is valuable

---

*Generated 2026-03-30. Review quarterly — Ukrainian tax law changes annually, typically effective January 1.*
