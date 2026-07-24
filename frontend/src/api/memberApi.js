import {getAuthHeaders} from "./authenticationHeader";

const API_URL = "http://localhost:5000/api";

export const getMembersByTripId = async (tripId) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/members`, {headers: getAuthHeaders(),});
  if (!response.ok) throw new Error("Failed to fetch members");
  return response.json();
};

export const createMember = async (tripId, memberData) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/members`, {
    method: "POST", headers: getAuthHeaders(), body: JSON.stringify(memberData),
  });
  if (!response.ok) throw new Error("Failed to create member");
  return response.json();
};

export const deleteMember = async (memberId) => {
  const response = await fetch(`${API_URL}/members/${memberId}`, {
    method: "DELETE", headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete member");
  return response.json();
};