# Phase 3: Employee Management + Payroll

## Goal

Manage up to ~10 employees: profiles, monthly payroll calculation, timesheets, leave tracking. Generate payroll documents (розрахунково-платіжна відомість). Prepare quarterly unified report data (ЄСВ + ПДФО + ВЗ).

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
  taxId: text('tax_id').notNull().unique(), // ІПН (10 digits)
  position: text().notNull(),
  hireDate: text('hire_date').notNull(), // ISO date
  salaryGross: integer('salary_gross').notNull(), // kopecks
  status: text().notNull().default('active'), // 'active' | 'dismissed'
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

```typescript
// Tax rates (update in code when law changes, approx. annually)
const PDFO_RATE = 0.18; // ПДФО
const VZ_RATE = 0.05; // Військовий збір на зарплату
const ESV_EMPLOYER_RATE = 0.22; // ЄСВ роботодавця

export function calculatePayroll(grossKopecks: number, bonusKopecks = 0) {
  const taxable = grossKopecks + bonusKopecks;
  const pdfo = Math.round(taxable * PDFO_RATE);
  const vz = Math.round(taxable * VZ_RATE);
  const esvEmployer = Math.round(taxable * ESV_EMPLOYER_RATE);
  const net = taxable - pdfo - vz;
  return { pdfo, vz, esvEmployer, net };
}

// Prorated salary for partial months
export function proratedGross(salaryGross: number, workedDays: number, totalWorkingDays: number) {
  return Math.round(salaryGross * (workedDays / totalWorkingDays));
}
```

---

## 3. API Routes

All in `apps/web/app/routes/employees/_api/`:

### `employee-management.ts`

- `GET ?action=list` → all employees (active + dismissed)
- `POST action=create` → create employee
- `POST action=update` → update employee (salary, position)
- `POST action=dismiss` → set status=dismissed, dismissDate

### `payroll-management.ts`

- `GET ?year=X&month=X` → list all payroll records for period
- `POST action=calculate` → auto-calculate payroll for all active employees for given month (creates draft records)
- `POST action=confirm` → mark payroll records as paid
- `GET ?action=quarterly-report&year=X&quarter=X` → aggregate ЄСВ+ПДФО+ВЗ for quarterly report

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
- [ ] Employees can be created, edited, dismissed
- [ ] Payroll auto-calculates correctly for all employees
- [ ] Timesheet calendar correctly reflects work/leave/sick days
- [ ] Leave records deduct from timesheet
- [ ] Quarterly aggregate report shows correct ЄСВ+ПДФО+ВЗ totals
- [ ] Sidebar navigation includes Employees section
- [ ] All E2E tests pass
