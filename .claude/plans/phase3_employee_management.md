# Phase 3: Employee Management + Payroll

> **Legal basis:** validate against `.claude/skills/ukrainian-accounting/references/05-payroll-employees.md` and `04-military-levy-esv.md`. Corrected on 2026-06-25 per `findings-initial-review.md` (conflict C6; gaps G6, G7, G9, terminology).

## Goal

Manage up to ~10 employees: profiles, monthly payroll calculation, timesheets, leave tracking. Generate payroll documents (розрахунково-платіжна відомість). Prepare the unified report data (ЄСВ + ПДФО + ВЗ) on the correct cadence (ЮО employer → monthly; ФОП employer → quarterly — see Phase 4 / `references/05`).

## Prerequisites

- Library module complete (company, item tables)
- Phase 1 optionally complete (payroll document generation reuses the document engine)
- No dependency on Phase 2 — can be implemented in parallel

---

## 1. Schema Changes

Add to `apps/web/app/database/schema.ts`:

```typescript
export const employee = sqliteTable('employee', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  taxId: text('tax_id', { length: 10 }).notNull().unique(), // РНОКПП (10 digits) — the individual's tax number, not the 12-digit ІПН ПДВ
  position: text().notNull(),
  hireDate: text('hire_date').notNull(), // ISO date
  // Legally mandatory: a Повідомлення про прийняття must reach ДПС BEFORE work begins
  // (КЗпП ст. 24; Постанова КМУ № 413). Track that it was filed.
  hireNotificationSentAt: text('hire_notification_sent_at'), // ISO date the ДПС notice was filed
  salaryGross: integer('salary_gross').notNull(), // kopecks
  status: text().notNull().default('active'), // 'active' | 'dismissed' | 'suspended'
  dismissDate: text('dismiss_date'),
});

export const payroll = sqliteTable('payroll', {
  id: integer().primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id')
    .references(() => employee.id)
    .notNull(),
  month: integer().notNull(), // 1–12
  year: integer().notNull(),
  workingDays: integer('working_days').notNull(), // actual days worked
  gross: integer().notNull(), // kopecks, may differ from salary if partial month
  bonus: integer().notNull().default(0), // kopecks, commissions/bonuses
  pdfo: integer().notNull(), // 18% of (gross + bonus), kopecks
  vz: integer().notNull(), // 5% of (gross + bonus), kopecks (military levy on wages)
  esvEmployer: integer('esv_employer').notNull(), // 22% of (gross + bonus), kopecks
  net: integer().notNull(), // gross + bonus - pdfo - vz, kopecks
  paidAt: text('paid_at'), // ISO date when actually paid
  documentId: integer('document_id'), // link to generated payroll document (Phase 1)
});

export const timesheetEntry = sqliteTable('timesheet_entry', {
  id: integer().primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id')
    .references(() => employee.id)
    .notNull(),
  date: text().notNull(), // ISO date
  hours: integer().notNull().default(8),
  type: text().notNull(), // 'work' | 'leave' | 'sick' | 'holiday' | 'unpaid'
});

export const leaveRecord = sqliteTable('leave_record', {
  id: integer().primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id')
    .references(() => employee.id)
    .notNull(),
  type: text().notNull(), // 'annual' | 'sick' | 'unpaid'
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  days: integer().notNull(),
  approvedAt: text('approved_at'),
});
```

After adding, run `npm run db:generate`.

---

## 2. Payroll Calculation Logic (`apps/web/app/lib/payroll-calculator.ts`)

Rates and the min-wage base come from dated config (mirror `references/08-volatile-values-2026.md`),
not hardcoded literals — ВЗ went 1.5% → 5% on 01.12.2024, exactly the kind of change a literal misses.

```typescript
// 2026 values shown for reference — load from config with an effective date.
const PDFO_RATE = 0.18; // ПДФО — ПКУ ст. 167.1
const VZ_RATE = 0.05;   // Військовий збір на зарплату — eff. 01.12.2024 (Закон 4015-IX)
const ESV_EMPLOYER_RATE = 0.22; // ЄСВ роботодавця — Закон 2464 ст. 8

export function calculatePayroll(
  taxableKopecks: number, // gross + bonus (the ПДФО/ВЗ base)
  cfg: {
    minimumWageKopecks: number; // for the ЄСВ minimum base
    isFullTime: boolean;        // full-time employees get the min-base rule
    esvRate?: number;           // 0.22 default; 0.0841 for employees with disability
  },
) {
  const pdfo = Math.round(taxableKopecks * PDFO_RATE);
  const vz = Math.round(taxableKopecks * VZ_RATE);

  // ЄСВ base rules (Закон 2464):
  //  - MINIMUM base: a full-time employee's ЄСВ base is at least the minimum wage,
  //    even when actual/prorated pay is lower (e.g. partial month). Charging 22% of a
  //    prorated gross below the min wage UNDERPAYS ЄСВ.
  //  - MAXIMUM base: capped at 20× minimum wage.
  const esvRate = cfg.esvRate ?? ESV_EMPLOYER_RATE;
  const maxBase = cfg.minimumWageKopecks * 20;
  let esvBase = Math.min(taxableKopecks, maxBase);
  if (cfg.isFullTime) esvBase = Math.max(esvBase, cfg.minimumWageKopecks);
  const esvEmployer = Math.round(esvBase * esvRate);

  const net = taxableKopecks - pdfo - vz; // ЄСВ is employer-borne, not withheld
  return { pdfo, vz, esvEmployer, net };
}

// Optional: податкова соціальна пільга (ПСП) reduces the ПДФО base only, for monthly
// income ≤ 4 660 грн (2026). Above that (incl. anyone at the 8 647 грн min wage) it does
// not apply — relevant only for part-time/low-norm pay. ПКУ ст. 169.

// Prorated salary for partial months (drives the ПДФО/ВЗ base, NOT the ЄСВ min base above)
export function proratedGross(salaryGross: number, workedDays: number, totalWorkingDays: number) {
  return Math.round(salaryGross * (workedDays / totalWorkingDays));
}
```

