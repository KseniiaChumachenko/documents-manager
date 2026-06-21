import { eq } from 'drizzle-orm';

import { myCompany } from '~/database/schema';

import type { Route } from '../../../../.react-router/types/app/routes/documents/_api/+types/my-company';

const OPTIONAL_FIELDS = [
  'egrpou',
  'inn',
  'vatCertificate',
  'iban',
  'bankName',
  'mfo',
  'phone',
  'address',
  'taxNote',
  'signatoryName',
] as const;

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const fd = await request.formData();
    const get = (f: string): string | null => {
      const v = fd.get(f);
      return v != null && String(v).trim() !== '' ? String(v) : null;
    };

    const name = get('name');
    if (!name) {
      return { data: null, error: 'Вкажіть назву компанії' };
    }

    const optional = Object.fromEntries(OPTIONAL_FIELDS.map((f) => [f, get(f)])) as Record<
      (typeof OPTIONAL_FIELDS)[number],
      string | null
    >;
    const values = { name, ...optional };

    const [existing] = await context.db.select().from(myCompany).limit(1);

    if (existing) {
      const r = await context.db
        .update(myCompany)
        .set(values)
        .where(eq(myCompany.id, existing.id))
        .returning();
      return { data: r, error: null };
    }

    const r = await context.db.insert(myCompany).values(values).returning();
    return { data: r, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export type MyCompanyAction = typeof action;
