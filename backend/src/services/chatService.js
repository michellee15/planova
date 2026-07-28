const aiService = require("./aiService");
const { geocodeLocation } = require("./geocodeService");
const placeService = require("./placeService");
const routeService = require("./routeService");

const DEFAULT_RADIUS_KM = 5;
const DEFAULT_PLANNING_WINDOW_HOURS = 4;
const MAX_CANDIDATES = 20;
const MAX_RESULTS = 8;

const inferMode = (message, requestedMode) => {
  if (["discover", "plan"].includes(requestedMode)) return requestedMode;
  return /\b(plan|itinerary|schedule|morning|afternoon|evening|day)\b/i.test(
    message
  )
    ? "plan"
    : "discover";
};

const validateCoordinates = (location) => {
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
    return null;
  }
  return { latitude, longitude };
};

const resolveOrigin = async ({ location, manualLocation }) => {
  const coordinates = validateCoordinates(location);
  if (coordinates) return coordinates;
  if (!manualLocation?.trim()) {
    const error = new Error(
      "Current location or a manually entered location is required"
    );
    error.statusCode = 400;
    throw error;
  }

  const geocoded = await geocodeLocation(manualLocation.trim());
  if (!geocoded) {
    const error = new Error("The manually entered location could not be found");
    error.statusCode = 400;
    throw error;
  }
  return {
    latitude: geocoded.latitude,
    longitude: geocoded.longitude,
  };
};

const getLocalClock = (timezone) => {
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    const error = new Error("Timezone is invalid");
    error.statusCode = 400;
    throw error;
  }

  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  return {
    localDate: `${parts.year}-${parts.month}-${parts.day}`,
    localTime: `${parts.hour}:${parts.minute}`,
  };
};

const attachOriginTravelTimes = async (origin, places) => {
  try {
    const travelTimes = await routeService.getTravelTimesForDestinations({
      origin,
      destinations: places.map(({ latitude, longitude }) => ({
        latitude,
        longitude,
      })),
    });
    return places.map((place, index) => ({
      ...place,
      travel: travelTimes[index],
    }));
  } catch (error) {
    console.error("Travel-time lookup failed:", error);
    return places.map((place) => ({ ...place, travel: null }));
  }
};

const normalizePrice = (candidate, price, peopleCount) => {
  let normalized;
  if (candidate.ticketPrice?.amount != null) {
    normalized = {
      status: "sourced",
      min: candidate.ticketPrice.amount,
      max: candidate.ticketPrice.amount,
      currency: candidate.ticketPrice.currency || price?.currency || null,
      confidence: "high",
      note: "Price sourced from OpenStreetMap metadata; verify before booking.",
      source: candidate.ticketPrice.source,
    };
  } else if (
    price?.status === "estimated" &&
    Number.isFinite(Number(price.min)) &&
    Number.isFinite(Number(price.max))
  ) {
    const min = Math.max(0, Number(price.min));
    const max = Math.max(min, Number(price.max));
    normalized = {
      status: "estimated",
      min,
      max,
      currency: price.currency || null,
      confidence: ["low", "medium", "high"].includes(price.confidence)
        ? price.confidence
        : "low",
      note: price.note || "Estimated price; verify with the attraction.",
      source: null,
    };
  } else {
    normalized = {
      status: "unavailable",
      min: null,
      max: null,
      currency: price?.currency || null,
      confidence: null,
      note: "Price unavailable; check the attraction's official website.",
      source: null,
    };
  }

  if (
    peopleCount &&
    normalized.min !== null &&
    normalized.max !== null
  ) {
    normalized.groupTotal = {
      people: peopleCount,
      min: Math.round(normalized.min * peopleCount * 100) / 100,
      max: Math.round(normalized.max * peopleCount * 100) / 100,
      currency: normalized.currency,
    };
  } else {
    normalized.groupTotal = null;
  }
  return normalized;
};

const validTime = (value) =>
  typeof value === "string" &&
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
    ? value
    : null;

