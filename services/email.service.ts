declare var __PROJECT_BUILD_DIR: string; // TODO need to move this somewhere else?

import { createTransport } from "nodemailer";
import { MailOptions } from "nodemailer/lib/json-transport";
import {
  DEFAULT_FROM_EMAIL,
  SMTP_HOST_URL,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USER,
} from "@/util/env";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { basename, join } from "path";
import mjmlToHtml from "mjml";
import Handlebars from "handlebars";

const EMAIL_TEMPLATE_DIR = join(__PROJECT_BUILD_DIR, "server/email-templates");
const MAIN_TEMPLATE_FILE_NAME = "main-template.mjml";

const transport = createTransport({
  host: SMTP_HOST_URL,
  port: SMTP_PORT,
  secure: false, // TODO upgrade later with STARTTLS
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

export async function sendEmail(options: MailOptions) {
  if (!options.from) {
    options.from = DEFAULT_FROM_EMAIL;
  }
  return transport.sendMail(options);
}

function renderEmailTemplate(
  bodyFileName: string,
  values: Record<string, string>,
  plaintext: string
) {
  // It would also be nice to generate types or something from the Handlebars variables mentioned.
  // maybe designing around this package would be easier? https://github.com/oscaroox/next-mjml

  const bodyFilePath = join(EMAIL_TEMPLATE_DIR, bodyFileName);
  if (!existsSync(bodyFilePath)) {
    throw new Error(
      `The body template file ${bodyFilePath} could not be loaded.`
    );
  }
  // load main template and include the referenced body template
  const templateMjml = readFileSync(
    join(EMAIL_TEMPLATE_DIR, MAIN_TEMPLATE_FILE_NAME),
    "utf-8"
  ).replace("{{bodyFileName}}", bodyFileName);
  const templateHtml = mjmlToHtml(templateMjml, {
    filePath: EMAIL_TEMPLATE_DIR,
  });
  if (templateHtml.errors?.length > 0) {
    console.error(templateHtml.errors);
  }

  // substitute values
  const subbedHtmlTemplate = Handlebars.compile(templateHtml.html);
  // TODO cache this template? Maybe with `Handlebars.precompile`?
  const subbedHtml = subbedHtmlTemplate(values);

  // const outputFilePath = join(EMAIL_TEMPLATE_DIR, basename(bodyFileName) + '.html');
  // writeFileSync(outputFilePath, subbedHtml);
  // console.log(`Just wrote file out to ${outputFilePath}`);

  const subbedPlaintextTemplate = Handlebars.compile(plaintext);
  const subbedPlaintext = subbedPlaintextTemplate(values);

  // TODO extract plaintext or load separate plaintext file
  return {
    html: subbedHtml,
    text: subbedPlaintext,
  };
}

export async function sendPasswordResetEmail(
  toEmail: string,
  values: { email: string; expiresDate: string; resetPasswordLink: string }
) {
  // TODO validate values? Or is type checking enough?
  const renderedEmail = renderEmailTemplate(
    "password-reset.mjml",
    values,
    `
A password reset has been requested for {{email}}. If you did not request this, feel free to ignore this email.

DO NOT forward this email or send the link to anyone. This link will be valid until {{expiresDate}}.
  
Click here to reset your password: {{resetPasswordLink}}`
  );
  return sendEmail({
    to: toEmail,
    subject: "Password reset request",
    ...renderedEmail,
  });
}

export async function sendPasswordResetConfirmationEmail(
  toEmail: string,
  values: {
    email: string;
    actionDate: string;
    requestResetPasswordLink: string;
  }
) {
  const renderedEmail = renderEmailTemplate(
    "password-reset-confirmation.mjml",
    values,
    `
This is a confirmation that the password for {{email}} was successfully reset at {{actionDate}}.

If you didn't just reset your password, please reset it again by clicking here: {{requestResetPasswordLink}}`
  );
  return sendEmail({
    to: toEmail,
    subject: "Your password was reset",
    ...renderedEmail,
  });
}

export async function sendInvitationEmail(
  toEmail: string,
  values: { expiresDate: string; acceptInvitationLink: string }
) {
  const renderedEmail = renderEmailTemplate(
    "invitation.mjml",
    values,
    `
Hello! You've been invited to LyfeSchedule, the todo app for people who get things done eventually™.

This invite code will be valid until {{expiresDate}}.

Click here to activate your account: {{acceptInvitationLink}}`
  );
  return sendEmail({
    to: toEmail,
    subject: "You're invited to use LyfeSchedule!",
    ...renderedEmail,
  });
}

export async function sendWelcomeEmail(
  toEmail: string,
  values: { signInLink: string }
) {
  const renderedEmail = renderEmailTemplate(
    "welcome.mjml",
    values,
    `
Welcome to LyfeSchedule!! Thanks for your interest in my little productivity app 😁

Please remember that this app is somewhere between alpha and beta and is being actively developed. I'm accepting any and all feedback at this time.

TODO info about feedback/reporting bugs

TODO link to docs/guide/manual

You can now sign in and start using it immediately! {{signInLink}}

💚 Ben`
  );
  return sendEmail({
    to: toEmail,
    subject: "Welcome to LyfeSchedule!",
    ...renderedEmail,
  });
}
