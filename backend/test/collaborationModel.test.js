const test = require("node:test");
const assert = require("node:assert/strict");

const databasePath = require.resolve("../src/config/db");
const modelPath = require.resolve("../src/models/collaborationModel");

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

test("getTripOwner returns the trip owner separately from invited collaborators", async () => {
  const expectedOwner = {
    user_id: 12,
    name: "User A",
    email: "usera@example.com",
    role: "owner",
  };
  const calls = [];
  const model = loadModelWithPool({
    query: async (text, values) => {
      calls.push({ text, values });
      return { rows: [expectedOwner] };
    },
  });

  const owner = await model.getTripOwner(44);

  assert.deepEqual(owner, expectedOwner);
  assert.deepEqual(calls[0].values, [44]);
  assert.match(calls[0].text, /JOIN users u ON u\.id = t\.user_id/);
  assert.match(calls[0].text, /'owner' AS role/);
});

test("getTripOwner returns null when the trip does not exist", async () => {
  const model = loadModelWithPool({
    query: async () => ({ rows: [] }),
  });

  assert.equal(await model.getTripOwner(999), null);
});
