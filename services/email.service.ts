import { createTransport } from "nodemailer";
import { MailOptions } from "nodemailer/lib/json-transport";
import { DEFAULT_FROM_EMAIL, SMTP_HOST_URL, SMTP_PASSWORD, SMTP_PORT, SMTP_USER } from "@/util/env";

const transport = createTransport({
  host: SMTP_HOST_URL,
  port: SMTP_PORT,
  secure: false, // TODO upgrade later with STARTTLS
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  }
});

export async function sendMail(options: MailOptions) {
  if (!options.from) {
    options.from = DEFAULT_FROM_EMAIL;
  }
  return transport.sendMail(options);
}
