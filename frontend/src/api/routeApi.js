import {getAuthHeaders} from "./authenticationHeader";
const API_URL = "http://localhost:5000/api";

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