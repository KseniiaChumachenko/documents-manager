import { eq } from 'drizzle-orm';

import { company, companyType } from '~/database/schema';

import type { Route } from '../../../../.react-router/types/app/routes/library/api/+types/save-company';

export async function loader({ request, context }: Route.LoaderArgs) {
  const sp = new URL(request.url).searchParams;
  const type = sp.get('type');
  const egrpou = sp.get('egrpou');

  if (!type || !egrpou) {
    return { data: null, error: 'Invalid input' };
  }

  let values: typeof company.$inferInsert = {
    name: '',
    type: 'client',
    name_short: '',
    address: '',
  };
  sp.forEach((v, k) => {
    values = { ...values, [k]: v };
  });

  const [types, comp] = await Promise.all([
    context.db.select().from(companyType),
    context.db.select().from(company).where(eq(company.egrpou, egrpou)),
  ]);

  if (comp?.length) {
    const r = context.db
      .update(company)
      .set(values)
      .where(eq(company.egrpou, egrpou))
      .returning({ egrpou: company.egrpou });

    return { data: r, error: null };
  }

  let typeExist = !!types.find((v) => v.name === type)?.name;

  if (!typeExist) {
    const t = await context.db.insert(companyType).values({ name: 'client' }).returning();
    if (!t?.length) {
      typeExist = true;
    }
  }

  if (typeExist) {
    const r = await context.db.insert(company).values(values).returning();

    return { data: r, error: null };
  }

  return { data: null, error: null };
}

export type SaveCompanyLoader = typeof loader;
