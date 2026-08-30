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
      calls.push({text, values});
      return {rows: []};
    },
  });

  await model.findUserByEmail("Casey@example.com");

  assert.match(calls[0].text, /LOWER\(email\) = LOWER\(\$1\)/);
  assert.deepEqual(calls[0].values, ["Casey@example.com"]);
});

test("createUser stores only account fields", async () => {
  const calls = [];
  const expectedUser = {id: 7, email: "casey@example.com"};
  const model = loadModelWithPool({
    query: async (text, values) => {
      calls.push({text, values});
      return {rows: [expectedUser]};
    },
  });

  const user = await model.createUser({
    name: "Casey",
    email: "casey@example.com",
    password_hash: "hash",
  });

  assert.equal(user, expectedUser);
  assert.match(calls[0].text, /\(name, email, password_hash\)/);
  assert.deepEqual(calls[0].values, ["Casey", "casey@example.com", "hash"]);
});
