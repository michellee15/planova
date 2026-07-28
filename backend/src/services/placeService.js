const { fetchWithTimeout } = require("./httpService");

const OVERPASS_BASE_URL =
  process.env.OVERPASS_BASE_URL || "https://overpass-api.de/api/interpreter";
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const cache = new Map();

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const getStraightLineDistanceKm = (origin, destination) => {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const getElementCoordinates = (element) => {
  const latitude = Number(element.lat ?? element.center?.lat);
  const longitude = Number(element.lon ?? element.center?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
};

const getCategory = (tags) => {
  const category =
    tags.tourism || tags.historic || tags.leisure || tags.amenity || "attraction";
  return category.replaceAll("_", " ");
};

const getAddress = (tags) => {
  if (tags["addr:full"]) return tags["addr:full"];
  return [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:country"],
  ]
    .filter(Boolean)
    .join(", ") || null;
};

const parseTicketPrice = (tags) => {
  const rawValue = tags.charge || tags["charge:admission"] || null;
  if (!rawValue) return null;

  const match = String(rawValue).match(
    /(?:([A-Z]{3})\s*)?(\d+(?:[.,]\d{1,2})?)(?:\s*([A-Z]{3}|[$€£¥]))?/i
  );
  if (!match) return { raw: String(rawValue), source: "openstreetmap" };

  const symbolCurrencies = {
    $: "USD",
    "€": "EUR",
    "£": "GBP",
    "¥": "JPY",
  };
  const trailingCurrency = match[3]
    ? symbolCurrencies[match[3]] || match[3].toUpperCase()
    : null;

  return {
    amount: Number(match[2].replace(",", ".")),
    currency: match[1]?.toUpperCase() || trailingCurrency,
    raw: String(rawValue),
    source: "openstreetmap",
  };
};

const normalizePlace = (element, origin) => {
  const coordinates = getElementCoordinates(element);
  const tags = element.tags || {};
  if (!coordinates || !tags.name) return null;

  return {
    placeId: `${element.type}/${element.id}`,
    name: tags.name,
    category: getCategory(tags),
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    address: getAddress(tags),
    openingHours: tags.opening_hours || null,
    website: tags.website || tags["contact:website"] || null,
    phone: tags.phone || tags["contact:phone"] || null,
    fee: tags.fee || null,
    ticketPrice: parseTicketPrice(tags),
    wheelchair: tags.wheelchair || null,
    distanceStraightLineKm:
      Math.round(getStraightLineDistanceKm(origin, coordinates) * 10) / 10,
    source: "openstreetmap",
  };
};

const buildOverpassQuery = ({ latitude, longitude, radiusMeters }) => `
[out:json][timeout:20];
(
  nwr(around:${radiusMeters},${latitude},${longitude})["tourism"~"^(attraction|museum|gallery|theme_park|zoo|viewpoint|aquarium)$"];
  nwr(around:${radiusMeters},${latitude},${longitude})["historic"];
  nwr(around:${radiusMeters},${latitude},${longitude})["leisure"~"^(park|nature_reserve|water_park)$"];
  nwr(around:${radiusMeters},${latitude},${longitude})["amenity"~"^(arts_centre|theatre)$"];
);
out center tags;
`;

const getCacheKey = ({ latitude, longitude, radiusKm }) =>
  `${latitude.toFixed(3)}:${longitude.toFixed(3)}:${radiusKm}`;

const readCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt >= CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const writeCache = (key, value) => {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { createdAt: Date.now(), value });
};

const findNearbyPlaces = async ({ origin, radiusKm = 5, limit = 20 }) => {
  const cacheKey = getCacheKey({
    latitude: origin.latitude,
    longitude: origin.longitude,
    radiusKm,
  });
  const cached = readCache(cacheKey);
  if (cached) return cached.slice(0, limit);

  const query = buildOverpassQuery({
    latitude: origin.latitude,
    longitude: origin.longitude,
    radiusMeters: Math.round(radiusKm * 1000),
  });
  const response = await fetchWithTimeout(OVERPASS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Planova/1.0 student-project",
    },
    body: new URLSearchParams({ data: query }).toString(),
  }, 25000);

  if (!response.ok) {
    throw new Error(`Nearby place service returned status ${response.status}`);
  }

  const data = await response.json();
  const places = (data.elements || [])
    .map((element) => normalizePlace(element, origin))
    .filter(Boolean)
    .sort((first, second) => first.distanceStraightLineKm - second.distanceStraightLineKm);

  const uniquePlaces = Array.from(
    new Map(places.map((place) => [place.name.toLowerCase(), place])).values()
  ).slice(0, 50);
  writeCache(cacheKey, uniquePlaces);
  return uniquePlaces.slice(0, limit);
};

module.exports = {
  findNearbyPlaces,
  getStraightLineDistanceKm,
  normalizePlace,
  parseTicketPrice,
};
