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

export default http;
