import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import { createRequestHandler } from 'react-router';

import * as schema from '../database/schema';

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    db: DrizzleD1Database<typeof schema>;
    user: {email: string | null}
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
} satisfies ExportedHandler<Env>;
