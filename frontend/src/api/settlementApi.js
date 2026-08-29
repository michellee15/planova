import {getAuthHeaders} from "./authenticationHeader";
import { API_BASE_URL } from "./config";

const API_URL = API_BASE_URL;

export const getSettlementByTripId = async (tripId) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/settlements`, {headers: getAuthHeaders(),});
  if (!response.ok) throw new Error("Failed to fetch settlements");
  return response.json();
};

export const createSettlement = async (tripId, settlementData) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/settlements`, {
    method: "POST",
    headers: getAuthHeaders(), 
    body: JSON.stringify(settlementData),
  });
  if (!response.ok) throw new Error("Failed to create settlement");
  return response.json();
};

export const deleteSettlement = async (id) => {
  const response = await fetch(`${API_URL}/settlements/${id}`, {
    method: "DELETE", headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete settlement");
  return response.json();
};
