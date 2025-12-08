import apiClient from "./apiService";

const API_URL = "/api/users"; // Base URL for user-related API endpoints

export default {
  // Get all users (Excludes admin users)
  getAllUsers: async () => {
    try {
      const response = await apiClient.get(API_URL);
      const users = response.data || [];
      console.log("Fetched users:", users); // Debugging log
      // Filter out admin users
      return users.filter(
        (user) => !user.roles.includes("admin") && user.username !== "testadmin"
      );
    } catch (error) {
      console.error("Error fetching users:", error.response?.data || error.message);
      throw error;
    }
  },

  // Block a user (Admin Only)
  blockUser: async (id) => {
    try {
      const response = await apiClient.put(`${API_URL}/block/${id}`);
      console.log(`User with ID ${id} blocked successfully.`); // Debugging log
      return response.data;
    } catch (error) {
      console.error(`Error blocking user with ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Unblock a user (Admin Only)
  unblockUser: async (id) => {
    try {
      const response = await apiClient.put(`${API_URL}/unblock/${id}`);
      console.log(`User with ID ${id} unblocked successfully.`); // Debugging log
      return response.data;
    } catch (error) {
      console.error(`Error unblocking user with ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Get a single user by ID
  getUserById: async (id) => {
    try {
      const response = await apiClient.get(`${API_URL}/${id}`);
      console.log(`Fetched user with ID ${id}:`, response.data); // Debugging log
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Delete a user by ID (Admin Only)
  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`${API_URL}/${id}`);
      console.log(`User with ID ${id} deleted successfully.`); // Debugging log
      return response.data;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },
};


