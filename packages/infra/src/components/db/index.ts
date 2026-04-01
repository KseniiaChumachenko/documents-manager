import * as cloudflare from '@pulumi/cloudflare';

import { accountId } from '../../bridges/constants';
import { getEnvBasedName } from '../../utils/get-env-based-name';

const dbName = getEnvBasedName('db');

const getDB = (): cloudflare.D1Database =>
  new cloudflare.D1Database(dbName, {
    accountId,
    name: dbName,
    readReplication: {
      mode: 'disabled',
    },
  });

export { getDB };
