import {getAuthHeaders} from "./authenticationHeader";
import { API_BASE_URL } from "./config";
import { readJsonResponse } from "./response";
const API_URL = API_BASE_URL;

export const getExpensesByTripId = async (tripId) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/expenses`, {headers: getAuthHeaders(),});
  return readJsonResponse(response, "Failed to fetch expenses");
};

export const createExpense = async (tripId, expenseData) => {
  const response = await fetch(`${API_URL}/trips/${tripId}/expenses`, {
    method: "POST", headers: getAuthHeaders(), body: JSON.stringify(expenseData),
  });
  return readJsonResponse(response, "Failed to create expense");
};

export const updateExpense = async (expenseId, expenseData) => {
  const response = await fetch(`${API_URL}/expenses/${expenseId}`, {
    method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(expenseData),
  });
  return readJsonResponse(response, "Failed to update expense");
}

export const deleteExpense = async (expenseId) => {
  const response = await fetch(`${API_URL}/expenses/${expenseId}`, {
    method: "DELETE", headers: getAuthHeaders(),
  });
  return readJsonResponse(response, "Failed to delete expense");
};
