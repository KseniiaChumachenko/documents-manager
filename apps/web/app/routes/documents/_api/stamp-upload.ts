import { eq } from 'drizzle-orm';

import { documentTemplate } from '~/database/schema';

import type { Route } from '../../../../.react-router/types/app/routes/documents/_api/+types/stamp-upload';

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const fd = await request.formData();
    const templateId = Number(fd.get('templateId'));
    const file = fd.get('file') as File | null;

    if (!templateId || !file) {
      return { data: null, error: 'templateId and file are required' };
    }

    const r2Key = `stamps/${templateId}/${file.name}`;
    const buffer = await file.arrayBuffer();

    await context.cloudflare.env.TEMPLATES.put(r2Key, buffer, {
      httpMetadata: { contentType: file.type },
    });

    const r = await context.db
      .update(documentTemplate)
      .set({ stampImageKey: r2Key, updatedAt: new Date().toISOString() })
      .where(eq(documentTemplate.id, templateId))
      .returning();

    return { data: r, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export type StampUploadAction = typeof action;
