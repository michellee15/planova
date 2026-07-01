const API_URL = "http://localhost:5000/api";

export const getSettlementByTripId = async (tripId) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/settlements`);
  if (!response.ok) throw new Error("Failed to fetch settlements");
  return response.json();
};

export const createSettlement = async (tripId, settlementData) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/settlements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    }, body: JSON.stringify(settlementData),
  });
  if (!response.ok) throw new Error("Failed to create settlement");
  return response.json();
};
