import { and, eq, isNotNull, isNull, lt, or, SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

import * as schema from '../../database/schema';
import { company } from '../../database/schema';
import { fetchFromAdmTools } from '../lib/adm-tools';

export interface RefreshResult {
  total: number;
  refreshed: number;
  failed: number;
  skipped: number;
  errors: Array<{ egrpou: string; error: string }>;
}

export async function refreshStaleCompanies(
  d1Db: D1Database,
  govApiUrl: string,
  staleDays: number = 7
): Promise<RefreshResult> {
  const db = drizzle(d1Db, { schema });

  const staleThreshold = new Date(Date.now() - staleDays * 86400 * 1000).toISOString();

  const stale = await db
    .select()
    .from(company)
    .where(
      and(
        eq(company.entity_type, 'legal'),
        isNotNull(company.egrpou),
        or(
          isNull(company.last_sync),
          lt(company.last_sync as unknown as SQL<string>, staleThreshold)
        )
      )
    );

  const result: RefreshResult = {
    total: stale.length,
    refreshed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  for (const co of stale) {
    if (!co.egrpou) {
      result.skipped++;
      continue;
    }

    try {
      const data = await fetchFromAdmTools(co.egrpou, govApiUrl);
      if (data) {
        await db
          .update(company)
          .set({
            name: data.name,
            name_short: data.name_short ?? co.name_short,
            address: data.address ?? co.address,
            director: data.director ?? co.director,
            director_gen: data.director_gen ?? co.director_gen,
            kved: data.kved ?? co.kved,
            kved_number: data.kved_number ?? co.kved_number,
            inn: data.inn ?? co.inn,
            inn_date: data.inn_date ?? co.inn_date,
            last_sync: new Date().toISOString(),
          })
          .where(eq(company.egrpou, co.egrpou));

        result.refreshed++;
      } else {
        result.skipped++;
      }
    } catch (e) {
      result.failed++;
      result.errors.push({
        egrpou: co.egrpou,
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  }

  return result;
}
