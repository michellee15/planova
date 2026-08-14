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

test("acceptInvitation links the registered member and updates the count atomically", async () => {
  const invitation = {
    id: 8,
    trip_id: 44,
    user_id: 22,
    status: "accepted",
  };
  const calls = [];
  let released = false;
  const client = {
    query: async (text, values) => {
      calls.push({ text, values });
      if (/UPDATE trip_collaborators/.test(text)) return { rows: [invitation] };
      return { rows: [] };
    },
    release: () => {
      released = true;
    },
  };
  const model = loadModelWithPool({ connect: async () => client });

  assert.deepEqual(await model.acceptInvitation(8, 22), invitation);
  assert.equal(released, true);
  assert.deepEqual(
    calls.map(({ text }) => text.trim().split(/\s+/).slice(0, 2).join(" ")),
    [
      "BEGIN",
      "UPDATE trip_collaborators",
      "SELECT id",
      "UPDATE trip_members",
      "INSERT INTO",
      "UPDATE trips",
      "COMMIT",
    ]
  );
  assert.deepEqual(calls[3].values, [44, 22]);
  assert.match(calls[3].text, /LOWER\(BTRIM\(candidate\.name\)\)/);
  assert.match(calls[4].text, /ON CONFLICT \(trip_id, user_id\)/);
  assert.match(calls[5].text, /active_collaborator\.status = 'accepted'/);
});

test("acceptInvitation rolls back without changing members when no invitation is pending", async () => {
  const calls = [];
  let released = false;
  const client = {
    query: async (text, values) => {
      calls.push({ text, values });
      return { rows: [] };
    },
    release: () => {
      released = true;
    },
  };
  const model = loadModelWithPool({ connect: async () => client });

  assert.equal(await model.acceptInvitation(999, 22), null);
  assert.equal(released, true);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].text, "BEGIN");
  assert.match(calls[1].text, /UPDATE trip_collaborators/);
  assert.equal(calls[2].text, "ROLLBACK");
  assert.equal(calls.some(({ text }) => /INSERT INTO trip_members/.test(text)), false);
});

test("removeCollaborator recalculates active membership before committing", async () => {
  const removed = { id: 8, user_id: 22 };
  const calls = [];
  let released = false;
  const client = {
    query: async (text, values) => {
      calls.push({ text, values });
      if (/DELETE FROM trip_collaborators/.test(text)) return { rows: [removed] };
      return { rows: [] };
    },
    release: () => {
      released = true;
    },
  };
  const model = loadModelWithPool({ connect: async () => client });

  assert.deepEqual(await model.removeCollaborator(44, 22, 12), removed);
  assert.equal(released, true);
  assert.match(calls[2].text, /SELECT id/);
  assert.match(calls[3].text, /UPDATE chat_sessions/);
  assert.match(calls[4].text, /UPDATE trips t/);
  assert.deepEqual(calls[4].values, [44]);
  assert.equal(calls.at(-1).text, "COMMIT");
});

test("leaveTrip recalculates active membership before committing", async () => {
  const removed = { id: 8 };
  const calls = [];
  let released = false;
  const client = {
    query: async (text, values) => {
      calls.push({ text, values });
      if (/DELETE FROM trip_collaborators/.test(text)) return { rows: [removed] };
      return { rows: [] };
    },
    release: () => {
      released = true;
    },
  };
  const model = loadModelWithPool({ connect: async () => client });

  assert.deepEqual(await model.leaveTrip(44, 22), removed);
  assert.equal(released, true);
  assert.match(calls[2].text, /SELECT id/);
  assert.match(calls[3].text, /UPDATE chat_sessions/);
  assert.match(calls[4].text, /UPDATE trips t/);
  assert.deepEqual(calls[4].values, [44]);
  assert.equal(calls.at(-1).text, "COMMIT");
});
