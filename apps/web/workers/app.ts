import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import { createRequestHandler } from 'react-router';

import { refreshStaleCompanies } from '../app/workers/company-refresh';
import * as schema from '../database/schema';

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    db: DrizzleD1Database<typeof schema>;
    user: { email: string | null };
  }
}

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    const db = drizzle(env.DB, { schema });
    const user = {
      email: request.headers.get('cf-access-authenticated-user-email'),
    };

    return requestHandler(request, {
      cloudflare: { env, ctx },
      db,
      user,
    });
  },

  async scheduled(controller, env, ctx) {
    const cron = controller.cron;
    console.log(`[scheduled] Cron triggered: ${cron}`);

    if (cron === '0 3 1 * *') {
      ctx.waitUntil(
        (async () => {
          console.log('[company-refresh] Starting monthly refresh');
          const govApiUrl = env.GOV_API;
          if (!govApiUrl) {
            console.error('[company-refresh] GOV_API binding not configured');
            return;
          }
          const result = await refreshStaleCompanies(env.DB, govApiUrl);
          console.log('[company-refresh] Result:', JSON.stringify(result));
        })()
      );
    }
  },
} satisfies ExportedHandler<Env>;
