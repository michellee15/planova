const test = require("node:test");
const assert = require("node:assert/strict");
const { formatTravelTimes } = require("../src/services/routeService");

test("labels routed and speed-based travel estimates", () => {
  const travel = formatTravelTimes(5000, 600);
  assert.equal(travel.distanceKm, 5);
  assert.equal(travel.drivingMinutes, 10);
  assert.equal(travel.walkingMinutes, 60);
  assert.equal(travel.accuracy.driving, "route_estimate");
  assert.equal(travel.accuracy.walking, "speed_based_estimate");
});
