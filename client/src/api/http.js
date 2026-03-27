import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const http = axios.create({
  baseURL,
  timeout: 15000,
});

export const fetchProfileReport = async (username) => {
  const response = await http.get(`/profile/${username}`);
  return response.data;
};

export const fetchCompareReports = async (u1, u2) => {
  const response = await http.get(`/compare?u1=${u1}&u2=${u2}`);
  return response.data;
};

export default http;
