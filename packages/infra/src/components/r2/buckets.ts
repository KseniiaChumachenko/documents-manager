import * as cloudflare from '@pulumi/cloudflare';

import { accountId, BUCKETS_LOCATION } from '../../bridges/constants';
import { Provider } from '../../bridges/provider';

import { getBucketName } from './utils';

type R2Keys = 'web' | 'template' | 'poa' | 'invoice' | 'bill' | 'documents';

const WEB_KEY: R2Keys = 'web';
const TEMPLATE_KEY: R2Keys = 'template';
const POA_KEY: R2Keys = 'poa';
const INVOICE_KEY: R2Keys = 'invoice';
const BILL_KEY: R2Keys = 'bill';
// Single generic bucket for all generated documents (replaces the per-type
// poa/invoice/bill buckets; type is discriminated by the `${docType}/` key prefix).
const DOCUMENTS_KEY: R2Keys = 'documents';

const bucketInitializer = (key: R2Keys): [cloudflare.R2Bucket] => {
  const name = getBucketName(key);

  const bucket = new cloudflare.R2Bucket(
    name,
    {
      name,
      accountId,
      location: BUCKETS_LOCATION,
      jurisdiction: 'default',
      storageClass: 'Standard',
    },
    { provider: Provider, protect: true }
  );

  // // TODO: api error on library side?
  // const corsName = getBucketCorsName(key);
  // const corsID = getBucketCorsID(key, 1);
  //
  // new cloudflare.R2BucketCors(
  //   corsName,
  //   {
  //     accountId,
  //     bucketName: bucket.name,
  //     rules: [
  //       {
  //         id: corsID,
  //         maxAgeSeconds: 3600,
  //         allowed: {
  //           methods: ['GET'],
  //           origins: [appOrigin],
  //           headers: ['*'],
  //         },
  //       },
  //     ],
  //   },
  //   { provider: Provider, dependsOn: bucket }
  // );

  return [bucket];
};

const getWebHostingBucket = (): [cloudflare.R2Bucket] => bucketInitializer(WEB_KEY);
const getTemplateBucket = (): [cloudflare.R2Bucket] => bucketInitializer(TEMPLATE_KEY);
const getPOABucket = (): [cloudflare.R2Bucket] => bucketInitializer(POA_KEY);
const getInvoiceBucket = (): [cloudflare.R2Bucket] => bucketInitializer(INVOICE_KEY); //rahunok factura
const getBillBucket = (): [cloudflare.R2Bucket] => bucketInitializer(BILL_KEY); //vydatkova nakladna
const getDocumentsBucket = (): [cloudflare.R2Bucket] => bucketInitializer(DOCUMENTS_KEY);

export {
  getWebHostingBucket,
  getTemplateBucket,
  getPOABucket,
  getInvoiceBucket,
  getBillBucket,
  getDocumentsBucket,
};
