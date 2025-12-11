<template>
  <div v-if="recommendations.length > 0" class="recommendations-container fade-in">
    <div class="header">
      <h2>Recommended For You</h2>
      <span class="reason-badge" v-if="reason">✨ {{ reason }}</span>
    </div>

    <div class="products-grid">
      <div 
        v-for="product in recommendations" 
        :key="product.id" 
        class="product-card"
        @click="goToProduct(product.id)"
      >
        <div class="image-wrapper">
            <img :src="product.img" :alt="product.product_name" />
        </div>
        <div class="info">
            <h3>{{ product.product_name }}</h3>
            <p class="price">{{ product.price }}€</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import apiService from '../services/apiService';

export default {
  name: "RecommendedProducts",
  data() {
    return {
      recommendations: [],
      reason: "",
      loading: false
    };
  },
  async mounted() {
    await this.fetchRecommendations();
  },
  methods: {
    async fetchRecommendations() {
      const token = localStorage.getItem('user');
      if (!token) return; // Only for logged in users

      try {
        this.loading = true;
        const response = await apiService.get('/api/recommendations');
        this.recommendations = response.data.recommendations;
        this.reason = response.data.reason;
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        this.loading = false;
      }
    },
    goToProduct(id) {
      this.$router.push(`/product/${id}`);
    }
  }
};
</script>

<style scoped>
.recommendations-container {
  margin: 40px 0;
  padding: 20px;
  background: linear-gradient(to right, #f8f9fa, #e9ecef);
  border-radius: 12px;
}

.header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

h2 {
  color: #2c3e50;
  margin: 0;
}

.reason-badge {
  background: #6c5ce7;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(108, 92, 231, 0.3);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.product-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.image-wrapper {
  height: 150px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.info {
  padding: 12px;
}

.info h3 {
  font-size: 1em;
  margin: 0 0 5px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price {
  font-weight: bold;
  color: #27ae60;
  margin: 0;
}

.fade-in {
  animation: fadeIn 0.8s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
