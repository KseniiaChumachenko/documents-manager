import { env } from '../../bridges/config';

/**
 * Generates a standardized name for the Zero Trust Access Application
 * @returns Formatted application name with environment suffix
 */
export const getAccessApplicationName = (): string => {
  return `${env}-document-manager-app`;
};

export const getPolicyName = (): string => {
  return `${env}-identity-policy`;
};
