import * as cloudflare from '@pulumi/cloudflare';

import { accountId } from '../../bridges/constants';

const NAME = 'aeroclime.com';

const getDomain = (): cloudflare.RegistrarDomain =>
  new cloudflare.RegistrarDomain(NAME, {
    accountId,
    domainName: NAME,
    autoRenew: true,
    locked: true,
    privacy: true,
  });

export { getDomain };
