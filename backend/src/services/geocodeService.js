// this code is guided by ChatGPT 
// to convert normal text/string location that user typed in to real address in map
const { fetchWithTimeout } = require("./httpService");

const geocodeLocation = async (location) => { 
  if (!location) return null;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.append("q", location);
  url.searchParams.append("format", "json"); 
  url.searchParams.append("limit", 1); //limit the result to only 1 
  const response = await fetchWithTimeout(url.toString(), {
    headers: {
      "User-Agent": "Planova/1.0 student-project", //to send the request to external API
    },
  }, 10000);

  if (!response.ok) throw new Error("Failed to geocode location");
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const place = data[0]; //since we set search result to 1
  return {
    latitude: Number(place.lat),
    longitude: Number(place.lon),
    formatted_address: place.display_name,
    place_id: String(place.place_id),
  };
};

module.exports = {
  geocodeLocation,
};
