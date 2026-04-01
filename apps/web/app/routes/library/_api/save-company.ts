import { eq } from 'drizzle-orm';

import { company, companyType } from '~/database/schema';

import type { Route } from '../../../../.react-router/types/app/routes/library/_api/+types/save-company';



export async function loader({ request, context }: Route.LoaderArgs) {
  const sp = new URL(request.url).searchParams;
  const type = sp.get('type');
  const egrpou = sp.get('egrpou');
  const ik = sp.get('ik');

  if (!type || (!egrpou && !ik)) {
    return { data: null, error: 'Invalid input' };
  }

  const entityType = egrpou ? 'legal' : 'fop';

  const values: typeof company.$inferInsert = {
    egrpou: egrpou || null,
    ik: ik || null,
    entity_type: entityType,
    type,
    name: sp.get('name') || '',
    name_short: sp.get('name_short') || null,
    address: sp.get('address') || null,
    phone: sp.get('phone') || null,
    director: sp.get('director') || null,
    director_gen: sp.get('director_gen') || null,
    kved: sp.get('kved') || null,
    kved_number: sp.get('kved_number') || null,
    inn: sp.get('inn') || null,
    inn_date: sp.get('inn_date') || null,
    last_sync: new Date().toISOString(),
  };

  const identifier = egrpou ? eq(company.egrpou, egrpou) : eq(company.ik, ik!);

  const [types, existing] = await Promise.all([
    context.db.select().from(companyType),
    context.db.select().from(company).where(identifier),
  ]);

  if (existing?.length) {
    const r = await context.db
      .update(company)
      .set(values)
      .where(identifier)
      .returning({ id: company.id });

    return { data: r, error: null };
  }

  let typeExist = !!types.find((v) => v.name === type)?.name;

  if (!typeExist) {
    const t = await context.db.insert(companyType).values({ name: type }).returning();
    if (t?.length) {
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
