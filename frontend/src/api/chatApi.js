import { getAuthHeaders } from "./authenticationHeader";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/chat`;

const readResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || fallbackMessage);
    error.status = response.status;
    error.retryAfter = response.headers.get("Retry-After");
    throw error;
  }

  return data;
};

export const getChatSessions = async () => {
  const response = await fetch(`${API_URL}/sessions`, {
    headers: getAuthHeaders(),
  });
  return readResponse(response, "Failed to load conversations");
};

export const createChatSession = async ({ tripId, title } = {}) => {
  const response = await fetch(`${API_URL}/sessions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      trip_id: tripId || null,
      ...(title ? { title } : {}),
    }),
  });
  return readResponse(response, "Failed to start a conversation");
};

export const getChatMessages = async (sessionId) => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/messages`, {
    headers: getAuthHeaders(),
  });
  return readResponse(response, "Failed to load conversation");
};

export const sendChatMessage = async (sessionId, messageData) => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(messageData),
  });
  return readResponse(response, "Failed to generate recommendations");
};

export const deleteChatSession = async (sessionId) => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return readResponse(response, "Failed to delete conversation");
};
