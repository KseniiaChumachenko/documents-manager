import { getEnvBasedName } from '../../utils/get-env-based-name';

/**
 * Generates a standardized name for the Zero Trust Access Application
 * @returns Formatted application name with environment suffix
 */
export const getAccessApplicationName = (): string => {
  return getEnvBasedName('document-manager-app');
};

export const getPolicyName = (): string => {
  return getEnvBasedName('identity-policy');
};
