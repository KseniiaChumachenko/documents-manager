# Phase 4: Deadline Engine + Notifications

> **Legal basis:** validate against `.claude/skills/ukrainian-accounting/references/07-reporting-deadlines.md`. Corrected on 2026-06-25 per `findings-initial-review.md` (conflicts C2, C3, C4; gap G8). **A deadline engine that is wrong by a day or a direction causes real penalties — these fixes are load-bearing.**

## Goal

Automatically compute all upcoming tax and compliance deadlines. Send reminders via Telegram Bot API and in-app notification bell. Prevent penalties by alerting the owner well in advance.

## Prerequisites

- Phase 2 complete: `tax_period` table exists (deadline engine reads filed/open quarters)
- Phase 3 complete: `payroll` table exists (deadline engine checks quarterly payroll report)
- Cloudflare Cron Triggers available (1 slot needed: daily at 8 AM)

---

## 1. Schema Changes

Add to `apps/web/app/database/schema.ts`:

```typescript
export const notification = sqliteTable('notification', {
  id: integer().primaryKey({ autoIncrement: true }),
  type: text().notNull(),
  // 'vat_deadline' | 'tax_declaration' | 'esv_payment' | 'military_levy'
  // | 'payroll_report' | 'kep_expiry' | 'document_pending'
  message: text().notNull(),
  dueDate: text('due_date').notNull(), // ISO date of the actual deadline
  acknowledged: integer({ mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

export const notificationSetting = sqliteTable('notification_setting', {
  id: integer().primaryKey({ autoIncrement: true }),
  channel: text().notNull(), // 'telegram' | 'in_app'
  configJson: text('config_json').notNull(),
  // For telegram: JSON.stringify({ botToken: string, chatId: string })
  // Store botToken encrypted or use a Cloudflare Secret (wrangler secret put)
  enabled: integer({ mode: 'boolean' }).default(true),
});
```

After adding, run `npm run db:generate`.

---

## 2. Tax Calendar Rules Engine (`apps/web/app/lib/deadline-engine.ts`)

Deadlines are computed from formulas, not stored dates. Rules:

All deadlines derive from the statutory offsets in `references/07-reporting-deadlines.md`:
monthly → +20 days, quarterly → +40 days, annual → +60 days; payment → +10 days
after the filing deadline. **Never hardcode literal dates — compute `periodEnd + offset`,
then weekend-shift forward.**

```typescript
// Returns all deadlines for a given reference date (today)
export function computeUpcomingDeadlines(today: Date, profile: OwnerProfile): Deadline[] {
  const deadlines: Deadline[] = [];

  // VAT (only if owner is a VAT payer):
  if (profile.isVatPayer) {
    // Declaration: monthly, +20 days after month-end (ПКУ ст. 203.1)
    deadlines.push(vatDeclarationDeadline(today)); // ~20th
    // Payment: +10 days after the filing deadline (ст. 203.2) — a SEPARATE deadline (~30th)
    deadlines.push(vatPaymentDeadline(today));
    // ЄРПН registration of tax invoices (ст. 201.10):
    //   issued 1st–15th → register by the 5th of next month
    //   issued 16th–end → register by the 18th of next month
    deadlines.push(...erpnRegistrationDeadlines(today));
  }

  // Єдиний податок (Group 3): declaration quarterly, +40 days after quarter-end.
  //   Q1 (ends Mar 31) → May 10 | Q2 (Jun 30) → Aug 9 | Q3 (Sep 30) → Nov 9 | Q4 (Dec 31) → Feb 9
  //   ⚠ NOT the 10th for Q2–Q4 — 40 calendar days lands on the 9th. Compute it, don't hardcode.
  deadlines.push(...singleTaxDeadlines(today, profile));

  // Військовий збір: Group 3 quarterly (with ЄП); Groups 1/2/4 monthly by the 20th.
  deadlines.push(...militaryLevyDeadlines(today, profile));

  // ЄСВ:
  //   - Employer ЄСВ on salaries: MONTHLY, by the 20th of the following month (Закон 2464 ст. 9).
  //   - ФОП ЄСВ "за себе": may be paid quarterly, by the 20th of the month after the quarter.
  //   These are DIFFERENT cadences — do not collapse into one (was previously modelled quarterly).
  deadlines.push(...esvDeadlines(today, profile));

  // Unified ПДФО/ВЗ/ЄСВ report (Податковий розрахунок, 4ДФ):
  //   ⚠ 2026 cadence depends on entity type — ЮО employers MONTHLY (+20 days),
  //   ФОП/self-employed QUARTERLY (+40 days). Key off profile.entityType.
  //   (Verify against the current ДПС form order — reform was still settling in 2026.)
  deadlines.push(...payrollReportDeadlines(today, profile));

  return deadlines.filter(d => {
    const daysUntil = daysBetween(today, d.date);
    return daysUntil >= 0 && daysUntil <= 30; // show 30-day horizon
  });
}

// Weekend/holiday shift: ALWAYS forward to the next working (banking) day — ПКУ ст. 49.20 / 57.1.
//   Sat → Mon, Sun → Mon. NEVER backward to Friday (that would be legally wrong and, for
//   payment deadlines, cause a late payment). Also account for official public holidays.
function shiftToNextWorkingDay(date: Date): Date { ... }
```

