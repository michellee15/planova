const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildOverpassQuery,
  getSearchGroups,
  getStraightLineDistanceKm,
  normalizePlace,
  parseTicketPrice,
  selectDiversePlaces,
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

test("selects food, grocery, and shopping searches from plural prompt terms", () => {
  const groups = getSearchGroups(
    "Find nearby cafes, restaurants, grocery markets and shopping malls"
  );
  assert.deepEqual(groups, ["food", "groceries", "shopping"]);
});

test("builds a bounded Overpass query for selected place types", () => {
  const query = buildOverpassQuery({
    latitude: 1.3,
    longitude: 103.8,
    radiusMeters: 5000,
    searchGroups: ["food", "groceries"],
  });
  assert.match(query, /restaurant/);
  assert.match(query, /supermarket/);
  assert.doesNotMatch(query, /museum/);
});

test("normalizes shop categories", () => {
  const place = normalizePlace(
    {
      type: "node",
      id: 456,
      lat: 1.3,
      lon: 103.8,
      tags: { name: "Example Mall", shop: "mall" },
    },
    { latitude: 1.29, longitude: 103.81 }
  );
  assert.equal(place.category, "mall");
});

test("diversifies nearby results by category", () => {
  const places = [
    { name: "Restaurant A", category: "restaurant" },
    { name: "Restaurant B", category: "restaurant" },
    { name: "Cafe A", category: "cafe" },
    { name: "Mall A", category: "mall" },
  ];
  const selected = selectDiversePlaces(places, 3);
  assert.deepEqual(
    selected.map((place) => place.name),
    ["Restaurant A", "Cafe A", "Mall A"]
  );
});
