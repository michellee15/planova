const test = require("node:test");
const assert = require("node:assert/strict");

const httpServicePath = require.resolve("../src/services/httpService");
const emailServicePath = require.resolve("../src/services/emailService");

test("sendVerificationEmail sends a frontend fragment link through Mailjet", async () => {
  let request;
  delete require.cache[emailServicePath];
  require.cache[httpServicePath] = {
    id: httpServicePath,
    filename: httpServicePath,
    loaded: true,
    exports: {
      fetchWithTimeout: async (url, options) => {
        request = { url, options };
        return { ok: true, status: 201 };
      },
    },
  };

  const originalEnvironment = {
    MAILJET_API_KEY: process.env.MAILJET_API_KEY,
    MAILJET_SECRET_KEY: process.env.MAILJET_SECRET_KEY,
    MAILJET_SENDER_EMAIL: process.env.MAILJET_SENDER_EMAIL,
    FRONTEND_URL: process.env.FRONTEND_URL,
  };
  process.env.MAILJET_API_KEY = "test-api-key";
  process.env.MAILJET_SECRET_KEY = "test-secret-key";
  process.env.MAILJET_SENDER_EMAIL = "planova@example.com";
  process.env.FRONTEND_URL = "http://localhost:5173/";

  try {
    const { sendVerificationEmail } = require(emailServicePath);
    await sendVerificationEmail({
      to: "casey@example.com",
      name: "Casey <script>",
      token: "a".repeat(64),
    });
  } finally {
    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  assert.equal(request.url, "https://api.mailjet.com/v3.1/send");
  assert.equal(
    request.options.headers.authorization,
    `Basic ${Buffer.from("test-api-key:test-secret-key").toString("base64")}`
  );
  const body = JSON.parse(request.options.body);
  const message = body.Messages[0];
  assert.equal(message.From.Email, "planova@example.com");
  assert.equal(message.To[0].Email, "casey@example.com");
  assert.match(
    message.HTMLPart,
    /http:\/\/localhost:5173\/verify-email#token=a{64}/
  );
  assert.doesNotMatch(message.HTMLPart, /Casey <script>/);
});

test("sendVerificationEmail rejects missing Mailjet configuration", async () => {
  delete require.cache[emailServicePath];
  delete process.env.MAILJET_API_KEY;
  delete process.env.MAILJET_SECRET_KEY;
  delete process.env.MAILJET_SENDER_EMAIL;
  const { sendVerificationEmail } = require(emailServicePath);

  await assert.rejects(
    sendVerificationEmail({
      to: "casey@example.com",
      name: "Casey",
      token: "a".repeat(64),
    }),
    /configuration is missing/
  );
});
