const test = require("node:test");
const assert = require("node:assert/strict");

const databasePath = require.resolve("../src/config/db");
const modelPath = require.resolve("../src/models/memberModel");

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

const createTransactionPool = (queryHandler) => {
  const calls = [];
  let released = false;
  const client = {
    query: async (text, values) => {
      calls.push({ text, values });
      return queryHandler(text, values);
    },
    release: () => {
      released = true;
    },
  };
  return {
    pool: { connect: async () => client },
    calls,
    wasReleased: () => released,
  };
};

test("getMembersByTripId returns active registered users and manual guests", async () => {
  const expectedMembers = [
    { id: 1, name: "Owner", user_id: 7, member_type: "registered" },
    { id: 2, name: "Guest", user_id: null, member_type: "guest" },
  ];
  const calls = [];
  const model = loadModelWithPool({
    query: async (text, values) => {
      calls.push({ text, values });
      return { rows: expectedMembers };
    },
  });

  assert.deepEqual(await model.getMembersByTripId(11, 7), expectedMembers);
  assert.deepEqual(calls[0].values, [11, 7]);
  assert.match(calls[0].text, /LEFT JOIN users u ON u\.id = tm\.user_id/);
  assert.match(calls[0].text, /tm\.user_id IS NULL/);
  assert.match(calls[0].text, /active_collaborator\.status = 'accepted'/);
});

test("createMember adds a manual guest and updates the trip count atomically", async () => {
  const newMember = { id: 9, trip_id: 11, name: "Guest", user_id: null };
  const transaction = createTransactionPool(async (text) => {
    if (/SELECT id\s+FROM trips/.test(text)) return { rows: [{ id: 11 }] };
    if (/INSERT INTO trip_members/.test(text)) return { rows: [newMember] };
    return { rows: [] };
  });
  const model = loadModelWithPool(transaction.pool);

  const result = await model.createMember({
    user_id: 7,
    trip_id: 11,
    name: "Guest",
  });

  assert.deepEqual(result, newMember);
  assert.equal(transaction.wasReleased(), true);
  assert.deepEqual(
    transaction.calls.map(({ text }) => text.trim().split(/\s+/).slice(0, 2).join(" ")),
    ["BEGIN", "SELECT id", "INSERT INTO", "UPDATE trips", "COMMIT"]
  );
  assert.match(transaction.calls[2].text, /user_id\)\s+VALUES \(\$1, \$2, NULL\)/);
  assert.match(transaction.calls[3].text, /COUNT\(\*\)::integer/);
});

test("deleteMember protects registered members from the manual delete path", async () => {
  const registeredMember = {
    id: 9,
    trip_id: 11,
    name: "Collaborator",
    user_id: 22,
  };
  const transaction = createTransactionPool(async (text) => {
    if (/SELECT tm\.\*/.test(text)) return { rows: [registeredMember] };
    return { rows: [] };
  });
  const model = loadModelWithPool(transaction.pool);

  const result = await model.deleteMember(9, 7);

  assert.deepEqual(result, { protected: true, member: registeredMember });
  assert.equal(transaction.wasReleased(), true);
  assert.equal(transaction.calls.some(({ text }) => /DELETE FROM trip_members/.test(text)), false);
  assert.equal(transaction.calls.at(-1).text, "ROLLBACK");
});

test("deleteMember removes a manual guest and updates the count atomically", async () => {
  const manualMember = { id: 9, trip_id: 11, name: "Guest", user_id: null };
  const transaction = createTransactionPool(async (text) => {
    if (/SELECT tm\.\*/.test(text)) return { rows: [manualMember] };
    if (/DELETE FROM trip_members/.test(text)) return { rows: [manualMember] };
    return { rows: [] };
  });
  const model = loadModelWithPool(transaction.pool);

  const result = await model.deleteMember(9, 7);

  assert.deepEqual(result, { protected: false, member: manualMember });
  assert.equal(transaction.wasReleased(), true);
  assert.equal(transaction.calls.at(-1).text, "COMMIT");
  assert.equal(transaction.calls.some(({ text }) => /UPDATE trips t/.test(text)), true);
});
