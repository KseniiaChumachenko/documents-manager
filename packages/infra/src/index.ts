import { getDB } from './components/db';
// DNS is managed by wrangler custom_domain feature for Workers
// import { getWebBucketDnsSet } from './components/dns';
import {
  getWebHostingBucket,
  getTemplateBucket,
  getInvoiceBucket,
  getBillBucket,
  getPOABucket,
  getDocumentsBucket,
} from './components/r2/buckets';
import { getAccessApplication } from './components/zero-trust';

const [webHostingBucket] = getWebHostingBucket();
const [templateBucket] = getTemplateBucket();
const [invoiceBucket] = getInvoiceBucket();
const [billBucket] = getBillBucket();
const [poaBucket] = getPOABucket();
const [documentsBucket] = getDocumentsBucket();
const db = getDB();
const [accessApplication] = getAccessApplication();

export {
  webHostingBucket,
  templateBucket,
  invoiceBucket,
  billBucket,
  poaBucket,
  documentsBucket,
  accessApplication,
  db,
};

export const databaseId = db.id;
