const { fetchWithTimeout } = require("./httpService");

const OVERPASS_BASE_URL =
  process.env.OVERPASS_BASE_URL || "https://overpass-api.de/api/interpreter";
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const cache = new Map();

const SEARCH_GROUPS = {
  attractions: [
    `"tourism"~"^(attraction|museum|gallery|theme_park|zoo|viewpoint|aquarium)$"`,
    `"historic"`,
    `"leisure"~"^(park|garden|nature_reserve|water_park)$"`,
    `"amenity"~"^(arts_centre|theatre)$"`,
  ],
  food: [
    `"amenity"~"^(restaurant|cafe|fast_food|food_court|ice_cream|bar|pub|biergarten)$"`,
  ],
  groceries: [
    `"shop"~"^(supermarket|convenience|grocery|greengrocer|bakery|deli|butcher|seafood|organic|beverages)$"`,
    `"amenity"="marketplace"`,
  ],
  shopping: [
    `"shop"~"^(mall|department_store|general|clothes|shoes|books|electronics|gift|jewelry|sports|toys|beauty|furniture|hardware|chemist)$"`,
  ],
  nightlife: [
    `"amenity"~"^(nightclub|casino|bar|pub|biergarten)$"`,
  ],
  accommodation: [
    `"tourism"~"^(hotel|hostel|guest_house|motel|apartment|camp_site|caravan_site)$"`,
  ],
  nature: [
    `"leisure"~"^(park|garden|nature_reserve|playground|picnic_table)$"`,
    `"tourism"~"^(viewpoint|picnic_site)$"`,
    `"natural"~"^(beach|peak|spring)$"`,
  ],
  entertainment: [
    `"amenity"~"^(cinema|theatre|arts_centre|community_centre|events_venue)$"`,
    `"leisure"~"^(sports_centre|bowling_alley|escape_game|water_park|amusement_arcade|miniature_golf)$"`,
  ],
  health: [
    `"amenity"~"^(hospital|clinic|doctors|dentist|pharmacy|veterinary)$"`,
    `"healthcare"`,
  ],
  services: [
    `"amenity"~"^(bank|atm|post_office|police|library|toilets|car_rental|bureau_de_change|laundry)$"`,
  ],
  transport: [
    `"amenity"~"^(bus_station|taxi|car_rental|fuel|charging_station|bicycle_rental|ferry_terminal|parking)$"`,
    `"public_transport"~"^(station|stop_position|platform)$"`,
    `"railway"~"^(station|halt|tram_stop|subway_entrance)$"`,
  ],
  education: [
    `"amenity"~"^(school|college|university|kindergarten|language_school|library)$"`,
  ],
  worship: [
    `"amenity"="place_of_worship"`,
  ],
  fitness: [
    `"leisure"~"^(fitness_centre|sports_centre|swimming_pool|pitch|track|golf_course)$"`,
  ],
  personalCare: [
    `"shop"~"^(hairdresser|beauty|massage|optician)$"`,
  ],
};

const SEARCH_INTENTS = [
  {
    group: "food",
    pattern:
      /\b(food|eat|dining|restaurants?|cafes?|coffee|breakfast|brunch|lunch|dinner|supper|desserts?|baker(?:y|ies)|fast food|bars?|pubs?)\b/i,
  },
  {
    group: "groceries",
    pattern:
      /\b(grocer(?:y|ies)|supermarkets?|convenience stores?|markets?|fresh produce|butchers?|delis?)\b/i,
  },
  {
    group: "shopping",
    pattern:
      /\b(shops?|shopping|malls?|department stores?|retail|boutiques?|clothes|electronics|souvenirs?|gifts?)\b/i,
  },
  {
    group: "nightlife",
    pattern: /\b(nightlife|night club|nightclub|casino|cocktail|drinks?)\b/i,
  },
  {
    group: "accommodation",
    pattern: /\b(hotel|hostel|accommodation|lodging|motel|guest house|camping)\b/i,
  },
  {
    group: "nature",
    pattern:
      /\b(nature|park|garden|beach|hiking|viewpoint|scenic|outdoor|playground|picnic)\b/i,
  },
  {
    group: "entertainment",
    pattern:
      /\b(entertainment|cinema|movie|theatre|theater|bowling|escape room|event|amusement|activity)\b/i,
  },
  {
    group: "health",
    pattern:
      /\b(health|hospital|clinic|doctor|dentist|pharmacy|medical|veterinary|vet)\b/i,
  },
  {
    group: "services",
    pattern:
      /\b(bank|atm|cash|post office|police|toilet|restroom|currency exchange|laundry)\b/i,
  },
  {
    group: "transport",
    pattern:
      /\b(transport|bus|train|railway|subway|metro|tram|taxi|parking|fuel|charging station|car rental|bicycle rental|ferry)\b/i,
  },
  {
    group: "education",
    pattern:
      /\b(school|college|university|kindergarten|library|education|study)\b/i,
  },
  {
    group: "worship",
    pattern: /\b(church|mosque|temple|synagogue|worship|religious)\b/i,
  },
  {
    group: "fitness",
    pattern:
      /\b(gym|fitness|sports|swimming|golf|exercise|workout|stadium)\b/i,
  },
  {
    group: "personalCare",
    pattern: /\b(hairdresser|hair salon|beauty|massage|spa|optician)\b/i,
  },
  {
    group: "attractions",
    pattern:
      /\b(attractions?|sightseeing|museums?|galler(?:y|ies)|historic|landmarks?|zoos?|aquariums?|tourist)\b/i,
  },
];

