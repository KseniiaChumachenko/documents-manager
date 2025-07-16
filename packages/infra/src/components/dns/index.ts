import * as cloudflare from '@pulumi/cloudflare';
import { Input, Output } from '@pulumi/pulumi/output';
import { Resource } from '@pulumi/pulumi/resource';

import { env } from '../../bridges/config';
import { domainZoneId, WEB_BUCKET_DNS_ROUTE_PATH } from '../../bridges/constants';

const getName = () => `${env}-web-bucket-dns`;
const name = getName();

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
