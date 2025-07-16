import { env as _env } from '../../bridges/config';
import { normalize } from '../../utils/normalize-string';

export const getBucketName = (_name: string): string => {
  const env = normalize(_env);
  const name = normalize(_name);

  return `${env}-${name}`;
};

export const getBucketCorsName = (_name: string): string => {
  const bucketName = getBucketName(_name);
  return `${bucketName}-cors`;
};

export const getBucketCorsID = (_name: string, iterator: number): string => {
  const bucketName = getBucketCorsName(_name);
  return `${bucketName}-${iterator}`;
};
