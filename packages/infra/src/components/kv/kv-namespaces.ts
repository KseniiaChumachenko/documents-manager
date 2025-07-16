import * as cloudflare from '@pulumi/cloudflare';

import { accountId } from '../../bridges/constants';
import { Provider } from '../../bridges/provider';

import { getKvNamespaceName } from './utils';

type KvKeys = 'buyer' | 'seller';

const BUYER_KEY: KvKeys = 'buyer';
const SELLER_KEY: KvKeys = 'seller';

const kvNamespaceInitializer = (key: KvKeys) => {
  const name = getKvNamespaceName(key);

  return new cloudflare.WorkersKvNamespace(
    name,
    { title: name, accountId },
    { provider: Provider }
  );
};

const getBuyerKvNamespace = (): cloudflare.WorkersKvNamespace => kvNamespaceInitializer(BUYER_KEY);
const getSellerKvNamespace = (): cloudflare.WorkersKvNamespace =>
  kvNamespaceInitializer(SELLER_KEY);

export { getBuyerKvNamespace, getSellerKvNamespace };
