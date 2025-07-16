import * as cloudflare from '@pulumi/cloudflare';

import { email, apiKey, apiToken } from './constants';

const Provider = new cloudflare.Provider('cloudflare', {
  apiToken,
  apiKey,
  email,
});

export { Provider };
