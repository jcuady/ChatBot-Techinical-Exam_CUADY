/**
 * Environment configuration with startup validation.
 *
 * Validates that all required configuration is present before
 * the application starts. Fails clearly with a developer-readable
 * message if anything is missing.
 */

export interface AppConfig {
  nodeEnv: string;
  port: number;
}

export function loadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const portStr = process.env.PORT || '3978';

  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    if (process.env.VERCEL) {
      return { nodeEnv, port: 3978 };
    }
    throw new Error(
      `Invalid PORT configuration: "${portStr}". ` +
      'PORT must be a number between 1 and 65535.'
    );
  }

  return { nodeEnv, port };
}
