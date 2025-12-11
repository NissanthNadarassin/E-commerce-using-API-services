<template>
  <div class="checkout-container">
    <div class="steps-indicator">
      <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
        <div class="step-circle">1</div>
        <span>Address</span>
      </div>
      <div class="line"></div>
      <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
        <div class="step-circle">2</div>
        <span>Summary</span>
      </div>
      <div class="line"></div>
      <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
        <div class="step-circle">3</div>
        <span>Payment</span>
      </div>
      <div class="line"></div>
      <div class="step" :class="{ active: currentStep >= 4, completed: currentStep > 4 }">
        <div class="step-circle">4</div>
        <span>Done</span>
      </div>
    </div>

    <!-- Step 1: Address Selection -->
    <div v-if="currentStep === 1" class="step-content fade-in">
      <h2>Select Delivery Address</h2>
      
      <div v-if="loadingAddresses" class="loading">Loading addresses...</div>
      
      <div v-else class="address-selection">
        <div v-if="addresses.length > 0" class="saved-addresses">
          <div 
            v-for="addr in addresses" 
            :key="addr.id" 
            class="address-card" 
            :class="{ selected: selectedAddressId === addr.id }"
            @click="selectedAddressId = addr.id"
          >
            <strong>{{ addr.label }}</strong>
            <p>{{ addr.address_line1 }}</p>
            <p>{{ addr.city }}, {{ addr.postal_code }}</p>
            <p>{{ addr.country }}</p>
          </div>
        </div>
        
        <button @click="showAddAddress = true" class="secondary-btn magin-top">Add New Address</button>

        <div v-if="showAddAddress || addresses.length === 0" class="new-address-form">
          <h3>Add New Address</h3>
          <input v-model="newAddress.label" placeholder="Label (e.g. Home)" />
          <input v-model="newAddress.address_line1" placeholder="Address Line 1 *" />
          <input v-model="newAddress.city" placeholder="City *" />
          <input v-model="newAddress.postal_code" placeholder="Postal Code *" />
          <input v-model="newAddress.country" placeholder="Country *" />
          <input v-model="newAddress.phone" placeholder="Phone" />
          
          <div class="form-actions">
             <button @click="saveNewAddress" class="primary-btn">Save & Use</button>
             <button v-if="addresses.length > 0" @click="showAddAddress = false" class="text-btn">Cancel</button>
          </div>
        </div>
      </div>
      
      <div class="step-actions">
        <button @click="goBackToCart" class="secondary-btn">Back to Cart</button>
        <button @click="nextStep" class="primary-btn" :disabled="!selectedAddressId">Next: Summary</button>
      </div>
    </div>

    <!-- Step 2: Order Summary -->
    <div v-if="currentStep === 2" class="step-content fade-in">
      <h2>Order Summary</h2>
      
      <div class="summary-card">
        <ul class="summary-list">
          <li v-for="item in cart_products" :key="item.id" class="summary-item">
            <span class="item-name">{{ item.product_name }} (x{{ item.quantity_cart }})</span>
            <span class="item-price">{{ (item.price * item.quantity_cart).toFixed(2) }}€</span>
          </li>
        </ul>
        <div class="summary-total">
          <strong>Total to Pay:</strong>
          <span>{{ totalPrice.toFixed(2) }}€</span>
        </div>
        <div class="selected-address-summary" v-if="selectedAddress">
            <h4>Shipping to:</h4>
            <p>{{ selectedAddress.address_line1 }}, {{ selectedAddress.city }}</p>
        </div>
      </div>

      <div class="step-actions">
        <button @click="prevStep" class="secondary-btn">Back</button>
        <button @click="nextStep" class="primary-btn">Next: Payment</button>
      </div>
    </div>

    <!-- Step 3: Payment -->
    <div v-if="currentStep === 3" class="step-content fade-in">
      <h2>Payment Details</h2>
      
      <div class="payment-form">
        <div class="card-mock">
          <div class="form-group">
            <label>Card Number</label>
            <input type="text" v-model="payment.cardNumber" placeholder="0000 0000 0000 0000" maxlength="19" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Expiry Date</label>
              <input type="text" v-model="payment.expiry" placeholder="MM/YY" maxlength="5" />
            </div>
            <div class="form-group">
              <label>CVC</label>
              <input type="text" v-model="payment.cvc" placeholder="123" maxlength="3" />
            </div>
          </div>
          <div class="form-group">
            <label>Cardholder Name</label>
            <input type="text" v-model="payment.name" placeholder="John Doe" />
          </div>
        </div>
      </div>

      <div v-if="paymentError" class="error-message">
        {{ paymentError }}
      </div>

      <div class="step-actions">
        <button @click="prevStep" class="secondary-btn" :disabled="isProcessing">Back</button>
        <button @click="processPayment" class="primary-btn pay-btn" :disabled="isProcessing">
            <span v-if="isProcessing" class="spinner"></span>
            <span v-else>Pay {{ totalPrice.toFixed(2) }}€</span>
        </button>
      </div>
    </div>

    <!-- Step 4: Success -->
    <div v-if="currentStep === 4" class="step-content fade-in success-content">
      <div class="success-icon">✅</div>
      <h2>Order Created Successfully!</h2>
      <p class="order-id">Order ID: #{{ createdOrderId }}</p>
      <p>Thank you for your purchase. You can track your order in your profile.</p>
      
      <div class="step-actions centered">
        <button @click="goToProfile" class="primary-btn">View My Orders</button>
        <button @click="goToHome" class="secondary-btn">Continue Shopping</button>
      </div>
    </div>
  </div>
