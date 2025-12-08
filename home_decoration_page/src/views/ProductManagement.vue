<template>
  <div class="product-management">
    <h1>Product Management</h1>
    <div class="Form_div">
      <form @submit.prevent="createProduct">
        <label for="product_name">Product Name</label>
        <input
          type="text"
          id="product_name"
          v-model="newProduct.product_name"
          placeholder="Product Name"
          required
        />

        <label for="description">Product Description</label>
        <textarea
          id="description"
          v-model="newProduct.description"
          placeholder="Product Description"
          required
        ></textarea>

        <label for="img">Product Image URL</label>
        <input
          type="text"
          id="img"
          v-model="newProduct.img"
          placeholder="Product Image URL"
        />

        <label for="price">Price</label>
        <input
          type="number"
          id="price"
          v-model="newProduct.price"
          placeholder="Price"
          step="0.01"
          min="0"
        />

        <label>Warehouse Distribution</label>
        <div class="warehouse-distribution">
          <table class="warehouse-table">
            <thead>
              <tr>
                <th>Warehouse</th>
                <th>City</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="warehouse in warehouses" :key="warehouse.id">
                <td>{{ warehouse.name }}</td>
                <td>{{ warehouse.city }}</td>
                <td>
                  <input
                    type="number"
                    v-model.number="warehouseDistribution[warehouse.id]"
                    min="0"
                    placeholder="0"
                    class="quantity-input"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div class="total-quantity">
            <strong>Total Quantity: {{ totalQuantity }}</strong>
          </div>
        </div>

        <label for="category">Category</label>
        <select v-model="newProduct.category" id="category" required>
          <option value="" disabled>Select Category</option>
          <option value="Beds">Beds</option>
          <option value="Storage">Storage</option>
          <option value="Furniture">Furniture</option>
          <option value="Decoration">Decoration</option>
          placeholder="Category"
        </select>

        <div class="button_box">
          <button type="submit">Add Product</button>
          <button
           
            @click.prevent="deleteAllProducts"
            class="delete-all-button"
          >
            Delete All Products
          </button>
        </div>
      </form>
    </div>

    <div class="list_of_products">
      <h2>Existing Products</h2>
      <hr />
      <ul class="product_container">
        <li
          v-for="product in products"
          :key="product.id"
          class="single_product"
        >
          <img :src="product.img" alt="Product Image" /> <br />
          <div class="single_product_details">
            <p><strong>ID:</strong> {{ product.id }}</p>
            <p><strong>Product Name:</strong> {{ product.product_name }}</p>
            <p><strong>Description:</strong> {{ product.description }}</p>
            <p><strong>Price:</strong> ${{ product.price }}</p>
            <p><strong>Category:</strong> {{ product.category }}</p>
            <p><strong>Total Quantity:</strong> {{ product.quantity_available || 0 }}</p>
          </div>

          <div class="single_product_buttons_box" >
            <button @click="viewInventory(product.id)" class="view-inventory-btn">View Inventory</button>
            <button @click="deleteProduct(product.id)">Delete</button>
            <button @click="editProduct(product)">Edit</button>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="editingProduct" class="edit_product">
      <h3>Edit Product</h3>
      <hr />
      <form @submit.prevent="updateProduct">
        <label for="edit_product_name">Product Name</label>
        <input
          type="text"
          id="edit_product_name"
          v-model="editingProduct.product_name"
          placeholder="Product Name"
          required
        />

        <label for="edit_description">Product Description</label>
        <textarea
          id="edit_description"
          v-model="editingProduct.description"
          placeholder="Product Description"
          required
        ></textarea>

        <label for="edit_img">Product Image URL</label>
        <input
          type="text"
          id="edit_img"
          v-model="editingProduct.img"
          placeholder="Product Image URL"
        />

        <label for="edit_price">Price</label>
        <input
          type="number"
          id="edit_price"
          v-model="editingProduct.price"
          placeholder="Price"
          step="0.01"
          min="0"
        />

        <label for="edit_category">Category</label>
        <select v-model="editingProduct.category" id="edit_category" required>
          <option value="Beds">Beds</option>
          <option value="Storage">Storage</option>
          <option value="Furniture">Furniture</option>
          <option value="Decoration">Decoration</option>
          placeholder="Category"
        </select>

        <button type="submit">Update Product</button>
      </form>
    </div>

    <!-- Inventory Detail Modal -->
    <div v-if="showInventoryModal" class="inventory-modal" @click.self="closeInventoryModal">
      <div class="inventory-modal-content">
        <div class="modal-header">
          <h2>Warehouse Inventory</h2>
          <button @click="closeInventoryModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <h3>{{ selectedProductName }}</h3>
          <table class="inventory-detail-table">
            <thead>
              <tr>
                <th>Warehouse</th>
                <th>City</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in selectedProductInventory" :key="inv.warehouseId">
                <td>{{ inv.warehouseName }}</td>
                <td>{{ inv.city }}</td>
                <td><strong>{{ inv.quantity }}</strong></td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2"><strong>Total</strong></td>
                <td><strong>{{ totalInventory }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProductService from "../services/ProductService";

export default {
  name: "ProductManagement",
  computed: {
    totalQuantity() {
      return Object.values(this.warehouseDistribution).reduce((sum, qty) => sum + (qty || 0), 0);
    },
    totalInventory() {
      return this.selectedProductInventory.reduce((sum, inv) => sum + inv.quantity, 0);
    }
  },
  data() {
    return {
      products: [],
      newProduct: {
        product_name: "",
        description: "",
        img: "",
        price: null,
        category: "",
      },
      warehouseDistribution: {},
      editingProduct: null,
      showInventoryModal: false,
      selectedProductInventory: [],
      selectedProductName: '',
      isAdmin: false,
      warehouses: [],
    };
  },
  methods: {
    async fetchProducts() {
      try {
        this.products = await ProductService.getAllProducts();
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    },
    async fetchWarehouses() {
      try {
        const token = localStorage.getItem('user');
        if (!token) {
          console.error("No authentication token found");
          return;
        }
        
        const response = await fetch('http://localhost:5002/api/warehouses', {
          headers: {
            'x-access-token': token
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.error("Error response:", error);
          return;
        }
        
        this.warehouses = await response.json();
        console.log("Warehouses loaded:", this.warehouses);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      }
    },
    async createProduct() {
      try {
        console.log("warehouseDistribution:", this.warehouseDistribution);
        
        // Filter out warehouses with 0 or no quantity
        const distributions = Object.entries(this.warehouseDistribution)
          .filter(([_, qty]) => qty > 0)
          .map(([warehouseId, quantity]) => ({
            warehouseId: parseInt(warehouseId),
            quantity
          }));
        
        console.log("distributions:", distributions);
        
        if (distributions.length === 0) {
          alert('Please add quantity to at least one warehouse');
          return;
        }
        
        const productData = {
          ...this.newProduct,
          distributions
        };
        
        console.log("Sending product data:", productData);
        
        const result = await ProductService.createProduct(productData);
        console.log("Product created successfully:", result);
        
        alert('Product created successfully!');
        this.resetForm();
        this.fetchProducts();
      } catch (error) {
        console.error("Error creating product:", error);
        console.error("Error details:", error.response?.data || error.message);
        alert('Error creating product: ' + (error.response?.data?.message || error.message));
      }
    },
    async deleteProduct(id) {
      try {
        await ProductService.deleteProduct(id);
        this.fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error.response?.data || error.message);
      }
    },
    async deleteAllProducts() {
      try {
        await ProductService.deleteAllProducts();
        this.fetchProducts();
      } catch (error) {
        console.error("Error deleting all products:", error.response?.data || error.message);
      }
    },
    editProduct(product) {
      this.editingProduct = { ...product };
    },
    async updateProduct() {
      try {
        await ProductService.updateProduct(this.editingProduct.id, this.editingProduct);
        this.editingProduct = null;
        this.fetchProducts();
      } catch (error) {
        console.error("Error updating product:", error.response?.data || error.message);
      }
    },
    async viewInventory(productId) {
      try {
        const token = localStorage.getItem('user');
        const response = await fetch(`http://localhost:5002/api/inventory/product/${productId}`, {
          headers: {
            'x-access-token': token
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch inventory');
        }
        
        const data = await response.json();
        const product = this.products.find(p => p.id === productId);
        
        this.selectedProductName = product?.product_name || 'Product';
        this.selectedProductInventory = data.map(inv => ({
          warehouseId: inv.warehouseId,
          warehouseName: inv.warehouse?.name || 'Unknown',
          city: inv.warehouse?.city || 'Unknown',
          quantity: inv.quantity_available
        }));
        
        this.showInventoryModal = true;
      } catch (error) {
        console.error('Error fetching inventory:', error);
        alert('Failed to load inventory details');
      }
    },
    closeInventoryModal() {
      this.showInventoryModal = false;
      this.selectedProductInventory = [];
      this.selectedProductName = '';
    },
    resetForm() {
      this.newProduct = {
        product_name: "",
        description: "",
        img: "",
        price: null,
        category: "",
      };
      this.warehouseDistribution = {};
    },
  },
  mounted() {
    this.fetchProducts();
    this.fetchWarehouses();
    const role = localStorage.getItem("role");
    this.isAdmin = role === "admin";
  },
};
</script>



<style scoped>
  .product-management{
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .product-management h1{
    margin: 20px;
  }
  .Form_div{
    padding: 30px;
    background-color: #243E36;
    width: 60%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-radius: 30px;
  }
  form{
    display: flex;
    flex-direction: column;
    gap:10px;
    width: 100%;
  }

  form label{
    color: white;
    font-weight: bold;
    font-size: large;
  }
  form input,form textarea{
    height: 30px;
    padding-left: 8px;
    border-radius: 5px;
    border: none;
    outline: none; 
  }

  form textarea{
    padding-top: 6px;
    height: 60px;
  }
  .button_box{
    display: flex;
    justify-content: center;
    gap:20px;
  }

  .button_box button{
    margin-top: 10px;
    background-color: white;
    border: none;
    padding: 6px;
    border-radius: 10px;
    color: black;
    transition: background-color 0.3s ease-in-out;
  }

  .button_box button:hover{
    cursor: pointer;
    background-color: black;
    color: white;
  }

  .list_of_products{
    margin-top: 30px;
    margin-bottom: 30px;
    width: 80%;

  }
  .product_container{
    width: 100%;
  }
  
  
  .single_product{
    background-color: rgb(173, 173, 173);
    margin-top: 15px;
    padding: 15px;
    display: flex;
    border-radius: 10px;
    gap: 8px;
  }

  .single_product_details{
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 50%;
  }
  .single_product img{
    width: 200px;
    height: auto;
  }
  
  .single_product_buttons_box{
    width: 25%;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    background-color: #243E36;
    justify-content: center;
    gap: 20px;
    padding: 20px;
  }
  .single_product_buttons_box button{
    height: 40px;
    border: none;
    border-radius: 10px;
    padding: 5px;
    transition: background-color 0.3s ease-in-out;
  }

  .single_product_buttons_box button:hover{
    cursor: pointer;
    background-color: black;
    color: white;
  }

  .view-inventory-btn {
    background-color: #4299e1 !important;
    color: white !important;
  }

  .view-inventory-btn:hover {
    background-color: #2b6cb0 !important;
  }

  /* Inventory Modal Styles */
  .inventory-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .inventory-modal-content {
    background-color: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 30px;
    border-bottom: 2px solid #e2e8f0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px 12px 0 0;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 24px;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 32px;
    color: white;
    cursor: pointer;
    padding: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.3s;
  }

  .close-btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .modal-body {
    padding: 30px;
  }

  .modal-body h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #2d3748;
    font-size: 20px;
  }

  .inventory-detail-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
  }

  .inventory-detail-table thead {
    background-color: #4a5568;
    color: white;
  }

  .inventory-detail-table th,
  .inventory-detail-table td {
    padding: 14px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }

  .inventory-detail-table th {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 13px;
  }

  .inventory-detail-table tbody tr:hover {
    background-color: #f7fafc;
  }

  .inventory-detail-table tfoot {
    background-color: #edf2f7;
    font-size: 16px;
  }

  .total-row td {
    border-top: 2px solid #4a5568;
    padding-top: 16px;
    padding-bottom: 16px;
  }

  .edit_product {
  padding: 30px;
  background-color: grey;
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 30px;
  margin-top: 30px;
  color: white;
  margin-bottom: 30px;
}

.edit_product form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.edit_product label {
  color: white;
  font-weight: bold;
  font-size: large;
}

.edit_product input,
.edit_product textarea {
  height: 30px;
  padding-left: 8px;
  border-radius: 5px;
  border: none;
  outline: none;
}

.edit_product textarea {
  padding-top: 6px;
  height: 60px;
}

.warehouse-distribution {
  margin: 15px 0;
}

.warehouse-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
}

.warehouse-table thead {
  background-color: #4a5568;
  color: white;
}

.warehouse-table th,
.warehouse-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.warehouse-table th {
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
}

.warehouse-table tbody tr:hover {
  background-color: #f7fafc;
}

.quantity-input {
  width: 100px;
  padding: 8px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 14px;
}

.quantity-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.total-quantity {
  margin-top: 15px;
  padding: 12px;
  background-color: #edf2f7;
  border-radius: 6px;
  text-align: right;
  font-size: 16px;
  color: #2d3748;
}

.edit_product button {
  margin-top: 10px;
  background-color: white;
  border: none;
  padding: 8px;
  border-radius: 10px;
  color: black;
  transition: background-color 0.3s ease-in-out;
}

.edit_product button:hover {
  cursor: pointer;
  background-color: black;
  color: white;
}





  @media (max-width: 800px){
    .single_product{
      flex-direction: column;
    }
    .single_product_buttons_box{
      margin-top: 10px;
      width: 100%;
    }
    .single_product img{
      
      margin: 0 auto;
      text-align: center;
    }

  }
</style>