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

// Helper for GraphQL queries
apiClient.graphQL = async (query, variables = {}) => {
  const response = await apiClient.post('/graphql', {
    query,
    variables
  });
  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }
  return response.data.data;
};

export default apiClient;
