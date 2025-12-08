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
    <div class="total" v-if="cart_products.length !== 0">
      <p>Total to pay : {{ totalPrice }}$ ({{number_Cart_Items}} {{ number_Cart_Items === 1 ? 'product' : 'products' }})</p>
      <button @click="createOrder" class="checkout-btn">Place Order</button>
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
  methods: {
    viewProduct(id) {
      this.$router.push(`/product/${id}`);
    },
    
    async createOrder() {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('user');
        if (!token) {
          alert('Please login to create an order');
          this.$router.push('/login');
          return;
        }

        // Prepare order items
        const items = this.cart_products.map(product => ({
          productId: product.id,
          quantity: product.quantity_cart || 1,
        }));

        console.log('Creating order with items:', items);

        // Create order
        const response = await apiService.post('/api/orders', {
          items,
          shippingAddress: 'Default address', // You can add a form for this
        });

        console.log('Order created:', response.data);

        alert(`Order created successfully! Order ID: ${response.data.orderId}`);
        
        // Clear cart after successful order
        // Create a copy of cart products array to avoid modification during iteration
        const productsToRemove = [...this.cart_products];
        productsToRemove.forEach(product => {
          this.remove_cart_product(product);
        });

        // TODO: Redirect to delivery page when ready
        // this.$router.push('/delivery');
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
  }

  .total{
    width: 80%;
    height: 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: white;
    margin: 0 auto;
    border-radius: 0 0 20px 20px  ;
    font-size: larger;
  }

  .car_product_container{
    width: 100%;
    background-color: rgba(0, 128, 0, 0);
    height: auto;
  }
  
  .checkout-btn {
    margin-top: 15px;
    padding: 12px 30px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .checkout-btn:hover {
    background-color: #45a049;
  }
</style>