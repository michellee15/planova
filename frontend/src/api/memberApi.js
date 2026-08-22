import {getAuthHeaders} from "./authenticationHeader";
import {readJsonResponse} from "./response";

const API_URL = "http://localhost:5000/api";

export const getMembersByTripId = async (tripId) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/members`, {headers: getAuthHeaders(),});
  return readJsonResponse(response, "Failed to fetch members");
};

export const createMember = async (tripId, memberData) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/members`, {
    method: "POST", headers: getAuthHeaders(), body: JSON.stringify(memberData),
  });
  return readJsonResponse(response, "Failed to create member");
};

export const deleteMember = async (memberId) => {
  const response = await fetch(`${API_URL}/members/${memberId}`, {
    method: "DELETE", headers: getAuthHeaders(),
  });
  return readJsonResponse(response, "Failed to delete member");
};
