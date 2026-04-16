import { eq } from 'drizzle-orm';

import { stamp } from '~/database/schema';

import type { Route } from '../../../../.react-router/types/app/routes/documents/_api/+types/stamp-upload';

export async function loader({ context }: Route.LoaderArgs) {
  try {
    const stamps = await context.db.select().from(stamp);
    return { data: stamps, error: null };
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

      // Get stamp to find R2 key
      const [existing] = await context.db.select().from(stamp).where(eq(stamp.id, id));
      if (existing) {
        await context.cloudflare.env.TEMPLATES.delete(existing.imageKey);
      }

      const r = await context.db.delete(stamp).where(eq(stamp.id, id)).returning();
      return { data: r, error: null };
    }

    const fd = await request.formData();
    const file = fd.get('file') as File | null;
    const name = fd.get('name') as string;

    if (!file || !name) {
      return { data: null, error: 'name and file are required' };
    }

    const r2Key = `stamps/${Date.now()}-${file.name}`;
    const buffer = await file.arrayBuffer();

    await context.cloudflare.env.TEMPLATES.put(r2Key, buffer, {
      httpMetadata: { contentType: file.type },
    });

    const now = new Date().toISOString();
    const [created] = await context.db
      .insert(stamp)
      .values({ name, imageKey: r2Key, createdAt: now })
      .returning();

    return { data: created, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export type StampUploadAction = typeof action;
export type StampUploadLoader = typeof loader;
