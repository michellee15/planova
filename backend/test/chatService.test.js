const test = require("node:test");
const assert = require("node:assert/strict");
const {
  inferMode,
  validateCoordinates,
  getLocalClock,
  normalizePrice,
  buildGoogleMapsUrl,
  enrichResponseDataWithGoogleMapsUrls,
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

test("builds a Google Maps search URL from a place name and address", () => {
  const googleMapsUrl = buildGoogleMapsUrl({
    name: "Asian Civilisations Museum",
    address: "1 Empress Place, Singapore",
    latitude: 1.2875,
    longitude: 103.8514,
  });
  const parsedUrl = new URL(googleMapsUrl);

  assert.equal(parsedUrl.protocol, "https:");
  assert.equal(parsedUrl.hostname, "www.google.com");
  assert.equal(parsedUrl.pathname, "/maps/search/");
  assert.equal(parsedUrl.searchParams.get("api"), "1");
  assert.equal(
    parsedUrl.searchParams.get("query"),
    "Asian Civilisations Museum, 1 Empress Place, Singapore"
  );
});

test("falls back to the place name when an address is unavailable", () => {
  const googleMapsUrl = buildGoogleMapsUrl({
    name: "Example Museum",
    address: null,
    latitude: 1.3,
    longitude: 103.8,
  });
  const parsedUrl = new URL(googleMapsUrl);

  assert.equal(parsedUrl.searchParams.get("query"), "Example Museum");
});

test("falls back to coordinates when name and address are unavailable", () => {
  const googleMapsUrl = buildGoogleMapsUrl({
    name: null,
    address: null,
    latitude: 1.3,
    longitude: 103.8,
  });
  const parsedUrl = new URL(googleMapsUrl);

  assert.equal(parsedUrl.searchParams.get("query"), "1.3,103.8");
});

test("returns null when no usable place information exists", () => {
  assert.equal(
    buildGoogleMapsUrl({
      name: null,
      address: null,
      latitude: null,
      longitude: null,
    }),
    null
  );
});

test("adds Google Maps URLs to historical recommendation data", () => {
  const historicalResponseData = {
    mode: "discover",
    items: [
      {
        name: "Asian Civilisations Museum",
        location: "1 Empress Place, Singapore",
        latitude: 1.2875,
        longitude: 103.8514,
      },
    ],
  };

  const enriched = enrichResponseDataWithGoogleMapsUrls(
    historicalResponseData
  );

  assert.equal(historicalResponseData.items[0].googleMapsUrl, undefined);
  assert.equal(
    new URL(enriched.items[0].googleMapsUrl).searchParams.get("query"),
    "Asian Civilisations Museum, 1 Empress Place, Singapore"
  );
});

test("preserves existing Google Maps URLs in recommendation data", () => {
  const existingGoogleMapsUrl =
    "https://www.google.com/maps/search/?api=1&query=Existing+Place";
  const responseData = {
    items: [
      {
        name: "Existing Place",
        location: "Existing Address",
        googleMapsUrl: existingGoogleMapsUrl,
      },
    ],
  };

  const enriched = enrichResponseDataWithGoogleMapsUrls(responseData);

  assert.equal(enriched.items[0].googleMapsUrl, existingGoogleMapsUrl);
});

test("leaves response data without recommendation items unchanged", () => {
  assert.equal(enrichResponseDataWithGoogleMapsUrls(null), null);

  const responseData = { mode: "discover" };
  assert.equal(enrichResponseDataWithGoogleMapsUrls(responseData), responseData);
});
