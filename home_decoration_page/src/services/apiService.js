import axios from "axios";

// Create an Axios instance with a base URL
const apiClient = axios.create({
  baseURL: "http://localhost:5002", // Backend API port
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("user"); // Get token from localStorage
    if (token) {
      config.headers["x-access-token"] = token; // Attach token to headers
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
