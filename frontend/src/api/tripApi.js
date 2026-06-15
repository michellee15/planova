// axios library act as bridge so that react frontend can send http req to backend api
import axios from "axios";

const API_URL = "http://localhost:5000/api/trips";

export const getTrips = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createTrip = async (tripData) => {
  const response = await axios.post(API_URL, tripData);
  return response.data;
};