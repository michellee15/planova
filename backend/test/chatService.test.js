const test = require("node:test");
const assert = require("node:assert/strict");
const {
  inferMode,
  validateCoordinates,
  getLocalClock,
  normalizePrice,
} = require("../src/services/chatService");

test("infers plan intent while allowing an explicit mode", () => {
  assert.equal(inferMode("Plan my afternoon", "auto"), "plan");
  assert.equal(inferMode("What museums are nearby?", "auto"), "discover");
  assert.equal(inferMode("Plan my afternoon", "discover"), "discover");
});

test("validates latitude and longitude ranges", () => {
  assert.deepEqual(validateCoordinates({ latitude: "1.3", longitude: "103.8" }), {
    latitude: 1.3,
    longitude: 103.8,
  });
  assert.equal(validateCoordinates({ latitude: 91, longitude: 0 }), null);
});

test("formats a local clock for a valid timezone", () => {
  const clock = getLocalClock("Asia/Singapore");
  assert.match(clock.localDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(clock.localTime, /^\d{2}:\d{2}$/);
});

test("calculates group totals for estimated prices", () => {
  const price = normalizePrice(
    { ticketPrice: null },
    {
      status: "estimated",
      min: 10,
      max: 15,
      currency: "SGD",
      confidence: "medium",
      note: "Estimated; verify the official price.",
    },
    3
  );

  assert.equal(price.status, "estimated");
  assert.deepEqual(price.groupTotal, {
    people: 3,
    min: 30,
    max: 45,
    currency: "SGD",
  });
});
