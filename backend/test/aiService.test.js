const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildPrompt,
  validateRecommendation,
} = require("../src/services/aiService");

test("does not include candidate coordinates in the Gemini prompt", () => {
  const prompt = buildPrompt({
    message: "What is nearby?",
    requestedMode: "discover",
    candidates: [
      {
        placeId: "node/1",
        name: "Museum",
        category: "museum",
        latitude: 1.234567,
        longitude: 103.765432,
        address: "Example Street",
        openingHours: null,
        fee: null,
        ticketPrice: null,
        wheelchair: null,
        distanceStraightLineKm: 1.2,
        travel: null,
      },
    ],
    history: [],
    trip: null,
    localDate: "2026-07-28",
    localTime: "12:00",
    timezone: "Asia/Singapore",
    planningWindowHours: 4,
  });

  assert.doesNotMatch(prompt, /1\.234567/);
  assert.doesNotMatch(prompt, /103\.765432/);
  assert.match(prompt, /node\/1/);
});

test("rejects recommendations containing unknown places", () => {
  assert.throws(
    () =>
      validateRecommendation(
        {
          mode: "discover",
          items: [{ placeId: "node/unknown" }],
        },
        new Set(["node/1"])
      ),
    /unknown place/
  );
});
