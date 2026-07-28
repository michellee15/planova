const { fetchWithTimeout } = require("./httpService");

const OSRM_BASE_URL = "https://router.project-osrm.org";
const WALKING_SPEED_KMH = 5;
const PUBLIC_TRANSPORT_SPEED_KMH = 25;
const MAX_TABLE_LOCATIONS = 25;

const roundToOneDecimalPlace = (value) => Math.round(value * 10) / 10;
const roundToMinute = (value) => Math.max(1, Math.round(value));

const validateCoordinate = (location, label) => {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(`${label} coordinates are invalid`);
  }

  return { latitude, longitude };
};

const formatTravelTimes = (distanceMeters, durationSeconds) => {
  if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) {
    return null;
  }

  const distanceKm = distanceMeters / 1000;
  return {
    distanceKm: roundToOneDecimalPlace(distanceKm),
    drivingMinutes: roundToMinute(durationSeconds / 60),
    grabMinutes: roundToMinute(durationSeconds / 60),
    publicTransportMinutes: roundToMinute(
      (distanceKm / PUBLIC_TRANSPORT_SPEED_KMH) * 60
    ),
    walkingMinutes: roundToMinute((distanceKm / WALKING_SPEED_KMH) * 60),
    accuracy: {
      driving: "route_estimate",
      publicTransport: "speed_based_estimate",
      walking: "speed_based_estimate",
    },
  };
};

const getTravelTimes = async ({ origin, destination }) => {
  const safeOrigin = validateCoordinate(origin, "Origin");
  const safeDestination = validateCoordinate(destination, "Destination");
  const coordinates = [
    `${safeOrigin.longitude},${safeOrigin.latitude}`,
    `${safeDestination.longitude},${safeDestination.latitude}`,
  ].join(";");
  const url =
    `${OSRM_BASE_URL}/route/v1/driving/${coordinates}` +
    "?overview=false&alternatives=false&steps=false";

  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Planova/1.0 student-project",
    },
  }, 15000);

  if (!response.ok) {
    throw new Error(`Routing service returned status ${response.status}`);
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (data.code !== "Ok" || !route) {
    throw new Error(data.message || "No route found");
  }

  return formatTravelTimes(route.distance, route.duration);
};

const getTravelTimesForDestinations = async ({ origin, destinations }) => {
  if (!Array.isArray(destinations) || destinations.length === 0) return [];
  if (destinations.length + 1 > MAX_TABLE_LOCATIONS) {
    throw new Error(`A maximum of ${MAX_TABLE_LOCATIONS - 1} destinations is supported`);
  }

  const locations = [
    validateCoordinate(origin, "Origin"),
    ...destinations.map((destination, index) =>
      validateCoordinate(destination, `Destination ${index + 1}`)
    ),
  ];
  const coordinates = locations
    .map(({ longitude, latitude }) => `${longitude},${latitude}`)
    .join(";");
  const url =
    `${OSRM_BASE_URL}/table/v1/driving/${coordinates}` +
    "?sources=0&annotations=duration,distance";

  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Planova/1.0 student-project",
    },
  }, 15000);

  if (!response.ok) {
    throw new Error(`Routing service returned status ${response.status}`);
  }

  const data = await response.json();
  if (data.code !== "Ok" || !data.durations?.[0] || !data.distances?.[0]) {
    throw new Error(data.message || "No routes found");
  }

  return destinations.map((_, index) =>
    formatTravelTimes(data.distances[0][index + 1], data.durations[0][index + 1])
  );
};

const getTravelTimesForLegs = async (locations) => {
  if (!Array.isArray(locations) || locations.length < 2) return [];
  if (locations.length > MAX_TABLE_LOCATIONS) {
    throw new Error(`A maximum of ${MAX_TABLE_LOCATIONS} locations is supported`);
  }

  const safeLocations = locations.map((location, index) =>
    validateCoordinate(location, `Location ${index + 1}`)
  );
  const coordinates = safeLocations
    .map(({ longitude, latitude }) => `${longitude},${latitude}`)
    .join(";");
  const url =
    `${OSRM_BASE_URL}/table/v1/driving/${coordinates}` +
    "?annotations=duration,distance";
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Planova/1.0 student-project",
    },
  }, 15000);

  if (!response.ok) {
    throw new Error(`Routing service returned status ${response.status}`);
  }

  const data = await response.json();
  if (data.code !== "Ok" || !data.durations || !data.distances) {
    throw new Error(data.message || "No routes found");
  }

  return safeLocations.slice(0, -1).map((_, index) =>
    formatTravelTimes(
      data.distances[index][index + 1],
      data.durations[index][index + 1]
    )
  );
};

module.exports = {
  getTravelTimes,
  getTravelTimesForDestinations,
  getTravelTimesForLegs,
  formatTravelTimes,
};
