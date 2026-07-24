import {getAuthHeaders} from "./authenticationHeader";

const API_URL = "http://localhost:5000/api";

export const getItineraryByTripId = async (tripId) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/itinerary`, {headers: getAuthHeaders(),});
  if (!response.ok) throw new Error("Failed to fetch itineraries");
  return response.json();
};

export const createItinerary = async (tripId, itineraryData) =>{
  const response = await fetch (`${API_URL}/trips/${tripId}/itinerary`, {
    method: "POST", headers: getAuthHeaders(), body: JSON.stringify(itineraryData),
  });
  if (!response.ok) throw new Error("Failed to create new itinerary");
  return response.json();
};

export const updateItinerary = async (id, itineraryData) => {
  const response = await fetch (`${API_URL}/itinerary/${id}`, {
    method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(itineraryData),
  });
  if (!response.ok) throw new Error("Failed to update itinerary");
  return response.json();
};

export const deleteItinerary = async (id) => {
  const response = await fetch (`${API_URL}/itinerary/${id}`, {method: "DELETE", headers: getAuthHeaders()})
  if (!response.ok) throw new Error("Failed to delete itinerary");
  return response.json();
};