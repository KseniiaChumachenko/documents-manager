import { env } from '../bridges/config';

export const getEnvBasedName = (name: string) => {
  const cleanName = name
    .trim()
    .toLowerCase()
    .split(/(?<![A-Z])(?=[A-Z])/)
    .join('-')
    .replace('_', '-')
    .replace('--', '-');

  return `${env}-${cleanName}`;
};
