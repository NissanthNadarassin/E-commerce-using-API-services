<template>
  <div class="product_details_page">
    <div v-if="!product">Loading product details...</div>
    <div v-else class="product_container">
      <img :src="product.img" alt="Product Image" />
      <div class="product_details">
        <h1>{{ product.product_name }}</h1>
        <hr />
        <p class="category">Category: {{ product.category }}</p>

        <div class="rating_section">
          <h3>Rating: {{ product.averageRating || 0 }} / 5 ({{ product.totalReviews || 0 }} reviews)</h3>
          <div v-if="product.averageRating > 0">
            <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= Math.round(product.averageRating) }">&#9733;</span>
          </div>
          <div v-else>No ratings yet.</div>
        </div>

        <h2>Price: {{ product.price }}€</h2>
        <p class="description">Description:</p>
        <p>{{ product.description }}</p>

        <button v-if="!isAdmin" @click="addToCart">Add to Cart</button>

        <!-- Add Review Section -->
        <div v-if="!isAdmin" class="add_review_section">
          <h3>Leave a Review</h3>
          <div v-if="isLoggedIn" class="review_form">
            <label for="rating">Rating:</label>
            <select v-model="newReview.rating" id="rating">
              <option value="" disabled>Select rating</option>
              <option v-for="n in 5" :key="n" :value="n">{{ n }} ★</option>
            </select>
            
            <label for="comment">Comment:</label>
            <textarea 
              v-model="newReview.comment" 
              id="comment" 
              placeholder="Share your experience with this product..."
              rows="4"
            ></textarea>
            
            <button @click="submitReview" class="submit_review_btn">Submit Review</button>
          </div>
          <div v-else class="login_message">
            <p>Please <router-link to="/login">login</router-link> or <router-link to="/register">register</router-link> to leave a review.</p>
          </div>
        </div>

        <!-- Customer Reviews Section -->
        <div class="reviews_section">
          <div class="reviews_header">
            <h3>Customer Reviews ({{ filteredReviews.length }})</h3>
            <div class="filter_controls">
              <label>Filter by rating:</label>
              <select v-model="ratingFilter">
                <option value="all">All Ratings</option>
                <option value="5">5 Stars ★★★★★</option>
                <option value="4">4 Stars ★★★★</option>
                <option value="3">3 Stars ★★★</option>
                <option value="2">2 Stars ★★</option>
                <option value="1">1 Star ★</option>
              </select>
            </div>
          </div>
          <div v-if="filteredReviews.length > 0" class="reviews_list">
            <div v-for="review in filteredReviews" :key="review.id" class="review_item">
              <div class="review_header">
                <div class="review_user_info">
                  <strong>{{ review.user?.username || 'Anonymous' }}</strong>
                  <div class="review_stars">
                    <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= review.rating }">★</span>
                  </div>
                </div>
                <button 
                  v-if="currentUserId && review.userId === currentUserId" 
                  @click="deleteReview(review.id)" 
                  class="delete_review_btn"
                  title="Delete your review"
                >
                  🗑️ Delete
                </button>
              </div>
              <p class="review_comment">{{ review.comment }}</p>
              <p class="review_date">{{ new Date(review.createdAt).toLocaleDateString() }}</p>
            </div>
          </div>
          <div v-else class="no_reviews">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
