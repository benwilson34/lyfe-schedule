import { parseBoolean } from "./parse-boolean";

export const IS_DEMO_MODE =
  parseBoolean(process.env.IS_DEMO_MODE || "") ?? false;
export const DB_URL = process.env.DB_URL!;
export const DB_NAME = process.env.DB_NAME!;
// TODO move other defaults here
export const TASK_COLLECTION_NAME = process.env.TASK_COLLECTION_NAME;
export const USER_COLLECTION_NAME = process.env.USER_COLLECTION_NAME;
export const TOKEN_PAYLOAD_COLLECTION_NAME = process.env.TOKEN_COLLECTION_NAME;
export const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
export const SMTP_HOST_URL = process.env.SMTP_HOST_URL!;
export const SMTP_PORT = parseInt(process.env.SMTP_PORT!);
export const SMTP_USER = process.env.SMTP_USER!;
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD!;
export const SMTP_HEADERS: Record<string, any> = JSON.parse(
  process.env.SMTP_HEADERS || "null"
);
export const DEFAULT_FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL!;
export const PASSWORD_RESET_TOKEN_TTL_MINS =
  parseInt(process.env.PASSWORD_RESET_TOKEN_TTL_MINS || "") || 60 * 2; // default to 2 hours
export const INVITATION_TOKEN_TTL_MINS =
  parseInt(process.env.INVITATION_TOKEN_TTL_MINS || "") || 60 * 24 * 7; // default to 7 days
export const IS_REGISTRATION_INVITE_ONLY =
  parseBoolean(process.env.IS_REGISTRATION_INVITE_ONLY || "") ?? true;
export const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

export function checkForRequiredEnvVars() {
  if (IS_DEMO_MODE) {
    return;
  }

  const requiredEnvVarKeys = [
    "DB_URL",
    "DB_NAME",
    "SMTP_HOST_URL",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "DEFAULT_FROM_EMAIL",
  ];
  const missingKeys = requiredEnvVarKeys.map((key) => !process.env[key]);
  if (missingKeys?.length > 0) {
    console.error(
      `Error: The following required env vars are not defined: ${missingKeys.join(
        ", "
      )}.`
    );
    throw new Error("Missing required env vars");
  }
}
