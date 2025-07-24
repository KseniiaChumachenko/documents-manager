import { eq } from 'drizzle-orm';

import { itemType, unit } from '~/database/schema';

import { type Route } from '../../../../.react-router/types/app/routes/library/api/+types/enums-management';

export async function action({ request, params, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = formData.get('name');

  const table = params.key === 'unit' ? unit : itemType;

  if (request.method === 'POST') {
    try {
      const r = await context.db.insert(table).values({ name }).returning();
      return { data: r, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  }
  if (request.method === 'PUT') {
    try {
      const r = await context.db
        .update(table)
        .set(name)
        .where(eq(table.name, params.id))
        .returning();
      return { data: r, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  }
  if (request.method === 'DELETE') {
    try {
      const r = await context.db.delete(table).where(eq(table.name, params.id)).returning();
      return { data: r, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  }
}
