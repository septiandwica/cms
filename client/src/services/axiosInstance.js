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
  (response) => {
    return response;
  },
  (error) => {
    // Check if the error has a response from the server
    if (error.response) {
      // Handle server-side errors
      if (error.response.status === 401) {
        // Redirect to login page on a 401 Unauthorized error
        window.location.href = "/login";
      } else if (error.response.status >= 500) { // Using >= 500 to catch all server errors
        console.error("Server error:", error.response.data.message || "Please try again later.");
      } else {
        // Log other server-side errors
        console.error("Error response:", error.response.data.message || "An error occurred.");
      }
    } else if (error.code === "ECONNABORTED") {
        // The request was canceled due to a timeout
        console.error("Request timeout. Please try again.");
    } else {
        // The request was made, but no response was received (e.g., network error)
        console.error("Network error:", error.message || "Could not connect to the server.");
    }

    // Always reject the promise with a meaningful error message
    return Promise.reject(
      error.response?.data?.message || error.message || "An unknown error occurred"
    );
  }
);

export default axiosInstance;
