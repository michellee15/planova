const { fetchWithTimeout } = require("./httpService");

const MAILJET_EMAIL_URL = "https://api.mailjet.com/v3.1/send";
const DEFAULT_FRONTEND_URL = "http://localhost:5173";

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getVerificationUrl = (token) => {
  const frontendUrl = (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL).replace(
    /\/$/,
    ""
  );
  return `${frontendUrl}/verify-email#token=${encodeURIComponent(token)}`;
};

const sendVerificationEmail = async ({ to, name, token }) => {
  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  const senderEmail = process.env.MAILJET_SENDER_EMAIL;

  if (!apiKey || !secretKey || !senderEmail) {
    throw new Error("Mailjet email configuration is missing");
  }

  const verificationUrl = getVerificationUrl(token);
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(verificationUrl);
  const response = await fetchWithTimeout(MAILJET_EMAIL_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString(
        "base64"
      )}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      Messages: [
        {
          From: {
            Email: senderEmail,
            Name: "Planova",
          },
          To: [{ Email: to, Name: name }],
          Subject: "Verify your Planova email",
          HTMLPart: [
            `<p>Hello ${safeName},</p>`,
            "<p>Verify your email address to finish creating your Planova account.</p>",
            `<p><a href="${safeUrl}">Verify email address</a></p>`,
            "<p>This link expires in 30 minutes. If you did not create this account, you can ignore this email.</p>",
          ].join(""),
          TextPart: [
            `Hello ${name},`,
            "",
            "Verify your email address to finish creating your Planova account:",
            verificationUrl,
            "",
            "This link expires in 30 minutes. If you did not create this account, you can ignore this email.",
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Mailjet rejected the verification email (${response.status})`);
  }
};

module.exports = { sendVerificationEmail };
