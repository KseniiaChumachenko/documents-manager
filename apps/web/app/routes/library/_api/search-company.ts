import { eq } from 'drizzle-orm';

import { company } from '~/database/schema';
import { fetchFromAdmTools } from '~/lib/adm-tools';

import type { Route } from '../../../../.react-router/types/app/routes/library/_api/+types/search-company';

export async function loader({ request, context }: Route.LoaderArgs) {
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get('code');

  if (!code || !/^\d{8,10}$/.test(code)) {
    return { data: null, error: 'Код має складатися з 8-10 цифр', entity_type: null };
  }

  const entityType = code.length <= 8 ? 'legal' : 'fop';

  if (entityType === 'fop') {
    const cached = await context.db.select().from(company).where(eq(company.ik, code));

    if (cached?.length) {
      return { data: cached[0], error: null, entity_type: 'fop' };
    }

    return { data: null, error: null, entity_type: 'fop' };
  }

  const data = await fetchFromAdmTools(code, context.cloudflare.env.GOV_API);

  if (!data) {
    return { data: null, error: 'Компанію не знайдено', entity_type: 'legal' };
  }

  return { data, error: null, entity_type: 'legal' };
}

export type SearchCompanyLoader = typeof loader;
