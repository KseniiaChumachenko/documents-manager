import * as cloudflare from '@pulumi/cloudflare';

import { accountId, appHostname, appOrigin, emailDomain } from '../../bridges/constants';
import { Provider } from '../../bridges/provider';

import { getAccessApplicationName, getPolicyName } from './utils';

/**
 * Creates a Cloudflare Zero Trust Access Application for the Document Manager
 * This sets up the application with a login page and authentication settings
 * including Cloudflare's One-Time Pin (OTP) as a login option.
 *
 * @returns The created Access Application resource.
 */
export const getAccessApplication = (): [cloudflare.ZeroTrustAccessApplication] => {
  const name = getAccessApplicationName();
  const policyName = getPolicyName();

  const accessApplication = new cloudflare.ZeroTrustAccessApplication(
    name,
    {
      accountId,
      appLauncherVisible: true,
      corsHeaders: {
        allowAllHeaders: true,
        allowAllMethods: true,
        allowedOrigins: ['https://*.cloudflareaccess.com', appOrigin + '/*'],
        maxAge: 3600,
      },
      destinations: [
        {
          type: 'public',
          uri: appHostname + '/*',
        },
      ],
      domain: appHostname + '/*',
      name,
      policies: [
        {
          name: policyName,
          decision: 'allow',
          includes: [
            {
              emailDomain: {
                domain: emailDomain,
              },
            },
          ],
        },
      ],
      sessionDuration: '24h',
      type: 'self_hosted',
    },
    {
      provider: Provider,
      protect: true,
    }
  );

  return [accessApplication];
};