const hydrateRecommendation = async ({
  recommendation,
  candidates,
  origin,
  trip,
  localDate,
  requestedMode,
}) => {
  if (recommendation.mode !== requestedMode) {
    throw new Error("AI response mode did not match the requested mode");
  }

  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.placeId, candidate])
  );
  const seen = new Set();
  const items = recommendation.items
    .filter((item) => {
      if (seen.has(item.placeId) || !candidateMap.has(item.placeId)) return false;
      seen.add(item.placeId);
      return true;
    })
    .slice(0, MAX_RESULTS)
    .map((item) => {
      const candidate = candidateMap.get(item.placeId);
      return {
        placeId: candidate.placeId,
        name: candidate.name,
        category: candidate.category,
        location: candidate.address || candidate.name,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        openingHours: candidate.openingHours,
        website: candidate.website,
        phone: candidate.phone,
        wheelchair: candidate.wheelchair,
        source: candidate.source,
        reason: item.reason,
        estimatedVisitMinutes: item.estimatedVisitMinutes,
        startTime: requestedMode === "plan" ? validTime(item.startTime) : null,
        endTime: requestedMode === "plan" ? validTime(item.endTime) : null,
        travelFromOrigin: candidate.travel,
        travelFromPrevious: null,
        price: normalizePrice(candidate, item.price, trip?.num_of_people),
      };
    });

  if (requestedMode === "plan" && items.length > 0) {
    try {
      const legs = await routeService.getTravelTimesForLegs([
        origin,
        ...items.map(({ latitude, longitude }) => ({ latitude, longitude })),
      ]);
      items.forEach((item, index) => {
        item.travelFromPrevious = legs[index] || null;
      });
    } catch (error) {
      console.error("Plan-leg routing failed:", error);
    }
  }

  return {
    mode: requestedMode,
    message: recommendation.message,
    planDate:
      requestedMode === "plan" &&
      /^\d{4}-\d{2}-\d{2}$/.test(recommendation.planDate || "")
        ? recommendation.planDate
        : requestedMode === "plan"
          ? localDate
          : null,
    radiusKm: null,
    items,
    disclaimer:
      "Travel times and unsourced prices are estimates. Verify opening hours and ticket prices before visiting.",
  };
};

const buildDiscoveryFallback = ({ candidates, trip }) => ({
  mode: "discover",
  message:
    "Here are the nearest attractions. AI ranking is temporarily unavailable.",
  planDate: null,
  radiusKm: null,
  items: candidates.slice(0, MAX_RESULTS).map((candidate) => ({
    placeId: candidate.placeId,
    name: candidate.name,
    category: candidate.category,
    location: candidate.address || candidate.name,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    openingHours: candidate.openingHours,
    website: candidate.website,
    phone: candidate.phone,
    wheelchair: candidate.wheelchair,
    source: candidate.source,
    reason: "Nearby based on your current location and requested place type.",
    estimatedVisitMinutes: 60,
    startTime: null,
    endTime: null,
    travelFromOrigin: candidate.travel,
    travelFromPrevious: null,
    price: normalizePrice(candidate, null, trip?.num_of_people),
  })),
  disclaimer:
    "Travel times are estimates. Verify opening hours and ticket prices before visiting.",
  degraded: true,
});

const generateChatResponse = async ({
  message,
  mode,
  location,
  manualLocation,
  timezone,
  radiusKm = DEFAULT_RADIUS_KM,
  session,
  history,
}) => {
  const requestedMode = inferMode(message, mode);
  const origin = await resolveOrigin({ location, manualLocation });
  const { localDate, localTime } = getLocalClock(timezone);
  const nearbyPlaces = await placeService.findNearbyPlaces({
    origin,
    searchText: message,
    radiusKm,
    limit: MAX_CANDIDATES,
  });
  if (nearbyPlaces.length === 0) {
    const error = new Error("No nearby attractions were found");
    error.statusCode = 404;
    throw error;
  }

  const candidates = await attachOriginTravelTimes(origin, nearbyPlaces);
  const trip = session.trip_id
    ? {
        title: session.trip_title,
        destination: session.destination,
        start_date: session.start_date,
        end_date: session.end_date,
        total_budget: session.total_budget,
        currency: session.currency,
        num_of_people: session.num_of_people,
      }
    : null;

  let recommendation;
  try {
    recommendation = await aiService.generateRecommendations({
      message,
      requestedMode,
      candidates,
      history,
      trip,
      localDate,
      localTime,
      timezone: timezone || "UTC",
      planningWindowHours: DEFAULT_PLANNING_WINDOW_HOURS,
    });
  } catch (error) {
    console.error("AI recommendation failed:", error);
    if (requestedMode === "discover") {
      const fallback = buildDiscoveryFallback({ candidates, trip });
      fallback.radiusKm = radiusKm;
      return fallback;
    }
    error.statusCode = error.code === "AI_NOT_CONFIGURED" ? 503 : 502;
    throw error;
  }

  const response = await hydrateRecommendation({
    recommendation,
    candidates,
    origin,
    trip,
    localDate,
    requestedMode,
  });
  response.radiusKm = radiusKm;
  return response;
};

module.exports = {
  generateChatResponse,
  inferMode,
  validateCoordinates,
  getLocalClock,
  normalizePrice,
};
