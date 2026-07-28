const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getStraightLineDistanceKm,
  normalizePlace,
  parseTicketPrice,
} = require("../src/services/placeService");

test("calculates straight-line distance between coordinates", () => {
  const distance = getStraightLineDistanceKm(
    { latitude: 1.29027, longitude: 103.851959 },
    { latitude: 1.2834, longitude: 103.8607 }
  );
  assert.ok(distance > 1);
  assert.ok(distance < 2);
});

test("parses sourced ticket metadata", () => {
  assert.deepEqual(parseTicketPrice({ charge: "SGD 25" }), {
    amount: 25,
    currency: "SGD",
    raw: "SGD 25",
    source: "openstreetmap",
  });
});

test("normalizes a named OpenStreetMap element", () => {
  const place = normalizePlace(
    {
      type: "node",
      id: 123,
      lat: 1.3,
      lon: 103.8,
      tags: {
        name: "Example Museum",
        tourism: "museum",
        opening_hours: "10:00-18:00",
      },
    },
    { latitude: 1.29, longitude: 103.81 }
  );

  assert.equal(place.placeId, "node/123");
  assert.equal(place.name, "Example Museum");
  assert.equal(place.category, "museum");
  assert.equal(place.openingHours, "10:00-18:00");
});
