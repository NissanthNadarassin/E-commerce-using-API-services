<template>
  <div class="app-container">
    <User_menu :number_Cart_Items="number_Cart_Items" :totalPrice="totalPrice" />
    <main>
      <router-view v-bind="viewProps"/>
    </main>
    <Footer_User />
  </div>
</template>

<script>
import User_menu from "./components/User_menu.vue";
import Footer_User from "./components/Footer_User.vue";
import ProductService from "./services/ProductService";

export default {
  name: "App",
  components: {
    User_menu,
    Footer_User,
  },
  data() {
    return {
      number_Cart_Items: 0,
      totalPrice: 0.0,
      products: [],
      cart_products:[],
      isLoading: true,
      categories:[
        "Beds",
        "Furniture",
        "Decoration",
        "Storage",
        "Home",
      ],
      
    };
  },
  methods: {
    // Fetch products from backend
  async fetchProducts() {
    try {
      this.isLoading = true;
      this.products = await ProductService.getAllProducts();
      console.log('✅ Fetched products:', this.products.length, 'products');
      console.log('Product IDs:', this.products.map(p => p.id));
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      this.isLoading = false;
    }
  },

    add_product_to_cart(item) {
      const existingProduct = this.cart_products.find((product) => product.id === item.id);
      
      // Initialize quantity_cart if not exists
      if (!item.quantity_cart) {
        item.quantity_cart = 0;
      }
      
      // Check stock availability
      const currentCartQty = existingProduct ? existingProduct.quantity_cart : item.quantity_cart;
      if (currentCartQty >= item.quantity_available) {
        alert(`Sorry, only ${item.quantity_available} units available in stock`);
        return;
      }
      
      if (existingProduct) {
        // Product already in cart, increase quantity
        existingProduct.quantity_cart++;
      } else {
        // New product, add to cart
        item.quantity_cart++;
        this.cart_products.push(item);
      }
      
      this.number_Cart_Items++;
      this.totalPrice += item.price;
    },

    remove_one_unit_cart_product(item){
      if(item.quantity_cart>0){
        this.number_Cart_Items--;
        item.quantity_cart--;
        this.totalPrice -= item.price;
        if(item.quantity_cart==0){
          const index = this.cart_products.findIndex(p => p.id === item.id);
          if(index !== -1) {
            this.cart_products.splice(index, 1);
          }
        }
      }
    },
    remove_cart_product(item){
        this.number_Cart_Items-= item.quantity_cart;
        this.totalPrice -= item.price*item.quantity_cart;
        item.quantity_cart=0;
        const index = this.cart_products.findIndex(p => p.id === item.id);
        if(index !== -1) {
          this.cart_products.splice(index, 1);
        }
    },
    

  },
  computed: {
    viewProps() {
      const sharedProductProps = {
          products: this.products,
          add_product_to_cart: this.add_product_to_cart,
      };

      switch (this.$route.name) {
          case 'Storage':
          case 'Furniture':
          case 'Beds':
          case 'Decoration':
              return {
                  ...sharedProductProps,
                  isLoading: this.isLoading,
              };

          case 'Home':
              return {
                  products: this.products,
                  add_product_to_cart: this.add_product_to_cart,
                  isLoading: this.isLoading,
              };

          case 'Cart':
              return {
                  cart_products: this.cart_products,
                  totalPrice: this.totalPrice,
                  number_Cart_Items: this.number_Cart_Items,
                  remove_one_unit_cart_product: this.remove_one_unit_cart_product,
                  remove_cart_product: this.remove_cart_product,
                  add_product_to_cart: this.add_product_to_cart,
              };

          default:
              return {};
      }
    }
  },
  async mounted() {
  await this.fetchProducts(); // Load products when the app loads
},
}
</script>


<style>
*{
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: "Montserrat";
  list-style: none;
}

html, body {
  height: 100%;
  width: 100%;
}

#app {
  height: 100%;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
}
</style>
