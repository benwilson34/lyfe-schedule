export const DB_URL = process.env.DB_URL!;
export const DB_NAME = process.env.DB_NAME!;
export const TASK_COLLECTION_NAME = process.env.TASK_COLLECTION_NAME;
export const USER_COLLECTION_NAME = process.env.USER_COLLECTION_NAME;

export function checkForRequiredEnvVars() {
  const requiredEnvVarKeys = [
    'DB_URL',
    'DB_NAME',
  ];
  const missingKeys = requiredEnvVarKeys.map((key) => !process.env[key]);
  if (missingKeys?.length > 0) {
    console.error(`Error: The following required env vars are not defined: ${missingKeys.join(', ')}.`);
    throw new Error('Missing required env vars');
  }
}
