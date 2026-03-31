# Phase 5: Smart Assistance

## Goal
Reduce manual data entry through rule-based auto-fill, provide business analytics dashboards, and optionally integrate Cloudflare Workers AI for document generation assistance when a free LLM tier becomes reliably available.

## Prerequisites
- All phases 1–4 complete (analytics aggregate data from all modules)
- Phase 1 complete minimum (auto-fill applies to document creation)

---

## Part A: Rule-Based Auto-Fill (implement first — no AI needed)

### Document creation auto-fill (`apps/web/app/lib/auto-fill.ts`)

When a user starts a new document:
1. **Company pre-fill:** If only one company of the required type exists, auto-select it
2. **Last-used prices:** For each line item added, default `price_override` to the most recently used price for that item+company combination (query last 5 documents)
3. **Document number:** Auto-increment from last document of the same type (e.g. "РФ-0042" → "РФ-0043")
4. **Date:** Default to today
5. **Stamp:** Default to last-used stamp preference per template

### Payroll auto-fill
- When calculating payroll for a new month, carry forward previous month's worked days if no timesheet changes
- Auto-calculate prorated salary for employees hired mid-month (compare hire_date to month start)

### Implementation: no new routes needed — add auto-fill logic to existing document creation and payroll loaders

---

## Part B: Business Analytics Dashboard

### Home page (`apps/web/app/routes/home/index.tsx`)
Replace the current stub with a real dashboard. All data from D1 aggregations via `context.db`.

**Widgets:**
1. **Monthly income chart** — bar chart, last 12 months. Data: `SELECT strftime('%Y-%m', date) as month, SUM(amount_uah) FROM income_entry GROUP BY month`
2. **Top 5 clients** — by income YTD. Join `income_entry` → `company`
3. **Upcoming deadlines** — next 3 notifications from `notification` table (unacknowledged, ordered by due_date)
4. **Current quarter tax summary** — unified tax + military levy + ESV totals for open quarter
5. **Documents this month** — count of documents created, count exported

**Chart library:** `chart.js` with `react-chartjs-2` wrapper (pure client-side, no server rendering needed). Lightweight, no native dependencies.

Dependencies to add to `apps/web/package.json`:
```json
"chart.js": "^4.4.0",
"react-chartjs-2": "^5.2.0"
```

### Analytics route: `apps/web/app/routes/home/index.tsx`
- Loader fetches all dashboard data in a single `Promise.all` of D1 queries
- Returns aggregated data to client
- Charts rendered client-side with Chart.js

---

## Part C: Cloudflare Workers AI Integration (defer until free tier is stable)

**Do not implement until** Cloudflare Workers AI offers a reliable free-tier LLM (models like `@cf/meta/llama-3.1-8b-instruct` are in beta as of early 2026 — verify current status before starting).

When implemented:

### Endpoint: `apps/web/app/routes/_api/ai-assist.ts`
- `POST` with `{ prompt: string, context: { recentDocuments, companies, items } }`
- Calls `env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages: [...] })`
- Returns structured JSON: `{ templateId, companyId, lineItems: [{itemId, quantity, price}] }`
- Client pre-fills document creation form from the response — user confirms before submitting

### UI: "AI-помічник" button on document creation page
- Text input: "Створи рахунок для ТОВ Рога і Копита на 2000 грн за монтаж"
- Calls AI endpoint → pre-fills form
- User reviews and submits

**Fallback:** If AI call fails or returns unexpected output, show error and let user fill manually. Never auto-submit without user confirmation.

---

## E2E Tests

### Part A:
1. Create document — verify document number auto-increments
2. Add line item already used in previous document — verify price defaults to last-used value
3. Create payroll for a new month — verify carry-forward from previous month

### Part B:
1. Navigate to home page — dashboard renders with all widgets
2. Income chart shows data for months with income entries
3. Upcoming deadlines widget shows next 3 unacknowledged notifications

### Part C (when implemented):
1. Enter a natural language prompt — form pre-fills with AI response
2. Invalid/malformed AI response — error shown, form remains editable

---

## Definition of Done

### Part A:
- [ ] Document number auto-increments correctly
- [ ] Last-used prices populate on line item add
- [ ] Mid-month hire prorated salary correct

### Part B:
- [ ] Home dashboard renders all 5 widgets
- [ ] Income chart shows correct 12-month data
- [ ] All E2E tests pass

### Part C (optional, when AI free tier confirmed):
- [ ] AI endpoint parses prompt and returns structured pre-fill data
- [ ] Form pre-fills correctly from AI response
- [ ] Malformed AI response handled gracefully