export default {
  name: "IndividualProduct",
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      product: null,
      reviews: [],
      newReview: {
        rating: '',
        comment: ''
      },
      ratingFilter: 'all',
      currentUserId: null,
      userRoles: []
    };
  },
  computed: {
    filteredReviews() {
      if (this.ratingFilter === 'all') {
        return this.reviews;
      }
      return this.reviews.filter(review => review.rating === parseInt(this.ratingFilter));
    },
    isAdmin() {
      return this.userRoles.includes('admin');
    },
    isLoggedIn() {
      const hasToken = !!localStorage.getItem('user');
      return hasToken && !this.isAdmin;
    }
  },
  created() {
    this.fetchProductOnLoad();
    this.loadCurrentUser();
  },
  methods: {
    loadCurrentUser() {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(atob(userStr.split('.')[1]));
          this.currentUserId = userData.id;
          this.userRoles = userData.roles || [];
        } catch (error) {
          console.error('Error parsing user token:', error);
        }
      }
    },
    async fetchProductOnLoad() {
      const productId = parseInt(this.id, 10);
      if (this.$root.products.length) {
        this.fetchProduct(productId);
      }
    },
    async fetchProduct(productId) {
      const product = this.$root.products?.find((item) => item.id === productId);
      if (product) {
        this.product = product;
        await this.fetchReviews(productId);
      } else {
        console.error("Product not found");
      }
    },
    async fetchReviews(productId) {
      try {
        const response = await fetch(`http://localhost:5002/api/reviews/product/${productId}`);
        const data = await response.json();
        this.reviews = data.reviews || [];
      } catch (error) {
        console.error("Error fetching reviews:", error);
        this.reviews = [];
      }
    },
    async submitReview() {
      if (!this.newReview.rating || !this.newReview.comment.trim()) {
        alert('Please provide both rating and comment');
        return;
      }

      const token = localStorage.getItem('user');
      if (!token) {
        alert('Please login to submit a review');
        this.$router.push('/login');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5002/api/reviews/product/${this.product.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token
          },
          body: JSON.stringify({
            rating: parseInt(this.newReview.rating),
            comment: this.newReview.comment
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          alert('Review submitted successfully!');
          this.newReview = { rating: '', comment: '' };
          await this.fetchReviews(this.product.id);
        } else {
          alert(data.message || 'Failed to submit review');
        }
      } catch (error) {
        console.error('Error submitting review:', error);
        alert('Error submitting review. Please try again.');
      }
    },
    async deleteReview(reviewId) {
      if (!confirm('Are you sure you want to delete this review?')) {
        return;
      }

      const token = localStorage.getItem('user');
      if (!token) {
        alert('Please login to delete your review');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5002/api/reviews/${reviewId}`, {
          method: 'DELETE',
          headers: {
            'x-access-token': token
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          alert('Review deleted successfully!');
          await this.fetchReviews(this.product.id);
        } else {
          alert(data.message || 'Failed to delete review');
        }
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('Error deleting review. Please try again.');
      }
    },
    addToCart() {
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
      this.$root.add_product_to_cart(this.product);
    },
  },
  watch: {
    '$root.products': {
      immediate: true,
      handler(newProducts) {
        if (newProducts.length && !this.product) {
          const productId = parseInt(this.id, 10);
          this.fetchProduct(productId);
        }
      },
    },
    id(newId) {
      const productId = parseInt(newId, 10);
      this.fetchProduct(productId);
    },
  },
};

</script>

  

<style scoped>
.product_details_page{
    width: 100%;
    background-color: #EAEDED;
    padding-top: 30px;
    padding-bottom: 30px;
}

.product_container{
    margin: 0 auto;
    background: white;
    display: flex;
    width: 70%;
    padding: 20px;
    border-radius: 20px;
    gap:20px;
}

.product_container img{
    max-width: 400px;
    height: 100%;
    border: 1px solid gray;
}


.product_details {
    display: flex;
    flex-direction: column;
    gap: 15px;
    flex-grow: 1; 
}

.product_details button {
    background-color: #243E36;
    color: white;
    font-weight: bold;
    border: none;
    border-radius: 20px;
    height: 40px;
    cursor: pointer;
}
.category{
    color: grey;
    font-weight: bold;
}

.description{
    text-decoration: underline;
}

.product_details h1, .product_details h2{
    color: #243E36;
}

hr{
    width: 100%;
}

.star {
  font-size: 24px;
  color: #ccc;
}
.star.filled {
  color: gold;
}
.rating_section {
  margin: 10px 0;
}
.add_rating {
  margin-top: 10px;
  display: flex;
  justify-content: center; /* Center the button */
  align-items: center;
  gap: 10px;
  height: 70px;
}

.add_rating button {
  padding: 5px 10px;
  height: 40px;
  background-color: #243E36;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.add_review_section {
  margin-top: 30px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
}

.add_review_section h3 {
  margin-bottom: 15px;
  color: #243E36;
}

.review_form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.review_form label {
  font-weight: bold;
  color: #243E36;
}

.review_form select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.review_form textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

.submit_review_btn {
  padding: 12px 24px;
  background-color: #243E36;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  align-self: flex-start;
}

.submit_review_btn:hover {
  background-color: #1a2d26;
}

.login_message {
  padding: 20px;
  background-color: #f0f4f8;
  border-radius: 8px;
  text-align: center;
  margin-top: 10px;
}

.login_message p {
  margin: 0;
  color: #243E36;
  font-size: 16px;
}

.login_message a {
  color: #4299e1;
  text-decoration: none;
  font-weight: bold;
}

.login_message a:hover {
  text-decoration: underline;
}

.reviews_section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #eee;
}

.reviews_header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.reviews_section h3 {
  color: #243E36;
  margin: 0;
}

.filter_controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter_controls label {
  font-weight: bold;
  color: #243E36;
  font-size: 14px;
}

.filter_controls select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: white;
  font-size: 14px;
  cursor: pointer;
}

.reviews_list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review_item {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 10px;
  border-left: 4px solid #243E36;
}

.review_header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.review_user_info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.delete_review_btn {
  padding: 6px 12px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.delete_review_btn:hover {
  background-color: #c82333;
}

.review_header strong {
  color: #243E36;
  font-size: 16px;
}

.review_stars {
  display: flex;
  gap: 2px;
}

.review_stars .star {
  font-size: 16px;
  color: #ccc;
}

.review_stars .star.filled {
  color: #ffd700;
}

.review_comment {
  margin: 10px 0;
  color: #333;
  line-height: 1.5;
}

.review_date {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.no_reviews {
  padding: 20px;
  text-align: center;
  color: #999;
  font-style: italic;
}

@media (max-width: 800px){
  .product_container{
    flex-direction: column;
    align-items: center;
  }
  .product_container img{
    max-width: 250px;
    
}

}
</style>