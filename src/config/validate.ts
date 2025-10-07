import logger from '@/utils/logger';

const reqKeys = [
  'botToken',
  'clientId',
  'guildId',
  'dbFile',
  'ytApiKey',
  'twitchClientId',
  'twitchClientSecret',
  'twitchTokenAesKey',
];

export function validateConfig(obj: Record<string, unknown>) {
  for (const key in obj) {
    const value = obj[key];

    if (
      reqKeys.includes(key) &&
      (value === undefined || value === null || value === '')
    ) {
      logger.error(
        `Config: ${key} field is required but its empty or undefined!`
      );
      process.exit(1);
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      validateConfig(value as Record<string, unknown>);
    } else if (value === undefined || value === null || value === '') {
      logger.warn(`Config: ${key} field is empty or undefined`);
    }
  }
}

export function getEnvVar(name: string) {
  const value = process.env[name];

  if (!value || value === '') {
    logger.warn(`Missing environment variable: ${name}`);
    return '';
  }

  return value;
}
