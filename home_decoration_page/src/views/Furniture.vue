<template>
    <div class="Furniture">
      <div class="banner">
        <h1>Furniture</h1>
        <p>Transform your home with our wide range of furniture. From elegant sofas to modern dining sets, find pieces that match your style and bring comfort to every room.</p>
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
    name: "Furniture",
    components: {
      SearchableCatalog,
    },
    props: {
      add_product_to_cart: Function,
      products: Array,
    },
    data() {
      return {
        Page_category: "Furniture",
      };
    },
  };
  </script>
  
  <style scoped>
  .Furniture{
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