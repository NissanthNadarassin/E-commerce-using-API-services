import axios from "axios";

const API_URL = "http://localhost:5002/api/auth";

export default {
  // Get the current logged-in user
  getCurrentUser: async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const response = await axios.get(`${API_URL}/me`, {
        headers: { "x-access-token": token },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  },
};
