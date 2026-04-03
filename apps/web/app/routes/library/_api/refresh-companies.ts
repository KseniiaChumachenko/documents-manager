import type { ActionFunctionArgs } from 'react-router';

import { refreshStaleCompanies } from '~/workers/company-refresh';

export async function action({ context }: ActionFunctionArgs) {
  const govApiUrl = import.meta.env.VITE_GOV_API;
  if (!govApiUrl) {
    return { data: null, error: 'VITE_GOV_API not configured' };
  }

  const result = await refreshStaleCompanies(context.cloudflare.env.DB, govApiUrl);

  return { data: result, error: null };
}
