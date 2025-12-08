<template>
    <div class="Searchable_Catalog">
      <Search_bar 
        @search="filterProducts" 
        @reset_list="resetProductList"
      />
      <Catalog_product 
        :add_product_to_cart="add_product_to_cart" 
        :products="filteredProducts" 
        :Page_category="Page_category"
      />
    </div>
  </template>
  
  <script>
  import Catalog_product from "../components/Catalog_product.vue";
  import Search_bar from "../components/Search_bar.vue";
  
  export default {
    name: "SearchableCatalog",
    components: {
      Catalog_product,
      Search_bar,
    },
    props: {
      add_product_to_cart: Function,
      products: Array,
      Page_category: String,
    },
    data() {
      return {
        text_to_search: "",
        filteredProducts: this.products.filter(item => item.category === this.Page_category),
      };
    },
    methods: {
      filterProducts(searchText) {
        this.text_to_search = searchText.toLowerCase();
        this.filteredProducts = this.products.filter(item => {
          return (
            (!this.text_to_search || 
            item.product_name.toLowerCase().includes(this.text_to_search) || 
            item.description.toLowerCase().includes(this.text_to_search)) &&
            item.category === this.Page_category
          );
        });
      },
      resetProductList() {
        this.text_to_search = "";
        this.filteredProducts = this.products.filter(
          item => item.category === this.Page_category
        );
      },
    },
  };
  </script>
  