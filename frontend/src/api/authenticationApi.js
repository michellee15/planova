import axios from "axios";
import { getAuthHeaders } from "./authenticationHeader";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/auth`;
const USER_API_URL = `${API_BASE_URL}/users`;

export const registerUser = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await axios.post(`${API_URL}/verify-email`, { token });
  return response.data;
};

export const resendVerificationEmail = async (email) => {
  const response = await axios.post(`${API_URL}/resend-verification`, {
    email,
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axios.get(`${USER_API_URL}/me`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateCurrentUser = async (profileData) => {
  const response = await axios.patch(`${USER_API_URL}/me`, profileData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
