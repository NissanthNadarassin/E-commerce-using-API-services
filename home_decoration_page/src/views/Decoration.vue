<template>
    <div class="Decoration">
      <div class="banner">
        <h1>Decoration</h1>
        <p>Add a personal touch to your space with our stunning decor pieces. Explore our collection of wall art, vases, and accents to create a home that reflects your unique style.</p>
    </div>
      
      <SearchableCatalog
        :add_product_to_cart="add_product_to_cart"
        :products="products"
        :Page_category="Page_category"
      />
    </div>
  </template>
  
  <script>
  import SearchableCatalog from "../components/SearchableCatalog.vue";
  
  export default {
    name: "Decoration",
    components: {
      SearchableCatalog,
    },
    props: {
      add_product_to_cart: Function,
      products: Array,
    },
    data() {
      return {
        Page_category: "Decoration",
      };
    },
  };
  </script>
  
  
  
  <style scoped>
  .Decoration{
    min-height: 400px;
    }
  .banner{
    padding: 30px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .banner h1{
    color: #243E36;
  }
  </style>