</template>

<script>
import apiService from '../services/apiService';

export default {
  name: 'Checkout',
  props: {
    cart_products: Array,
    totalPrice: Number,
    clear_cart: Function
  },
  data() {
    return {
      currentStep: 1,
      addresses: [],
      selectedAddressId: null,
      showAddAddress: false,
      loadingAddresses: false,
      newAddress: {
        label: "Home",
        address_line1: "",
        city: "",
        postal_code: "",
        country: "",
        phone: ""
      },
      payment: {
        cardNumber: '',
        expiry: '',
        cvc: '',
        name: ''
      },
      isProcessing: false,
      createdOrderId: null,
      paymentError: ''
    };
  },
  computed: {
    selectedAddress() {
      return this.addresses.find(a => a.id === this.selectedAddressId);
    }
  },
  async mounted() {
    if (!this.cart_products || this.cart_products.length === 0) {
       // If refreshed and cart is empty (state lost), redirect
       // ideally we'd persist cart but for now just redirect
       if (this.currentStep < 4) { // Allow staying if order just completed
         this.$router.push('/cart');
       }
    }
    await this.fetchAddresses();
  },
  methods: {
    async fetchAddresses() {
      try {
        this.loadingAddresses = true;
        const token = localStorage.getItem('user');
        if (!token) {
            this.$router.push('/login');
            return;
        }
        const response = await apiService.get('/api/users/addresses');
        this.addresses = response.data;
        if (this.addresses.length > 0) {
          const defaultAddr = this.addresses.find(a => a.is_default_shipping);
          this.selectedAddressId = defaultAddr ? defaultAddr.id : this.addresses[0].id;
        } else {
          this.showAddAddress = true;
        }
      } catch (error) {
        console.error("Error fetching addresses", error);
      } finally {
        this.loadingAddresses = false;
      }
    },
    async saveNewAddress() {
      try {
        if (!this.newAddress.address_line1 || !this.newAddress.city || !this.newAddress.postal_code || !this.newAddress.country) {
          alert("Please fill in required fields: Address, City, Postal Code, and Country");
          return;
        }
        const res = await apiService.post('/api/users/addresses', {
          ...this.newAddress,
          is_default_shipping: this.addresses.length === 0
        });
        await this.fetchAddresses();
        this.showAddAddress = false;
        // Select the new address
        if(res.data && res.data.address && res.data.address.id) {
           this.selectedAddressId = res.data.address.id;
        } else if (res.data && res.data.id) {
           this.selectedAddressId = res.data.id;
        }
        // Reset
        this.newAddress = { label: "Home", address_line1: "", city: "", postal_code: "", country: "", phone: "" };
      } catch (error) {
        console.error("Save address error:", error);
        alert(error.response?.data?.message || "Failed to save address");
      }
    },
    nextStep() {
      this.currentStep++;
    },
    prevStep() {
      this.currentStep--;
    },
    goBackToCart() {
      this.$router.push('/cart');
    },
    async processPayment() {
      this.paymentError = ''; // Clear previous errors

      if (!this.payment.cardNumber || !this.payment.expiry || !this.payment.cvc) {
          this.paymentError = "Please fill in all payment details";
          return;
      }
      
      this.isProcessing = true;
      try {
        // Call Payment API
        await apiService.post('/api/payment/validate', {
          cardNumber: this.payment.cardNumber,
          expiry: this.payment.expiry,
          cvc: this.payment.cvc,
          name: this.payment.name
        });

        // If success (no error thrown), proceed to place order
        await this.placeOrder();
      } catch (error) {
        console.error("Payment validation failed:", error);
        this.paymentError = error.response?.data?.message || "Payment Failed. Please check your card details.";
      } finally {
        this.isProcessing = false;
      }
    },
    async placeOrder() {
      try {
        const items = this.cart_products.map(product => ({
          productId: product.id,
          quantity: product.quantity_cart || 1,
        }));

        const response = await apiService.post('/api/orders', {
          items,
          shippingAddressId: this.selectedAddressId
        });
        
        this.createdOrderId = response.data.orderId;
        this.currentStep = 4; // Success
        this.clear_cart(); // Clear global cart
      } catch (error) {
         console.error('Error creating order:', error);
         alert(error.response?.data?.message || 'Failed to create order');
      }
    },
    goToProfile() {
      this.$router.push('/profile');
    },
    goToHome() {
      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
.checkout-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  min-height: 600px;
}

/* Stepper */
.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: #ccc;
  z-index: 1;
}
.step-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #eee;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}
.active .step-circle {
  background: #3498db;
  color: white;
}
.completed .step-circle {
  background: #27ae60;
  color: white;
}
.active, .completed {
  color: #333;
}
.line {
  flex: 1;
  height: 2px;
  background: #eee;
  margin: 0 10px;
  margin-bottom: 20px; /* Align with circle */
}

/* Content */
.step-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

h2 {
  margin-bottom: 20px;
  color: #2c3e50;
  text-align: center;
}

/* Addresses */
.saved-addresses {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}
.address-card {
  border: 2px solid #eee;
  padding: 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.address-card:hover {
  border-color: #3498db;
}
.address-card.selected {
  border-color: #3498db;
  background-color: #f0f9ff;
}

.new-address-form {
  margin-top: 20px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.new-address-form input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Summary */
.summary-list {
  list-style: none;
  padding: 0;
  border-bottom: 2px solid #eee;
  padding-bottom: 20px;
}
.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 16px;
}
.summary-total {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  font-size: 20px;
  font-weight: bold;
}
.selected-address-summary {
    background: #f9f9f9;
    padding: 10px;
    margin-top: 20px;
    border-radius: 5px;
    font-size: 0.9em;
    color: #666;
}

/* Payment */
.payment-form {
  max-width: 400px;
  margin: 0 auto;
}
.card-mock {
  background: #2c3e50;
  color: white;
  padding: 20px;
  border-radius: 12px;
}
.form-group {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}
.form-group label {
  font-size: 12px;
  margin-bottom: 5px;
  opacity: 0.8;
}
.form-group input {
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  padding: 10px;
  border-radius: 4px;
}
.form-row {
  display: flex;
  gap: 15px;
}

/* Success */
.success-content {
  text-align: center;
}
.success-icon {
  font-size: 60px;
  margin-bottom: 20px;
}
.order-id {
  font-weight: bold;
  font-size: 18px;
  color: #3498db;
  margin: 10px 0;
}

/* Buttons */
.step-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}
.step-actions.centered {
  justify-content: center;
  gap: 20px;
}
.primary-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}
.primary-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}
.secondary-btn {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}
.magin-top {
    margin-top: 10px;
}
.pay-btn {
    background: #27ae60;
}
.pay-btn:hover {
    background: #219150;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 6px;
  margin-top: 15px;
  text-align: center;
}
</style>