const DEFAULT_SEARCH_GROUPS = [
  "attractions",
  "food",
  "groceries",
  "shopping",
  "nature",
  "entertainment",
];

const getSearchGroups = (searchText = "") => {
  const groups = SEARCH_INTENTS.filter(({ pattern }) => pattern.test(searchText)).map(
    ({ group }) => group
  );
  return groups.length > 0 ? [...new Set(groups)] : DEFAULT_SEARCH_GROUPS;
};

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
    tags.tourism ||
    tags.historic ||
    tags.leisure ||
    tags.amenity ||
    tags.shop ||
    tags.healthcare ||
    tags.public_transport ||
    tags.railway ||
    tags.natural ||
    "place";
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

const buildOverpassQuery = ({
  latitude,
  longitude,
  radiusMeters,
  searchGroups,
}) => {
  const filters = searchGroups.flatMap((group) => SEARCH_GROUPS[group] || []);
  const queries = filters
    .map(
      (filter) =>
        `  nwr(around:${radiusMeters},${latitude},${longitude})[${filter}]["name"];`
    )
    .join("\n");
  return `[out:json][timeout:20];
(
${queries}
);
out center tags 250;`;
};

const getCacheKey = ({ latitude, longitude, radiusKm, searchGroups }) =>
  `${latitude.toFixed(3)}:${longitude.toFixed(3)}:${radiusKm}:${searchGroups.join(
    ","
  )}`;

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

const selectDiversePlaces = (places, limit) => {
  const placesByCategory = new Map();
  for (const place of places) {
    const categoryPlaces = placesByCategory.get(place.category) || [];
    categoryPlaces.push(place);
    placesByCategory.set(place.category, categoryPlaces);
  }

  const selected = [];
  const categoryQueues = [...placesByCategory.values()];
  while (selected.length < limit && categoryQueues.some((queue) => queue.length)) {
    for (const queue of categoryQueues) {
      if (queue.length && selected.length < limit) selected.push(queue.shift());
    }
  }
  return selected;
};

const findNearbyPlaces = async ({
  origin,
  searchText = "",
  radiusKm = 5,
  limit = 20,
}) => {
  const searchGroups = getSearchGroups(searchText);
  const cacheKey = getCacheKey({
    latitude: origin.latitude,
    longitude: origin.longitude,
    radiusKm,
    searchGroups,
  });
  const cached = readCache(cacheKey);
  if (cached) return cached.slice(0, limit);

  const query = buildOverpassQuery({
    latitude: origin.latitude,
    longitude: origin.longitude,
    radiusMeters: Math.round(radiusKm * 1000),
    searchGroups,
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
  );
  const diversePlaces = selectDiversePlaces(uniquePlaces, 50);
  writeCache(cacheKey, diversePlaces);
  return diversePlaces.slice(0, limit);
};

module.exports = {
  findNearbyPlaces,
  buildOverpassQuery,
  getSearchGroups,
  getStraightLineDistanceKm,
  normalizePlace,
  parseTicketPrice,
  selectDiversePlaces,
};
