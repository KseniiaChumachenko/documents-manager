import * as cloudflare from '@pulumi/cloudflare';

import { env } from '../../bridges/config';
import { accountId, BUCKETS_LOCATION } from '../../bridges/constants';

export const getDBName = (): string => {
  return `${env}-db`;
};

const dbName = getDBName();

const getDB = (): cloudflare.D1Database =>
  new cloudflare.D1Database(dbName, {
    accountId,
    name: dbName,
    primaryLocationHint: BUCKETS_LOCATION,
  });

export { getDB };
