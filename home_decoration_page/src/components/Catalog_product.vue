<template>
  <div class="main_product_section">
    
    <ul class="list_products">
      <li 
        class="product-item" 
        v-for="item in filteredProducts" 
        :key="item.id"
      >
        <Product 
          :product="item"
          @product-clicked="viewProduct"
        />
        <button v-if="!isAdmin" @click="handleAddToCart(item)">Add to cart</button>
      </li>
    </ul>
    <p v-if="filteredProducts.length === 0">There are no products available</p>

  </div>
</template>

<script>
import Product from './Product.vue';

export default {
  name: "Catalog_product",
  components: {
    Product,
  },
  props: {
    add_product_to_cart: Function,
    products: Array,
    Page_category: String,
  },
  data() {
    return {
      userRoles: []
    };
  },
  computed: {
    isAdmin() {
      return this.userRoles.includes('admin');
    },
    filteredProducts() {
      const result = (!this.Page_category || this.Page_category === "Home")
        ? this.products || []
        : this.products?.filter(p => p.category === this.Page_category) || [];
      
      // Remove duplicates by product ID (in case of rendering issues)
      const uniqueProducts = Array.from(new Map(result.map(p => [p.id, p])).values());
      return uniqueProducts;
    }
  },
  created() {
    this.loadUserRole();
  },
  methods: {
    loadUserRole() {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(atob(userStr.split('.')[1]));
          this.userRoles = userData.roles || [];
        } catch (error) {
          console.error('Error parsing user token:', error);
        }
      }
    },
    viewProduct(id) {
      this.$router.push(`/product/${id}`);
    },
    handleAddToCart(item) {
      const token = localStorage.getItem('user');
      if (!token) {
        const userChoice = confirm('Please login or register to add items to cart.\n\nClick OK to login, or Cancel to register.');
        if (userChoice) {
          this.$router.push('/login');
        } else {
          this.$router.push('/register');
        }
        return;
      }
      this.add_product_to_cart(item);
    },
  },
};
</script>



<style scoped>
.main_product_section{
    text-align: center;
}

.main_product_section>h2{
    padding: 0;
    margin: 20px;
}
.list_products{
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    background-color: #243E36;
    width: 100%;
   
}

.product-item{
    margin: 20px;
    width: 250px;
    height: 350px;
    background-color: #f0e9d7;
    border-radius: 10px;
    padding: 10px;
    transition: transform 0.3s ease-in-out;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.product-item:hover{
    transform: scale(1.05);;
}

.product-item>button{
    background-color: white;
    border: 1px solid white;
    color: #243E36;
    border-radius: 20px;
    padding: 7px;
    font-weight: bold;
    transition: color 0.3s ease-in-out;
    cursor: pointer;
}

.product>button:hover{
    background-color: #243E36;
    border: 1px solid #243E36;
    color: white;
}



</style>

