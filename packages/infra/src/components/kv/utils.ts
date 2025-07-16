import { env as _env } from '../../bridges/config';
import { normalize } from '../../utils/normalize-string';

export const getKvNamespaceName = (_name: string): string => {
  const env = normalize(_env);
  const name = normalize(_name);

  return `${env}-${name}`;
};
