import { eq } from 'drizzle-orm';

import { item as table_item, type Item } from '~/database/schema';

import type { Route } from '../../../../.react-router/types/app/routes/library/_api/+types/item-management';

export async function action({ request, context }: Route.ActionArgs) {
  let returnValue;
  try {
    const fd = await request.formData();
    let values: Item = {};
    fd.forEach((v, k) => {
      values = { ...values, [k]: v };
    });
    const { id, ...insertValues } = values;
    if (id) {
      returnValue = await context.db
        .update(table_item)
        .set(insertValues)
        .where(eq(table_item.id, id))
        .returning();
    } else {
      returnValue = await context.db.insert(table_item).values(insertValues).returning();
    }
  } catch (e) {
    console.error(e);
    return { data: null, error: e.message };
  }

  return {
    data: returnValue,
    error: !returnValue || returnValue?.length === 0 ? 'Unable to manage item' : null,
  };
}

export type IMLoader = typeof action;
