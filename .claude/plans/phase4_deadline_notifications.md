# Phase 4: Deadline Engine + Notifications

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

```typescript
// Returns all deadlines for a given reference date (today)
export function computeUpcomingDeadlines(today: Date): Deadline[] {
  const deadlines: Deadline[] = [];

  // VAT declaration: 20th of every month for previous month
  // Filing deadline: 20th; if weekend → next Monday
  deadlines.push(vatDeadline(today));

  // Quarterly tax declaration: 40 days after quarter end
  // Q1 (Jan-Mar) → May 10 | Q2 → Aug 10 | Q3 → Nov 10 | Q4 → Feb 10 (next year)
  deadlines.push(...quarterlyTaxDeadlines(today));

  // ESV payment for self: same as quarterly tax declaration deadline
  deadlines.push(...esvSelfDeadlines(today));

  // Quarterly payroll report (ЄСВ+ПДФО+ВЗ): same 40-day window
  deadlines.push(...payrollReportDeadlines(today));

  return deadlines.filter(d => {
    const daysUntil = daysBetween(today, d.date);
    return daysUntil >= 0 && daysUntil <= 30; // show 30-day horizon
  });
}

// Weekend shift: if deadline falls on Sat → Fri, Sun → Mon
function shiftWeekend(date: Date): Date { ... }
```

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

1. Call `computeUpcomingDeadlines(new Date())`
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

Unit tests (Vitest) for `deadline-engine.ts`:

- VAT deadline on weekday → correct date
- VAT deadline on Saturday → shifts to Friday
- Q1 tax deadline → May 10
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
