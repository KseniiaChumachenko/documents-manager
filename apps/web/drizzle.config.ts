import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  out: './database/migrations',
  schema: './database/schema.ts',
  dialect: 'sqlite',
  driver: 'd1-http',
  tablesFilter: ['!_cf_KV'],
  dbCredentials: {
    databaseId: process.env.DATABASE_ID,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    token: process.env.CLOUDFLARE_TOKEN,
  },
} satisfies Config;
