const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");

const userModelPath = require.resolve("../src/models/userModel");
const emailServicePath = require.resolve("../src/services/emailService");
const controllerPath = require.resolve(
  "../src/controllers/authenticationController"
);

const loadController = ({ userModel = {}, emailService = {} } = {}) => {
  delete require.cache[controllerPath];
  require.cache[userModelPath] = {
    id: userModelPath,
    filename: userModelPath,
    loaded: true,
    exports: userModel,
  };
  require.cache[emailServicePath] = {
    id: emailServicePath,
    filename: emailServicePath,
    loaded: true,
    exports: emailService,
  };
  return require(controllerPath);
};

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return response;
};

test("registerUser creates an unverified account and sends a hashed one-time token", async () => {
  let createdUserData;
  let sentEmail;
  const controller = loadController({
    userModel: {
      findUserByEmail: async () => null,
      createUser: async (data) => {
        createdUserData = data;
        return {
          id: 9,
          name: data.name,
          email: data.email,
          email_verified_at: null,
        };
      },
    },
    emailService: {
      sendVerificationEmail: async (data) => {
        sentEmail = data;
      },
    },
  });
  const response = createResponse();

  await controller.registerUser(
    {
      body: {
        name: "  Casey  ",
        email: "Casey@Example.com",
        password: "secret-password",
      },
    },
    response
  );

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.token, undefined);
  assert.equal(createdUserData.name, "Casey");
  assert.equal(createdUserData.email, "casey@example.com");
  assert.match(createdUserData.verification_token_hash, /^[a-f0-9]{64}$/);
  assert.ok(
    createdUserData.verification_token_expires_at.getTime() > Date.now()
  );
  assert.equal(sentEmail.to, "casey@example.com");
  assert.equal(sentEmail.name, "Casey");
  assert.equal(
    crypto.createHash("sha256").update(sentEmail.token).digest("hex"),
    createdUserData.verification_token_hash
  );
});

test("registerUser retains the pending account when email delivery fails", async () => {
  const controller = loadController({
    userModel: {
      findUserByEmail: async () => null,
      createUser: async (data) => ({
        id: 10,
        name: data.name,
        email: data.email,
      }),
    },
    emailService: {
      sendVerificationEmail: async () => {
        throw new Error("provider unavailable");
      },
    },
  });
  const response = createResponse();
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await controller.registerUser(
      {
        body: {
          name: "Casey",
          email: "casey@example.com",
          password: "secret-password",
        },
      },
      response
    );
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.code, "VERIFICATION_EMAIL_FAILED");
  assert.equal(response.body.email, "casey@example.com");
});

test("loginUser blocks a correct password until the email is verified", async () => {
  const passwordHash = await bcrypt.hash("secret-password", 4);
  const controller = loadController({
    userModel: {
      findUserByEmail: async () => ({
        id: 11,
        email: "casey@example.com",
        password_hash: passwordHash,
        email_verified_at: null,
      }),
    },
  });
  const response = createResponse();

  await controller.loginUser(
    {
      body: {
        email: "casey@example.com",
        password: "secret-password",
      },
    },
    response
  );

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.code, "EMAIL_NOT_VERIFIED");
});

test("loginUser still issues the normal JWT for a verified account", async () => {
  const passwordHash = await bcrypt.hash("secret-password", 4);
  const originalJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-jwt-secret";
  const controller = loadController({
    userModel: {
      findUserByEmail: async () => ({
        id: 11,
        name: "Casey",
        email: "casey@example.com",
        password_hash: passwordHash,
        email_verified_at: new Date(),
        created_at: new Date(),
      }),
    },
  });
  const response = createResponse();

  try {
    await controller.loginUser(
      {
        body: {
          email: "casey@example.com",
          password: "secret-password",
        },
      },
      response
    );
  } finally {
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }

  assert.equal(response.statusCode, 200);
  assert.equal(typeof response.body.token, "string");
  assert.equal(response.body.user.email, "casey@example.com");
});

test("verifyEmail hashes and consumes a valid token", async () => {
  const token = "a".repeat(64);
  let receivedHash;
  const controller = loadController({
    userModel: {
      verifyUserByTokenHash: async (tokenHash) => {
        receivedHash = tokenHash;
        return { id: 12, email_verified_at: new Date() };
      },
    },
  });
  const response = createResponse();

  await controller.verifyEmail({ body: { token } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(
    receivedHash,
    crypto.createHash("sha256").update(token).digest("hex")
  );
  assert.match(response.body.message, /verified/i);
});

test("verifyEmail rejects malformed tokens without querying the database", async () => {
  let queried = false;
  const controller = loadController({
    userModel: {
      verifyUserByTokenHash: async () => {
        queried = true;
      },
    },
  });
  const response = createResponse();

  await controller.verifyEmail({ body: { token: "not-a-token" } }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.code, "INVALID_OR_EXPIRED_VERIFICATION_TOKEN");
  assert.equal(queried, false);
});

test("resendVerificationEmail returns the same response when no account is eligible", async () => {
  let emailSent = false;
  const controller = loadController({
    userModel: {
      prepareVerificationResend: async () => null,
    },
    emailService: {
      sendVerificationEmail: async () => {
        emailSent = true;
      },
    },
  });
  const response = createResponse();

  await controller.resendVerificationEmail(
    { body: { email: "unknown@example.com" } },
    response
  );

  assert.equal(response.statusCode, 202);
  assert.match(response.body.message, /if an unverified account exists/i);
  assert.equal(emailSent, false);
});

test("resendVerificationEmail replaces the token before sending", async () => {
  let preparedData;
  let sentEmail;
  const controller = loadController({
    userModel: {
      prepareVerificationResend: async (data) => {
        preparedData = data;
        return { name: "Casey", email: "casey@example.com" };
      },
    },
    emailService: {
      sendVerificationEmail: async (data) => {
        sentEmail = data;
      },
    },
  });
  const response = createResponse();

  await controller.resendVerificationEmail(
    { body: { email: "CASEY@example.com" } },
    response
  );

  assert.equal(response.statusCode, 202);
  assert.equal(preparedData.email, "casey@example.com");
  assert.equal(
    crypto.createHash("sha256").update(sentEmail.token).digest("hex"),
    preparedData.verification_token_hash
  );
});
