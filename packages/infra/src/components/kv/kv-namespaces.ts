import * as cloudflare from '@pulumi/cloudflare';

import { accountId } from '../../bridges/constants';
import { Provider } from '../../bridges/provider';
import { getEnvBasedName } from '../../utils/get-env-based-name';

type KvKeys = 'buyer' | 'seller';

const BUYER_KEY: KvKeys = 'buyer';
const SELLER_KEY: KvKeys = 'seller';

const kvNamespaceInitializer = (key: KvKeys) => {
  const name = getEnvBasedName(key);

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
