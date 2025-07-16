import { Config, CF, env } from './config';

const BUCKETS_LOCATION = 'EEUR';

const apiToken = CF.requireSecret('apiToken');
const apiKey = CF.requireSecret('apiKey');
const email = CF.requireSecret('email');
const accountId = Config.requireSecret('accountId');
const emailDomain = Config.requireSecret('emailDomain');
const domainZoneId = Config.requireSecret('domainZoneId');

const WEB_BUCKET_DNS_ROUTE_PATH = env !== 'production' ? env : 'app';
const appHostname = `${WEB_BUCKET_DNS_ROUTE_PATH}.${emailDomain}`;
const appOrigin = `https://${appHostname}`;

export {
  BUCKETS_LOCATION,
  WEB_BUCKET_DNS_ROUTE_PATH,
  apiKey,
  apiToken,
  domainZoneId,
  emailDomain,
  appHostname,
  appOrigin,
  accountId,
  email,
};
