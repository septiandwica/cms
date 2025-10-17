import axios from "axios";
import { API_BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // enable sending cookies with requests
  headers: {
    "Content-Type": "application/json",
    Accept : "application/json",
  },
});

// Optional: Add a request interceptor to include auth token if needed
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add authorization headers here if needed
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        window.location.href = "/login";
      } else if (error.response.status >= 500) {
        console.error("Server error:", error.response.data.message || "Please try again later.");
      } else {
        console.error("Error response:", error.response.data.message || "An error occurred.");
      }
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout. Please try again.");
    } else {
      console.error("Network error:", error.message || "Could not connect to the server.");
    }

    // ⛔ JANGAN ubah error jadi string
    // ✅ Biarkan error asli tetap diteruskan agar catch bisa akses err.response.data.message
    return Promise.reject(error);
  }
);
export default axiosInstance;
