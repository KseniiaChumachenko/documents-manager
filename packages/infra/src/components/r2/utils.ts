import { getEnvBasedName } from '../../utils/get-env-based-name';

export const getBucketName = getEnvBasedName;

export const getBucketCorsName = (_name: string): string => {
  const bucketName = getBucketName(_name);
  return `${bucketName}-cors`;
};

export const getBucketCorsID = (_name: string, iterator: number): string => {
  const bucketName = getBucketCorsName(_name);
  return `${bucketName}-${iterator}`;
};
