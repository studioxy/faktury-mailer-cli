import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import { google } from "googleapis";

import { buildEmail } from "./email-template.js";
import type { MatchResult } from "./types.js";

function toBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function buildRawMessage(result: MatchResult, recipientEmail: string, attachment: Buffer): string {
  const boundary = `faktury-${Date.now()}`;
  const email = buildEmail(result.invoiceNumber);

  const message = [
    `To: ${recipientEmail}`,
    "Content-Type: multipart/mixed; boundary=" + boundary,
    "MIME-Version: 1.0",
    `Subject: ${email.subject}`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "MIME-Version: 1.0",
    "Content-Transfer-Encoding: 7bit",
    "",
    email.body,
    `--${boundary}`,
    `Content-Type: application/pdf; name="${basename(result.fileName)}"`,
    "MIME-Version: 1.0",
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${basename(result.fileName)}"`,
    "",
    attachment.toString("base64"),
    `--${boundary}--`,
  ].join("\r\n");

  return toBase64Url(message);
}

async function getAuthorizedGmailClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? "https://developers.google.com/oauthplayground";

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Gmail credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.",
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  auth.setCredentials({ refresh_token: refreshToken });

  return google.gmail({ version: "v1", auth });
}

export async function sendReadyInvoices(
  results: MatchResult[],
  overrideEmail?: string,
): Promise<MatchResult[]> {
  const gmail = await getAuthorizedGmailClient();
  const updatedResults: MatchResult[] = [];

  for (const result of results) {
    if (result.status !== "ready") {
      updatedResults.push(result);
      continue;
    }

    const recipientEmail = overrideEmail || result.email;

    try {
      const attachment = await readFile(result.filePath);
      await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: buildRawMessage(result, recipientEmail, attachment),
        },
      });

      updatedResults.push({
        ...result,
        email: recipientEmail,
        status: "sent",
      });
    } catch (error) {
      updatedResults.push({
        ...result,
        email: recipientEmail,
        status: "gmail_error",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return updatedResults;
}
