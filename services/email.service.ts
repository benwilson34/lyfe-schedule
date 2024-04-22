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
import {
  XmlDocument,
  XmlElement,
  XmlNode,
  XmlText,
  parseXml,
} from "@rgrove/parse-xml";

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

function extractPlaintextFromMjml(html: string) {
  const xml = parseXml(html, {
    preserveDocumentType: true,
  });

  let nodeStack: (
    | XmlDocument["children"][number]
    | XmlElement["children"][number]
  )[] = [...xml.children];
  let texts = ["LyfeSchedule"];
  while (nodeStack.length > 0) {
    const node = nodeStack.pop()!;
    if (node.type === "text") {
      const strippedText = (node as XmlText).text.replaceAll(/\n/gi, " ").trim();
      if (strippedText.length > 0) {
        texts.push(strippedText);
      }
    }
    if (node.type === "element" && (node as XmlElement).name === "mj-button") {
      texts.push((node as XmlElement).attributes.href);
    }
    if ((node as XmlElement).children) {
      nodeStack = nodeStack.concat((node as XmlElement).children.reverse());
    }
  }
  texts.push("Unsubscribe:");
  return texts.join("\n\n");
}

function renderEmailTemplate(
  bodyFileName: string,
  values: Record<string, string>
) {
  // It would also be nice to generate types or something from the Handlebars variables mentioned.
  //   Maybe something mentioned here: https://github.com/handlebars-lang/handlebars.js/issues/1207
  // Maybe designing around this package would be easier? https://github.com/oscaroox/next-mjml

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

  const bodyMjml = readFileSync(
    join(EMAIL_TEMPLATE_DIR, bodyFileName),
    "utf-8"
  );
  const generatedPlaintext = extractPlaintextFromMjml(bodyMjml);
  const subbedPlaintextTemplate = Handlebars.compile(generatedPlaintext);
  const subbedPlaintext = subbedPlaintextTemplate(values);

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
  const renderedEmail = renderEmailTemplate("password-reset.mjml", values);

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
    values
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
  const renderedEmail = renderEmailTemplate("invitation.mjml", values);
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
  const renderedEmail = renderEmailTemplate("welcome.mjml", values);
  return sendEmail({
    to: toEmail,
    subject: "Welcome to LyfeSchedule!",
    ...renderedEmail,
  });
}
