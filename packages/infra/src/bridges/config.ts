import * as pulumi from '@pulumi/pulumi';

import { normalize } from '../utils/normalize-string';

const CF = new pulumi.Config('cloudflare');
const Config = new pulumi.Config('DocumentManager');

const env = normalize(pulumi.getStack() ?? 'error');

export { CF, Config, env };
