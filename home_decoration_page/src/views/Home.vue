<template>
    <section class="main_banner">
      <div class="slogan">
        <h1>Style Your Space, Love Your Place</h1>
        <p>
          Transform every corner of your home with unique, stylish furniture and
          decor that bring comfort and personality to your space.
        </p>
      </div>
      <img src="/imgs/main_image_home.jpg" alt="" />
    </section>
      
    <RecommendedProducts /> <!-- AI Recommendations -->

  
    <div class="main_categories_section">
      <h2>
        Discover the essentials to enhance every room and start creating the home
        of your dreams.
      </h2>
      <div class="category-container">
  <router-link to="/storage" class="category">
    <img src="/imgs/image-e312bbe9c6d348c5bb980207e0701bd4.webp" alt="Storage" />
    <div class="category-overlay">Storage</div>
  </router-link>

  <router-link to="/furniture" class="category">
    <img src="/imgs/Furniture.webp" alt="Furniture" />
    <div class="category-overlay">Furniture</div>
  </router-link>

  <router-link to="/beds" class="category">
    <img src="/imgs/Beds.jpg" alt="Beds" />
    <div class="category-overlay">Beds</div>
  </router-link>

  <router-link to="/decoration" class="category">
    <img src="/imgs/Decoration.webp" alt="Decoration" />
    <div class="category-overlay">Decoration</div>
  </router-link>
</div>

    </div>
    <h2 class="Home_catalog">Explore our catalog</h2>
    <div v-if="isLoading" class="loading">Loading products...</div>
    <Catalog_product v-else :key="'home-catalog'" :add_product_to_cart="add_product_to_cart" :products="products" :Page_category="Page_category" />
  </template>
  
<script>
  import Catalog_product from "../components/Catalog_product.vue";
  import RecommendedProducts from '../components/RecommendedProducts.vue'; // Import
  import apiService from '../services/apiService';
  
  export default {
    name: "Home",
    components: {
      Catalog_product,
      RecommendedProducts // Register
    },
    props: {
      add_product_to_cart: Function,
      products: Array,
      isLoading: Boolean,
    },
    data(){
      return{
        Page_category:"Home",
      }
    }
  };
</script>



<style scoped>
.main_banner{
    display: flex;
}

.main_banner img{
    width: 60%;
}

.slogan{
    margin: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
}
.slogan h1{
    font-size: 50px;
    
}
.slogan p{
    margin-top: 30px;
    font-size: large;
    line-height: 30px;
}

.slogan button{
    margin-top: 20px;
    background-color: #243E36;
    border: 1px solid #243E36;
    color: white;
    border-radius: 20px;
    padding: 7px;
    transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
    font-size: large;
}

.slogan button:hover{
    color: #243E36;
    background-color: white;
    border-bottom: 1px solid #243E36;
    cursor: pointer;
}


.main_categories_section{
    margin-top: 30px;
}

.main_categories_section h2{
    text-align: center;
    padding-left: 100px;
    padding-right: 100px;
    margin: 20px;
}

.category-container {
    display: flex;
    gap: 20px;
    justify-content: center;
    align-items: center;
    padding: 10px;
    flex-wrap: wrap;
}

.category {
    position: relative;
    width: 280px;
    height: 280px;
    overflow: hidden;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s;
}

.category img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease-in-out;
}

.category:hover {
    transform: scale(1.05);
}

.category-overlay {
    position: absolute;
    bottom: -100%; /* Start hidden below the image */
    width: 100%;
    height: 100%;
    background-color: rgba(36, 62, 54, 0.9); /* Semi-transparent overlay */
    color: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    transition: bottom 0.3s ease-in-out;
}

.category:hover .category-overlay {
    bottom: 0; /* Slide up to cover the image */
}

.category:hover img {
    transform: scale(1.1); 
}

.Home_catalog{
  text-align: center;
  margin-top: 30px;
  margin-bottom: 30px;
}

.loading {
  text-align: center;
  padding: 50px;
  font-size: 18px;
  color: #243E36;
}

@media (max-width: 600px){
  .main_banner{
    flex-direction: column;
  }
  .main_banner img{
    width: 100%;
  }
  .main_categories_section{
    width: 100%;
    padding: 0;
  }
  
  .main_categories_section h2{
    padding: 0;
  }
}
</style>