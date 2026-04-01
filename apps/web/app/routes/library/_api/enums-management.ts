import { eq } from 'drizzle-orm';

import { itemType, unit } from '~/database/schema';

import { type Route } from '../../../../.react-router/types/app/routes/library/_api/+types/enums-management';

export async function action({ request, params, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = formData.get('name') as string;

  if (!name) {
    return { data: null, error: 'Name is required' };
  }

  const table = params.key === 'unit' ? unit : itemType;

  if (request.method === 'POST') {
    try {
      const r = await context.db.insert(table).values({ name }).returning();
      return { data: r, error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) };
    }
  }
  if (request.method === 'PUT') {
    try {
      const r = await context.db
        .update(table)
        .set({ name })
        .where(eq(table.name, params.id as string))
        .returning();
      return { data: r, error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) };
    }
  }
  if (request.method === 'DELETE') {
    try {
      const r = await context.db
        .delete(table)
        .where(eq(table.name, params.id as string))
        .returning();
      return { data: r, error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) };
    }
  }
  return { data: null, error: 'Method not allowed' };
}
