import { XMLParser } from 'fast-xml-parser';
import { decode as windows1251decode } from 'windows-1251';

import type { Route } from '../../../../.react-router/types/app/routes/library/api/+types/search-company';

export async function loader({ request, params }: Route.LoaderArgs) {
  const reqUrl = new URL(request.url);
  const egrpou = reqUrl.searchParams.get('egrpou');

  const url = `${import.meta.env.VITE_GOV_API}?egrpou=${egrpou}`;
  const res = await fetch(url, { method: 'GET' });

  if (!res.ok) {
    return { data: null, error: res.statusText };
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
    return { data: null, error: result.error };
  }

  return { data: result.export.company, error: null };
}

export type SearchCompanyLoader = typeof loader;
