import {getAuthHeaders} from "./authenticationHeader";
import { API_BASE_URL } from "./config";
const API_URL = API_BASE_URL;

export const getTravelTimes = async ({origin, destination}) => {
  const response = await fetch(`${API_URL}/routes/travel-times`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      origin, destination,
    })
  });

  if (!response.ok) throw new Error("Failed to get travel times");
  return response.json();
}
