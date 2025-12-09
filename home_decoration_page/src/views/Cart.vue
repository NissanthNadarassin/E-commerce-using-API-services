<template>
  <div class="cart_container">
    <h2>{{ cart_products.length === 0 ? 'Your cart is empty' : 'This is your cart' }}</h2>
    <ul>
      <li class="car_product_container" v-for="item in cart_products" :key="item.id">
        <Cart_product 
          :product="item" 
          @update-cart="() => add_product_to_cart(item)"
          @reduce_cart="()=> remove_one_unit_cart_product(item)"
          @remove-product="remove_cart_product(item)"
          @product-clicked="viewProduct" 
        />
      </li>
    </ul>
    
    <div class="checkout-section" v-if="cart_products.length !== 0">
      <div class="address-selection">
        <h3>Delivery Address</h3>
        
        <div v-if="!showAddAddress && addresses.length > 0">
          <select v-model="selectedAddressId" class="address-select">
            <option :value="null" disabled>Select an address</option>
            <option v-for="addr in addresses" :key="addr.id" :value="addr.id">
              {{ addr.label }} - {{ addr.address_line1 }}, {{ addr.city }}
            </option>
          </select>
          <button @click="showAddAddress = true" class="secondary-btn">Add New Address</button>
        </div>

        <div v-if="showAddAddress || addresses.length === 0" class="new-address-form">
          <h4>Add New Address</h4>
          <input v-model="newAddress.label" placeholder="Label (e.g. Home, Work)" />
          <input v-model="newAddress.address_line1" placeholder="Address Line 1" />
          <input v-model="newAddress.city" placeholder="City" />
          <input v-model="newAddress.postal_code" placeholder="Postal Code" />
          <input v-model="newAddress.country" placeholder="Country" />
          <input v-model="newAddress.phone" placeholder="Phone" />
          
          <div class="form-actions">
             <button @click="saveNewAddress" class="primary-btn">Save Address</button>
             <button v-if="addresses.length > 0" @click="showAddAddress = false" class="text-btn">Cancel</button>
          </div>
        </div>
      </div>

      <div class="total">
        <p>Total to pay : {{ totalPrice }}$ ({{number_Cart_Items}} {{ number_Cart_Items === 1 ? 'product' : 'products' }})</p>
        <button @click="createOrder" class="checkout-btn" :disabled="!selectedAddressId">Place Order</button>
      </div>
    </div>
  </div>
</template>

<script>
import Cart_product from '../components/Cart_product.vue';
import apiService from '../services/apiService';

export default {
  props: {
    cart_products: Array,
    add_product_to_cart: Function,
    remove_one_unit_cart_product: Function,
    remove_cart_product: Function,
    totalPrice: Number,
    number_Cart_Items: Number,
  },
  components: {
    Cart_product
  },
  data() {
    return {
      addresses: [],
      selectedAddressId: null,
      showAddAddress: false,
      newAddress: {
        label: "Home",
        address_line1: "",
        city: "",
        postal_code: "",
        country: "",
        phone: ""
      }
    };
  },
  async mounted() {
    await this.fetchAddresses();
  },
  methods: {
    viewProduct(id) {
      this.$router.push(`/product/${id}`);
    },

    async fetchAddresses() {
      try {
        const token = localStorage.getItem('user');
        if (!token) return; 
        const response = await apiService.get('/api/users/addresses');
        this.addresses = response.data;
        if (this.addresses.length > 0) {
          // Auto-select default shipping or first one
          const defaultAddr = this.addresses.find(a => a.is_default_shipping);
          this.selectedAddressId = defaultAddr ? defaultAddr.id : this.addresses[0].id;
        } else {
          this.showAddAddress = true;
        }
      } catch (error) {
        console.error("Error fetching addresses", error);
      }
    },

    async saveNewAddress() {
      try {
        if (!this.newAddress.address_line1 || !this.newAddress.city) {
          alert("Please fill in required fields");
          return;
        }
        await apiService.post('/api/users/addresses', {
          ...this.newAddress,
          is_default_shipping: this.addresses.length === 0
        });
        await this.fetchAddresses();
        this.showAddAddress = false;
        // Reset form
        this.newAddress = { label: "Home", address_line1: "", city: "", postal_code: "", country: "", phone: "" };
      } catch (error) {
        alert("Failed to save address");
      }
    },
    
    async createOrder() {
      try {
        const token = localStorage.getItem('user');
        if (!token) {
          alert('Please login to create an order');
          this.$router.push('/login');
          return;
        }

        if (!this.selectedAddressId) {
          alert("Please select a delivery address.");
          return;
        }

        const items = this.cart_products.map(product => ({
          productId: product.id,
          quantity: product.quantity_cart || 1,
        }));

        const response = await apiService.post('/api/orders', {
          items,
          shippingAddressId: this.selectedAddressId
        });

        alert(`Order created successfully! Order ID: ${response.data.orderId}`);
        
        const productsToRemove = [...this.cart_products];
        productsToRemove.forEach(product => {
          this.remove_cart_product(product);
        });
        
        // Navigate to orders/tracking
        this.$router.push('/profile');
      } catch (error) {
        console.error('Error creating order:', error);
        alert(error.response?.data?.message || 'Failed to create order');
      }
    },
  },
};
</script>

<style scoped>
  .cart_container{
    width: 100%;
    min-height: 300px;
    height: auto;
    background-color: #EAEDED;
    padding-bottom: 20px;
    font-family: 'Inter', sans-serif;
  }
  .cart_container h2{
    text-align: center;
    padding: 20px;
  }

  .cart_container ul{
    width: 80%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: white;
    margin: 0 auto;
    border-radius: 20px 20px 0 0 ;
    list-style: none;
    padding: 0;
  }

  .checkout-section {
    width: 80%;
    margin: 0 auto;
    background-color: white;
    border-radius: 0 0 20px 20px;
    padding: 20px;
    border-top: 1px solid #eee;
  }

  .address-selection {
    margin-bottom: 20px;
  }

  .address-select {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }

  .new-address-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #f9f9f9;
    padding: 15px;
    border-radius: 8px;
  }

  .new-address-form input {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .form-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .total{
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: larger;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px solid #eee;
  }

  .car_product_container{
    width: 100%;
    height: auto;
  }
  
  .checkout-btn {
    margin-top: 15px;
    padding: 15px 40px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .checkout-btn:hover {
    background-color: #45a049;
  }

  .checkout-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .primary-btn {
    padding: 8px 16px;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .secondary-btn {
    padding: 8px 16px;
    background: #95a5a6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .text-btn {
    background: none;
    border: none;
    color: #e74c3c;
    cursor: pointer;
    text-decoration: underline;
  }
</style>