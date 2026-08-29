import {getAuthHeaders} from "./authenticationHeader";
import { API_BASE_URL } from "./config";
import { readJsonResponse } from "./response";

const API_URL = API_BASE_URL;

export const getItineraryByTripId = async (tripId) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/itinerary`, {headers: getAuthHeaders(),});
  return readJsonResponse(response, "Failed to fetch itineraries");
};

export const createItinerary = async (tripId, itineraryData) =>{
  const response = await fetch (`${API_URL}/trips/${tripId}/itinerary`, {
    method: "POST", headers: getAuthHeaders(), body: JSON.stringify(itineraryData),
  });
  return readJsonResponse(response, "Failed to create new itinerary");
};

export const createItineraryBatch = async (tripId, items) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/itinerary/batch`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ items }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to add recommendations to itinerary");
  }
  return data;
};

export const updateItinerary = async (id, itineraryData) => {
  const response = await fetch (`${API_URL}/itinerary/${id}`, {
    method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(itineraryData),
  });
  return readJsonResponse(response, "Failed to update itinerary");
};

export const deleteItinerary = async (id) => {
  const response = await fetch (`${API_URL}/itinerary/${id}`, {method: "DELETE", headers: getAuthHeaders()})
  return readJsonResponse(response, "Failed to delete itinerary");
};
