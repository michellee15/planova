// axios library act as bridge so that react frontend can send http req to backend api
import axios from "axios";

const API_URL = "http://localhost:5000/api/trips";

export const getTrips = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const getTripById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const createTrip = async (tripData) => {
  const response = await axios.post(API_URL, tripData);
  return response.data;
};

export const updateTrip = async (id, tripData) => {
  const response = await axios.put(`${API_URL}/${id}`, tripData);
  return response.data;
};

export const deleteTrip = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
}