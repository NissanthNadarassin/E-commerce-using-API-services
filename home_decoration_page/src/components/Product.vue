<template>
    <div class="product">
      <img :src="product.img" alt="product" @click="handleClick" loading="lazy" />
      <h4 @click="handleClick">{{ product.product_name }}</h4>
      
      <!-- Rating Display -->
      <div class="rating-container" v-if="product.averageRating > 0">
        <div class="stars">
          <span v-for="star in 5" :key="star" class="star" :class="{ filled: star <= Math.round(product.averageRating) }">
            ★
          </span>
        </div>
        <span class="rating-text">{{ product.averageRating }} ({{ product.totalReviews }} reviews)</span>
      </div>
      <div class="rating-container" v-else>
        <span class="no-reviews">No reviews yet</span>
      </div>
      
      <h2>Price: {{ product.price }}€</h2>
    </div>
  </template>
  
  <script>
  export default {
    name: "Product",
    props: {
      product: {
        type: Object,
        required: true,
      },
    },
    emits: ["product-clicked"],
    methods: {
      handleClick() {
        this.$emit("product-clicked", this.product.id);
      },
    },
  };
  </script>
  

<style scoped>
.product {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.product h4{
    margin-top: 10px;
    cursor: pointer;
}

.product img{
    border: 2px solid gray;
    width: 200px;
    height: 200px;
    cursor: pointer;
}

.product h2{
    margin: 10px;
    font-size: 18px;
}

.rating-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 8px 0;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 20px;
  color: #ddd;
}

.star.filled {
  color: #ffd700;
}

.rating-text {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.no-reviews {
  font-size: 13px;
  color: #999;
  font-style: italic;
}
</style>
