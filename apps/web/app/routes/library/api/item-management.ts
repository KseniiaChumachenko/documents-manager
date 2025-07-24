import { eq } from 'drizzle-orm';

import { item as table_item } from '~/database/schema';
import { valueFromSP } from '~/lib/value-from-sp';

import type { Route } from '../../../../.react-router/types/app/routes/library/api/+types/item-management';

type TItem = typeof table_item.$inferInsert;

export async function loader({ request, context }: Route.LoaderArgs) {
  let returnValue;
  try {
    const values = valueFromSP<TItem>(request);
    // Id indicated editing of item, not adding
    const id = values?.id;

    if (id) {
      returnValue = await context.db
        .update(table_item)
        .set(values)
        .where(eq(table_item.id, id))
        .returning();
    } else {
      returnValue = await context.db.insert(table_item).values(values).returning();
    }
  } catch (e) {
    return { data: null, error: e.message };
  }

  return {
    data: returnValue,
    error: !returnValue || returnValue?.length === 0 ? 'Unable to manage item' : null,
  };
}

export type IMLoader = typeof loader;
