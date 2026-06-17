const API_URL = "http://localhost:5000/api";

export const getExpensesByTripId = async (tripId) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/expenses`);
  if (!response.ok) throw new Error("Failed to fetch expenses");
  return response.json();
};

export const createExpense = async (tripId, expenseData) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/expenses`, {
    method: "POST", headers: {"Content-Type": "application/json",}, body: JSON.stringify(expenseData),
  });
  if (!response.ok) throw new Error("Failed to create expense");
  return response.json();
};

export const updateExpense = async (expenseId, expenseData) => {
  const response = await fetch(`${API_URL}/expenses/${expenseId}`, {
    method: "PUT", headers: {"Content-Type": "application/json",}, body: JSON.stringify(expenseData),
  });
  if (!response.ok) throw new Error("Failed to update expense");
  return response.json();
}

export const deleteExpense = async (expenseId) => {
  const response = await fetch(`${API_URL}/expenses/${expenseId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete expense");
  return response.json();
}