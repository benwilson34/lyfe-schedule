export const DB_URL = process.env.DB_URL!;
export const DB_NAME = process.env.DB_NAME!;
export const TASK_COLLECTION_NAME = process.env.TASK_COLLECTION_NAME;
export const USER_COLLECTION_NAME = process.env.USER_COLLECTION_NAME;
export const TOKEN_PAYLOAD_COLLECTION_NAME = process.env.TOKEN_COLLECTION_NAME;
export const SMTP_HOST_URL = process.env.SMTP_HOST_URL!;
export const SMTP_PORT = parseInt(process.env.SMTP_PORT!);
export const SMTP_USER = process.env.SMTP_USER!;
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD!;
export const DEFAULT_FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL!;
export const PASSWORD_RESET_TOKEN_TTL_MINS = parseInt(process.env.PASSWORD_RESET_TOKEN_TTL_MINS || '');

export function checkForRequiredEnvVars() {
  const requiredEnvVarKeys = [
    'DB_URL',
    'DB_NAME',
    'SMTP_HOST_URL',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'DEFAULT_FROM_EMAIL',
  ];
  const missingKeys = requiredEnvVarKeys.map((key) => !process.env[key]);
  if (missingKeys?.length > 0) {
    console.error(`Error: The following required env vars are not defined: ${missingKeys.join(', ')}.`);
    throw new Error('Missing required env vars');
  }
}
