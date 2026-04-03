import { XMLParser } from 'fast-xml-parser';
import { decode as windows1251decode } from 'windows-1251';

export interface AdmToolsCompany {
  egrpou: string;
  name: string;
  name_short?: string;
  address?: string;
  director?: string;
  director_gen?: string;
  kved?: string;
  kved_number?: string;
  inn?: string;
  inn_date?: string;
}

export async function fetchFromAdmTools(
  egrpou: string,
  apiBase: string
): Promise<AdmToolsCompany | null> {
  const res = await fetch(`${apiBase}?egrpou=${egrpou}`);
  if (!res.ok) return null;

  const buffer = await res.arrayBuffer();
  const xmlText = windows1251decode(new Uint8Array(buffer));

  const parser = new XMLParser({
    allowBooleanAttributes: true,
    attributeNamePrefix: '',
    ignoreAttributes: false,
  });

  const result = parser.parse(xmlText);
  if (result?.error) return null;

  return result.export?.company ?? null;
}
