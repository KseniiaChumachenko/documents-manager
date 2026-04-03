import type { ActionFunctionArgs } from 'react-router';

import { refreshStaleCompanies } from '~/workers/company-refresh';

export async function action({ context }: ActionFunctionArgs) {
  const govApiUrl = context.cloudflare.env.GOV_API;
  if (!govApiUrl) {
    return { data: null, error: 'GOV_API binding not configured' };
  }

  const result = await refreshStaleCompanies(context.cloudflare.env.DB, govApiUrl);

  return { data: result, error: null };
}
