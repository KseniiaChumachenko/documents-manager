import * as cloudflare from '@pulumi/cloudflare';

import { accountId, BUCKETS_LOCATION } from '../../bridges/constants';
import { getEnvBasedName } from '../../utils/get-env-based-name';

const dbName = getEnvBasedName('db');

const getDB = (): cloudflare.D1Database =>
  new cloudflare.D1Database(dbName, {
    accountId,
    name: dbName,
    primaryLocationHint: BUCKETS_LOCATION,
  });

export { getDB };
