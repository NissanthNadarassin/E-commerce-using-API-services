import apiClient from "./apiService";

const API_URL = "/api/products"; // Base URL is already defined in apiClient

// Fetch all products (Public)
const getAllProducts = async () => {
  try {
    const response = await apiClient.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

// Fetch a product by ID (Public)
const getProductById = async (id) => {
  try {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching product details:", error);
    throw error;
  }
};

// Create a new product (Admin Only)
const createProduct = async (product) => {
  try {
    console.log("Sending product data:", product); // Debugging log
    const response = await apiClient.post(API_URL, product);
    return response.data;
  } catch (error) {
    console.error("Error creating product:", error.response?.data || error.message);
    throw error;
  }
};

// Update a product by ID (Admin Only)
const updateProduct = async (id, product) => {
  try {
    const response = await apiClient.put(`${API_URL}/${id}`, product);
    return response.data;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

// Delete a product by ID (Admin Only)
const deleteProduct = async (id) => {
  try {
    const response = await apiClient.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

// Delete all products (Admin Only)
const deleteAllProducts = async () => {
  try {
    const response = await apiClient.delete(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error deleting all products:", error);
    throw error;
  }
};

// Add a rating to a product (Public)
const addRating = async (id, rating) => {
  try {
    const response = await apiClient.post(`${API_URL}/${id}/rating`, { rating });
    return response.data;
  } catch (error) {
    console.error("Error submitting rating:", error);
    throw error;
  }
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteAllProducts,
  addRating,
};
