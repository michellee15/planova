// axios library act as bridge so that react frontend can send http req to backend api
import axios from "axios";
import {getAuthHeaders} from "./authenticationHeader";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/trips`;

export const getTrips = async () => {
  const response = await axios.get(API_URL, {headers: getAuthHeaders(),});
  return response.data;
};

export const getTripById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`,  {headers: getAuthHeaders(),});
  return response.data;
};

export const createTrip = async (tripData) => {
  const response = await axios.post(API_URL, tripData, {headers: getAuthHeaders(),});
  return response.data;
};

export const updateTrip = async (id, tripData) => {
  const response = await axios.put(`${API_URL}/${id}`, tripData, {headers: getAuthHeaders(),});
  return response.data;
};

export const deleteTrip = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, {headers: getAuthHeaders(),});
  return response.data;
};
