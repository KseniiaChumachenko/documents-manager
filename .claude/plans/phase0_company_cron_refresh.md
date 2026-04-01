# Phase 0 (Background): Company Data Cron Refresh

## Goal

Monthly background job that re-fetches data for all legal entity (ЄДРПОУ) companies from adm.tools and updates D1. ФОП entries are skipped (manual-only). Keeps counteragent data fresh without any manual effort.

## Prerequisites

- Migration 0005 applied: `company` table has `egrpou`, `ik`, `entity_type`, `last_sync` columns
- `save-company` API route works correctly (already implemented)
- Cloudflare Cron Triggers available (1 slot needed)
- R2 bucket available for storing the codes CSV

## Status

Schema and API routes are already implemented. This plan covers only the cron worker and R2 CSV storage.

---

## 1. No Schema Changes Required

All required columns exist: `egrpou`, `entity_type`, `last_sync`.

---

## 2. Codes CSV in R2

Store a CSV of all company codes in R2 under key `company-codes/codes.csv`:

```
egrpou,type
12345678,client
87654321,source
...
```

This CSV is the source of truth for the bulk refresh. Managed manually (upload via a simple admin route or wrangler CLI: `wrangler r2 object put staging-template/company-codes/codes.csv --file codes.csv`).

**Alternative:** Skip the CSV entirely — query all `company` rows with `entity_type = 'legal'` directly from D1. Simpler, no R2 dependency for this feature.

**Recommendation:** Use D1 query approach (no CSV). The CSV adds maintenance overhead.

---

## 3. Cron Worker (`apps/web/app/workers/company-refresh.ts`)

Add to `wrangler.jsonc` cron triggers (alongside the deadline cron from Phase 4):

```jsonc
"triggers": {
  "crons": ["0 6 * * *", "0 3 1 * *"]
  // Daily 6 AM: deadline engine
  // 3 AM on 1st of each month: company refresh
}
```

Worker logic:

```typescript
export async function companyRefreshCron(env: Env) {
  // 1. Query all legal entities not synced in the last 25 days
  const stale = await db
    .select()
    .from(company)
    .where(
      and(
        eq(company.entity_type, 'legal'),
        or(
          isNull(company.last_sync),
          lt(company.last_sync, new Date(Date.now() - 25 * 86400 * 1000).toISOString())
        )
      )
    );

  // 2. For each: fetch from adm.tools, upsert D1
  // Rate limit: adm.tools has no documented rate limit, but be polite
  // Use sequential fetches with no sleep (Workers has 15min CPU limit on paid plan)
  for (const co of stale) {
    if (!co.egrpou) continue; // skip FOPs
    try {
      const data = await fetchFromAdmTools(co.egrpou, env.VITE_GOV_API);
      if (data) {
        await db
          .update(company)
          .set({ ...data, last_sync: new Date().toISOString() })
          .where(eq(company.egrpou, co.egrpou));
      }
    } catch (e) {
      // log error, continue with next company
      console.error(`Failed to refresh ${co.egrpou}:`, e);
    }
  }
}
```

Reuse the XML parsing logic already in `search-company.ts` — extract it to a shared `apps/web/app/lib/adm-tools.ts` helper.

---

## 4. Shared Library (`apps/web/app/lib/adm-tools.ts`)

Extract from `search-company.ts`:

```typescript
export async function fetchFromAdmTools(egrpou: string, apiBase: string) {
  const res = await fetch(`${apiBase}?egrpou=${egrpou}`);
  if (!res.ok) return null;
  const buffer = await res.arrayBuffer();
  const xmlText = windows1251decode(new Uint8Array(buffer));
  const parser = new XMLParser({
    allowBooleanAttributes: true,
    attributeNamePrefix: '',
    ignoreAttributes: false,
  });
  const result = parser.parse(xmlText);
  if (result?.error) return null;
  return result.export.company;
}
```

Update `search-company.ts` to import from this shared helper.

---

## 5. Manual Trigger Route (optional)

`apps/web/app/routes/library/_api/refresh-companies.ts`

- `POST` — triggers a one-off refresh for all stale companies (same logic as cron)
- Useful for first-time setup or after adding many new companies
- Protected: only `context.user.email` can trigger (Zero Trust already handles auth)

---

## 6. E2E Tests (`apps/web/e2e/library-companies.spec.ts`)

Add to existing company tests:

1. Verify `last_sync` field updates after a company is saved/refreshed
2. (Integration) Mock `VITE_GOV_API` response — verify company data updates in D1

---

## Definition of Done

- [ ] `adm-tools.ts` helper extracted and `search-company.ts` updated to use it
- [ ] Cron trigger added to `wrangler.jsonc`
- [ ] Cron worker queries stale legal entities and refreshes them
- [ ] Errors per-company are logged and don't abort the whole run
- [ ] Manual trigger route works
- [ ] E2E tests pass
