<template>
  <div class="Storage_page">
    <div class="banner">
      <h1>Storage</h1>
      <p>Organize your space effortlessly with our versatile storage solutions. From sleek shelves to practical cabinets, find everything you need to keep your home tidy and stylish.</p>
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
  name: "Storage",
  components: {
    SearchableCatalog,
  },
  props: {
    add_product_to_cart: Function,
    products: Array,
  },
  data() {
    return {
      Page_category: "Storage", // Set the category specific to this page
    };
  },
};
</script>



<style scoped>

.Storage_page{
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