`OwnerProfile` carries `{ entityType: 'legal' | 'fop', singleTaxGroup: 1|2|3, isVatPayer: boolean, hasEmployees: boolean }` — set in settings; it selects which deadlines apply.

Reminder cadence for each deadline: 10 days before, 5 days before, 2 days before, 1 day before, day-of, overdue.

---

## 3. Cron Worker (`apps/web/app/workers/deadline-cron.ts`)

Add to `wrangler.jsonc`:

```jsonc
"triggers": {
  "crons": ["0 6 * * *"]  // Daily at 6 AM UTC
}
```

Cron handler logic:

1. Call `computeUpcomingDeadlines(new Date(), ownerProfile)` (load `ownerProfile` from settings)
2. For each deadline at reminder threshold (10/5/2/1/0 days):
   a. Check if notification already sent today for this deadline type+date (skip if duplicate)
   b. Insert `notification` row
   c. If Telegram setting enabled: POST to Telegram Bot API `sendMessage`
3. No-op if nothing due

---

## 4. Telegram Integration

### Setup:

1. Owner creates bot via @BotFather, gets `botToken`
2. Owner gets their `chatId` (can use `getUpdates` endpoint to find it)
3. Both stored via `notificationSetting` row (or as Cloudflare Secrets for token)

### Send message from Worker:

```typescript
async function sendTelegram(botToken: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}
```

Message format example:

```
⚠️ <b>Нагадування</b>
Декларація з ПДВ за березень — до <b>20 квітня 2026</b>
Залишилося 5 днів.
```

---

## 5. In-App Notification Bell

### API route: `apps/web/app/routes/_api/notifications.ts`

- `GET` → list unacknowledged notifications, ordered by due_date
- `POST action=acknowledge&id=X` → mark notification as acknowledged
- `POST action=acknowledge-all` → mark all as acknowledged

### UI component: `apps/web/app/components/notification-bell/index.tsx`

- Bell icon in sidebar header (or top bar)
- Badge showing count of unacknowledged notifications
- Dropdown panel listing notifications with due dates
- Click notification → marks acknowledged
- "Позначити всі" button

---

## 6. Notification Settings UI

Route: `apps/web/app/routes/library/settings/notifications.tsx` (or a top-level `/settings`)

- Toggle: in-app notifications on/off
- Telegram section:
  - Input: Bot Token
  - Input: Chat ID
  - "Зберегти" button
  - "Надіслати тестове повідомлення" button → sends test message immediately
- КЕП expiry tracking:
  - Input: КЕП expiry date (manual entry — no API for this)
  - System adds deadline reminders 30/14/7 days before expiry

---

## 7. E2E Tests (`apps/web/e2e/notifications.spec.ts`)

Required:

1. Navigate to notifications settings — page renders with Telegram config form
2. Save Telegram settings — form saves without error
3. Notification bell renders in sidebar with correct unread count
4. Acknowledge a notification — count decreases
5. "Acknowledge all" — bell count goes to zero

Unit tests (Vitest) for `deadline-engine.ts` — these encode the corrected rules:

- VAT declaration deadline on a weekday → the 20th
- Deadline on a Saturday/Sunday → shifts **forward to the next Monday** (never back to Friday) — ст. 49.20
- VAT payment deadline = filing deadline + 10 days (separate from filing)
- Quarterly єдиний-податок deadline = quarter-end + 40 days → **Q1 May 10, Q2 Aug 9, Q3 Nov 9, Q4 Feb 9** (assert the 9th for Q2–Q4, not the 10th)
- Employer ЄСВ deadline = monthly, the 20th (NOT quarterly)
- ЄРПН: invoice dated 10th → register by the 5th of next month; dated 20th → by the 18th
- Reminder threshold logic (10/5/2/1 days)

---

## Definition of Done

- [ ] Schema tables created and migration applied
- [ ] `deadline-engine.ts` computes correct dates for all deadline types
- [ ] Cron trigger configured in `wrangler.jsonc`
- [ ] Cron worker inserts notifications and sends Telegram messages
- [ ] In-app notification bell shows unread count
- [ ] Notification settings UI allows Telegram configuration
- [ ] КЕП expiry reminders configurable
- [ ] All E2E tests pass
- [ ] Deadline engine unit tests pass
