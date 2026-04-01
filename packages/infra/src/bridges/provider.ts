import * as cloudflare from '@pulumi/cloudflare';

import { apiToken } from './constants';

const Provider = new cloudflare.Provider('cloudflare', {
  apiToken,
});

export { Provider };
