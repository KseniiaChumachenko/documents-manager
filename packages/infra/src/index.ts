import { getDB } from './components/db';
// import { getWebBucketDnsSet } from './components/dns';
import {
  getWebHostingBucket,
  getTemplateBucket,
  getInvoiceBucket,
  getBillBucket,
  getPOABucket,
} from './components/r2/buckets';
// import { getAccessApplication } from './components/zero-trust';

const [webHostingBucket] = getWebHostingBucket();
const [templateBucket] = getTemplateBucket();
const [invoiceBucket] = getInvoiceBucket();
const [billBucket] = getBillBucket();
const [poaBucket] = getPOABucket();
// DNS is managed by wrangler custom_domain feature for Workers
// const webHostingDns = getWebBucketDnsSet(webHostingBucket.id, webHostingBucket);
const db = getDB();

// Had to set-up manually due to API bug, same goes for bucket cors
// const [accessApplication] = getAccessApplication();

export {
  webHostingBucket,
  templateBucket,
  invoiceBucket,
  billBucket,
  poaBucket,
  // webHostingDns,
  // accessApplication,
  db,
};

export const databaseId = db.id;
