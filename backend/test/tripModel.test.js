const test = require("node:test");
const assert = require("node:assert/strict");

const databasePath = require.resolve("../src/config/db");
const modelPath = require.resolve("../src/models/tripModel");

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

test("createTrip creates the registered owner member in the same transaction", async () => {
  const newTrip = { id: 41, user_id: 7, title: "Japan", num_of_people: 1 };
  const calls = [];
  let released = false;
  const client = {
    query: async (text, values) => {
      calls.push({ text, values });
      if (/INSERT INTO trips/.test(text)) return { rows: [newTrip] };
      return { rows: [] };
    },
    release: () => {
      released = true;
    },
  };
  const model = loadModelWithPool({ connect: async () => client });

  const result = await model.createTrip({
    user_id: 7,
    title: "Japan",
    destination: "Tokyo",
    start_date: null,
    end_date: null,
    total_budget: 1000,
    currency: "SGD",
    num_of_people: 99,
  });

  assert.deepEqual(result, newTrip);
  assert.equal(released, true);
  assert.match(calls[1].text, /VALUES\s+\(\$1, \$2, \$3, \$4, \$5, \$6, \$7, 1\)/);
  assert.equal(calls[1].values.includes(99), false);
  assert.match(calls[2].text, /INSERT INTO trip_members \(trip_id, user_id, name\)/);
  assert.deepEqual(calls[2].values, [41, 7]);
  assert.equal(calls.at(-1).text, "COMMIT");
});

test("updateTrip ignores client-supplied people counts", async () => {
  const calls = [];
  const model = loadModelWithPool({
    query: async (text, values) => {
      calls.push({ text, values });
      return { rows: [{ id: 41, num_of_people: 2 }] };
    },
  });

  await model.updateTrip(41, 7, {
    title: "Japan",
    destination: "Tokyo",
    start_date: null,
    end_date: null,
    total_budget: 1000,
    currency: "SGD",
    num_of_people: 99,
  });

  assert.doesNotMatch(calls[0].text, /num_of_people\s*=/);
  assert.equal(calls[0].values.includes(99), false);
  assert.deepEqual(calls[0].values.slice(-2), [41, 7]);
});
