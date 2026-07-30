import { getAuthHeaders } from "./authenticationHeader";

const API_URL = "http://localhost:5000/api";

const readResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || fallbackMessage);
    error.status = response.status;
    throw error;
  }

  return data;
};

const request = async (path, options = {}, fallbackMessage) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: getAuthHeaders(),
  });
  return readResponse(response, fallbackMessage);
};

export const getPendingInvitations = () =>
  request("/invitations", {}, "Failed to load trip invitations");

export const acceptInvitation = (invitationId) =>
  request(
    `/invitations/${invitationId}/accept`,
    { method: "POST" },
    "Failed to accept the invitation",
  );

export const declineInvitation = (invitationId) =>
  request(
    `/invitations/${invitationId}/decline`,
    { method: "POST" },
    "Failed to decline the invitation",
  );

export const getTripCollaborators = (tripId) =>
  request(
    `/trips/${tripId}/collaborators`,
    {},
    "Failed to load collaborators",
  );

export const inviteTripCollaborator = (tripId, email) =>
  request(
    `/trips/${tripId}/invitations`,
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    "Failed to send the invitation",
  );

export const cancelTripInvitation = (tripId, invitationId) =>
  request(
    `/trips/${tripId}/invitations/${invitationId}`,
    { method: "DELETE" },
    "Failed to cancel the invitation",
  );

export const removeTripCollaborator = (tripId, userId) =>
  request(
    `/trips/${tripId}/collaborators/${userId}`,
    { method: "DELETE" },
    "Failed to remove the collaborator",
  );

export const leaveSharedTrip = (tripId) =>
  request(
    `/trips/${tripId}/collaborators/me`,
    { method: "DELETE" },
    "Failed to leave the trip",
  );
