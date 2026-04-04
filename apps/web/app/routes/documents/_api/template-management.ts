import { eq } from 'drizzle-orm';

import { documentTemplate } from '~/database/schema';

import type { Route } from '../../../../.react-router/types/app/routes/documents/_api/+types/template-management';

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  try {
    if (action === 'list') {
      const type = url.searchParams.get('type');
      const query = type
        ? context.db.select().from(documentTemplate).where(eq(documentTemplate.type, type))
        : context.db.select().from(documentTemplate);
      const templates = await query;
      return { data: templates, error: null };
    }

    if (action === 'get') {
      const id = Number(url.searchParams.get('id'));
      if (!id) return { data: null, error: 'ID is required' };
      const [template] = await context.db
        .select()
        .from(documentTemplate)
        .where(eq(documentTemplate.id, id));
      return { data: template ?? null, error: template ? null : 'Template not found' };
    }

    return { data: null, error: 'Unknown action' };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function action({ request, context }: Route.ActionArgs) {
  try {
    if (request.method === 'DELETE') {
      const url = new URL(request.url);
      const id = Number(url.searchParams.get('id'));
      if (!id) return { data: null, error: 'ID is required' };
      const r = await context.db
        .delete(documentTemplate)
        .where(eq(documentTemplate.id, id))
        .returning();
      return { data: r, error: null };
    }

    const fd = await request.formData();
    const now = new Date().toISOString();

    const values = {
      name: fd.get('name') as string,
      type: fd.get('type') as string,
      schemaJson: fd.get('schemaJson') as string,
      stampImageKey: (fd.get('stampImageKey') as string) || null,
    };

    const idStr = fd.get('id');
    const id = idStr ? Number(idStr) : undefined;

    if (id) {
      const r = await context.db
        .update(documentTemplate)
        .set({ ...values, updatedAt: now })
        .where(eq(documentTemplate.id, id))
        .returning();
      return { data: r, error: null };
    }

    const r = await context.db
      .insert(documentTemplate)
      .values({ ...values, createdAt: now, updatedAt: now })
      .returning();
    return { data: r, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export type TemplateManagementLoader = typeof loader;
export type TemplateManagementAction = typeof action;
