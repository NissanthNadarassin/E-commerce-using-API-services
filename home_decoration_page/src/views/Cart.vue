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
      <div class="total">
        <p>Total to pay : {{ totalPrice.toFixed(2) }}€ ({{number_Cart_Items}} {{ number_Cart_Items === 1 ? 'product' : 'products' }})</p>
        <button @click="goToCheckout" class="checkout-btn">Proceed to Checkout</button>
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
      // Data moved to Checkout
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
       // Only needed if we wanted to show something, but now we just move to checkout
    },

    saveNewAddress() {
       // logic moved to checkout
    },
    
    goToCheckout() {
      // Just check auth then push
      const token = localStorage.getItem('user');
      if (!token) {
        alert('Please login to checkout');
        this.$router.push('/login');
        return;
      }
      this.$router.push('/checkout');
    },

    // Legacy method name expected by template if not updated
    createOrder() {
       this.goToCheckout();
    }
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