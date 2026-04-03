import { eq } from 'drizzle-orm';

import { item as table_item, type Item } from '~/database/schema';

import type { Route } from '../../../../.react-router/types/app/routes/library/_api/+types/item-management';

export async function action({ request, context }: Route.ActionArgs) {
  let returnValue;
  try {
    const fd = await request.formData();
    const values: Omit<Item, 'id'> & { id?: number } = {
      name: fd.get('name') as string,
      type: fd.get('type') as string,
      unit: fd.get('unit') as string | null,
      priceInputVATFree: Number(fd.get('priceInputVATFree')),
      priceOutputVATFree: Number(fd.get('priceOutputVATFree')),
      priceRetailInclVAT: Number(fd.get('priceRetailInclVAT')),
    };
    const idStr = fd.get('id');
    const id = idStr ? Number(idStr) : undefined;
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
    console.error(e);
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }

  return {
    data: returnValue,
    error: !returnValue || returnValue?.length === 0 ? 'Unable to manage item' : null,
  };
}

export type IMLoader = typeof action;