---

## 3. API Routes

All in `apps/web/app/routes/employees/_api/`:

### `employee-management.ts`

- `GET ?action=list` → all employees (active + dismissed)
- `POST action=create` → create employee. **Surface the ДПС hiring-notification obligation:** the employee may not lawfully start work until a `Повідомлення про прийняття` is filed to ДПС (КЗпП ст. 24; КМУ № 413). Either record `hireNotificationSentAt` here or block "active" status until it is set; warn if `hireDate` is reached without it.
- `POST action=mark-hire-notified` → set `hireNotificationSentAt`
- `POST action=update` → update employee (salary, position)
- `POST action=dismiss` → set status=dismissed, dismissDate

### `payroll-management.ts`

- `GET ?year=X&month=X` → list all payroll records for period
- `POST action=calculate` → auto-calculate payroll for all active employees for given month (creates draft records)
- `POST action=confirm` → mark payroll records as paid
- `GET ?action=unified-report&year=X&period=X` → aggregate ЄСВ+ПДФО+ВЗ for the Податковий розрахунок. **Cadence depends on entity type:** a legal-entity (ЮО) employer files **monthly**; a ФОП employer files **quarterly** (2026 reform — `references/05-payroll-employees.md`). Parameterize the period accordingly; do not assume quarterly.

### `timesheet-management.ts`

- `GET ?employeeId=X&month=X&year=X` → get timesheet entries
- `POST` → upsert timesheet entry (bulk for a month)

### `leave-management.ts`

- `GET ?employeeId=X` → list leave records
- `POST action=create` → create leave request
- `POST action=approve` → approve, generate timesheet entries

---

## 4. UI Routes

### `/employees` — Employee List

- DataTable: name, position, hire date, gross salary, status
- "Новий працівник" button → dialog form (name, ІПН, position, hire date, salary)
- Row click → employee detail

### `/employees/$id` — Employee Detail

- Profile info (editable)
- Monthly timesheet calendar view: each day shows type (work/leave/sick/holiday)
- Leave records list with "Додати відпустку" button
- Payroll history table

### `/employees/payroll` — Payroll

- Month/year selector
- Table: employee name, worked days, gross, ПДФО, ВЗ, ЄСВ роботодавця, net
- "Розрахувати" button → auto-fills all rows from employee salaries + timesheets
- "Підтвердити виплату" button → marks as paid, optionally generates payroll document
- "Квартальний звіт" tab → aggregate ЄСВ+ПДФО+ВЗ table ready for copy-paste into cabinet.tax.gov.ua

---

## 5. Sidebar Navigation

Add "Працівники" section to sidebar in `app/components/app-sidebar/index.tsx` with sub-items:

- `/employees` — Список
- `/employees/payroll` — Зарплата

---

## 6. i18n Additions (`apps/web/app/i18n.ts`)

Add Ukrainian labels for:

- Employee fields: ІПН, посада, дата прийому, оклад, статус
- Payroll fields: відпрацьовано, нараховано, ПДФО, ВЗ, ЄСВ, до виплати
- Leave types: щорічна відпустка, лікарняний, без збереження зарплати
- Timesheet types: робочий день, відпустка, лікарняний, вихідний

---

## 7. E2E Tests (`apps/web/e2e/employees.spec.ts`)

Required:

1. Navigate to `/employees` — employee list renders
2. Create an employee — appears in list with correct data
3. Navigate to `/employees/payroll` — payroll page renders
4. Calculate payroll for current month — verify ПДФО/ВЗ/ЄСВ amounts are mathematically correct
5. Confirm payroll as paid — status updates
6. Add leave record for employee — timesheet calendar reflects it
7. Quarterly report renders correct aggregated totals

---

## Definition of Done

- [ ] All schema tables created and migration applied
- [ ] Employees can be created, edited, dismissed; ДПС hiring notification (`hireNotificationSentAt`) tracked and enforced before "active"
- [ ] Payroll auto-calculates correctly: ПДФО 18% + ВЗ 5% withheld, ЄСВ 22% employer with the **minimum-wage base floor** (full-timers) and **20× cap** applied; rates from dated config
- [ ] Timesheet calendar correctly reflects work/leave/sick days
- [ ] Leave records deduct from timesheet
- [ ] Unified ЄСВ+ПДФО+ВЗ report aggregates correct totals on the entity-type cadence (ЮО monthly / ФОП quarterly)
- [ ] Sidebar navigation includes Employees section
- [ ] All E2E tests pass
