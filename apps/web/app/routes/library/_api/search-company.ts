import { eq } from 'drizzle-orm';
import { XMLParser } from 'fast-xml-parser';
import { decode as windows1251decode } from 'windows-1251';

import { company } from '~/database/schema';

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

  const url = `${import.meta.env.VITE_GOV_API}?egrpou=${code}`;
  const res = await fetch(url, { method: 'GET' });

  if (!res.ok) {
    return { data: null, error: res.statusText, entity_type: 'legal' };
  }

  const arrayBuffer = await res.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  const xmlText = windows1251decode(uint8);

  const parser = new XMLParser({
    allowBooleanAttributes: true,
    attributeNamePrefix: '',
    ignoreAttributes: false,
  });
  const result = parser.parse(xmlText);

  if (result?.error) {
    return { data: null, error: result.error, entity_type: 'legal' };
  }

  return { data: result.export.company, error: null, entity_type: 'legal' };
}

export type SearchCompanyLoader = typeof loader;
