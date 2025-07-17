import * as cloudflare from '@pulumi/cloudflare';
import { Input, Output } from '@pulumi/pulumi/output';
import { Resource } from '@pulumi/pulumi/resource';

import { domainZoneId, WEB_BUCKET_DNS_ROUTE_PATH } from '../../bridges/constants';
import { getEnvBasedName } from '../../utils/get-env-based-name';

const name = getEnvBasedName('web-bucket-dns');

const getWebBucketDnsSet = (
  bucketId: Output<string>,
  dependsOn: Input<Resource>
): cloudflare.DnsRecord =>
  new cloudflare.DnsRecord(
    name,
    {
      zoneId: domainZoneId,
      name: WEB_BUCKET_DNS_ROUTE_PATH,
      type: 'CNAME',
      content: bucketId,
      proxied: true,
      ttl: 1,
    },
    { dependsOn }
  );

export { getWebBucketDnsSet };
