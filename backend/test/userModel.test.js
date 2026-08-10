const test = require("node:test");
const assert = require("node:assert/strict");

const databasePath = require.resolve("../src/config/db");
const modelPath = require.resolve("../src/models/userModel");

const loadModelWithPool = (pool) => {
  delete require.cache[modelPath];
  require.cache[databasePath] = {
    id: databasePath,
    filename: databasePath,
    loaded: true,
    exports: pool,
  };
  return require(modelPath);
};

test("findUserByEmail compares addresses case-insensitively", async () => {
  const calls = [];
  const model = loadModelWithPool({
    query: async (text, values) => {
      calls.push({ text, values });
      return { rows: [] };
    },
  });

  await model.findUserByEmail("Casey@example.com");

  assert.match(calls[0].text, /LOWER\(email\) = LOWER\(\$1\)/);
  assert.deepEqual(calls[0].values, ["Casey@example.com"]);
});

test("createUser stores the pending verification token and initial send window", async () => {
  const calls = [];
  const expectedUser = { id: 7, email: "casey@example.com" };
  const model = loadModelWithPool({
    query: async (text, values) => {
      calls.push({ text, values });
      return { rows: [expectedUser] };
    },
  });
  const expiresAt = new Date("2030-01-01T00:00:00.000Z");

  const user = await model.createUser({
    name: "Casey",
    email: "casey@example.com",
    password_hash: "hash",
    verification_token_hash: "a".repeat(64),
    verification_token_expires_at: expiresAt,
  });

  assert.equal(user, expectedUser);
  assert.match(calls[0].text, /verification_token_hash/);
  assert.match(calls[0].text, /verification_send_count/);
  assert.deepEqual(calls[0].values, [
    "Casey",
    "casey@example.com",
    "hash",
    "a".repeat(64),
    expiresAt,
  ]);
});

test("verifyUserByTokenHash only consumes an unexpired token once", async () => {
  const calls = [];
  const model = loadModelWithPool({
    query: async (text, values) => {
      calls.push({ text, values });
      return { rows: [{ id: 7 }] };
    },
  });

  await model.verifyUserByTokenHash("a".repeat(64));

  assert.match(calls[0].text, /verification_token_expires_at > NOW\(\)/);
  assert.match(calls[0].text, /verification_token_hash = NULL/);
  assert.match(calls[0].text, /email_verified_at IS NULL/);
});

test("prepareVerificationResend enforces cooldown and daily limits atomically", async () => {
  const calls = [];
  const model = loadModelWithPool({
    query: async (text, values) => {
      calls.push({ text, values });
      return { rows: [] };
    },
  });

  await model.prepareVerificationResend({
    email: "casey@example.com",
    verification_token_hash: "b".repeat(64),
    verification_token_expires_at: new Date("2030-01-01T00:00:00.000Z"),
  });

  assert.match(calls[0].text, /INTERVAL '60 seconds'/);
  assert.match(calls[0].text, /INTERVAL '24 hours'/);
  assert.match(calls[0].text, /verification_send_count < 5/);
  assert.match(calls[0].text, /LOWER\(email\) = LOWER\(\$1\)/);
});
