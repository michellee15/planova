import axios from "axios";
import { getAuthHeaders } from "./authenticationHeader";

const API_URL = "http://localhost:5000/api/auth";
const USER_API_URL = "http://localhost:5000/api/users";

export const registerUser = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  return response.data;
};

export const updateCurrentUser = async (profileData) => {
  const response = await axios.patch(`${USER_API_URL}/me`, profileData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
