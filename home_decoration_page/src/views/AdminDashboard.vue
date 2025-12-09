<template>
  <div class="admin_dashboard">
    <h1>Admin Dashboard</h1>
    
    <!-- Admin Profile Section -->
    <div class="admin_profile_section">
      <div class="profile_card">
        <div class="profile_header">
          <div class="profile_avatar">
            <font-awesome-icon :icon="['fas', 'user-shield']" />
          </div>
          <div class="profile_info">
            <h2>{{ adminInfo.username || 'Admin' }}</h2>
            <p class="email">{{ adminInfo.email || 'N/A' }}</p>
          </div>
        </div>
        <div class="profile_stats">
          <div class="stat_item">
            <span class="stat_label">Member Since</span>
            <span class="stat_value">{{ adminInfo.createdAt ? formatDate(adminInfo.createdAt) : 'N/A' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats_section">
      <div class="stat_card">
        <div class="stat_icon users">
          <font-awesome-icon :icon="['fas', 'users']" />
        </div>
        <div class="stat_content">
          <h3>{{ stats.totalUsers || 0 }}</h3>
          <p>Total Users</p>
        </div>
      </div>

      <div class="stat_card">
        <div class="stat_icon products">
          <font-awesome-icon :icon="['fas', 'box']" />
        </div>
        <div class="stat_content">
          <h3>{{ stats.totalProducts || 0 }}</h3>
          <p>Total Products</p>
        </div>
      </div>

      <div class="stat_card">
        <div class="stat_icon orders">
          <font-awesome-icon :icon="['fas', 'shopping-cart']" />
        </div>
        <div class="stat_content">
          <h3>{{ stats.totalOrders || 0 }}</h3>
          <p>Total Orders</p>
        </div>
      </div>

      <div class="stat_card">
        <div class="stat_icon revenue">
          <font-awesome-icon :icon="['fas', 'dollar-sign']" />
        </div>
        <div class="stat_content">
          <h3>€{{ stats.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00' }}</h3>
          <p>Total Revenue</p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick_actions_section">
      <h3>Quick Actions</h3>
      <div class="action_buttons">
        <router-link to="/users" class="action_btn users_btn">
          <font-awesome-icon :icon="['fas', 'users-cog']" />
          <span>Manage Users</span>
        </router-link>
        <router-link to="/products" class="action_btn products_btn">
          <font-awesome-icon :icon="['fas', 'boxes']" />
          <span>Manage Products</span>
        </router-link>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="recent_orders_section">
      <h3>Recent Orders</h3>
      <div v-if="loadingOrders" class="loading">Loading orders...</div>
      <div v-else-if="recentOrders.length === 0" class="no_data">No recent orders</div>
      <div v-else class="orders_table_wrapper">
        <table class="orders_table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>User</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in recentOrders" :key="order.id">
              <td>#{{ order.id }}</td>
              <td>{{ order.user?.username || 'N/A' }}</td>
              <td>{{ formatDate(order.createdAt) }}</td>
              <td>€{{ parseFloat(order.total_amount).toFixed(2) }}</td>
              <td>
                <span class="status_badge" :class="'status_' + order.status">
                  {{ order.status.toUpperCase() }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import apiService from '../services/apiService';

export default {
  name: 'AdminDashboard',
  data() {
    return {
      adminInfo: {},
      stats: {
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
      },
      recentOrders: [],
      loadingOrders: true,
    };
  },
  created() {
    this.fetchAdminProfile();
    this.fetchStatistics();
    this.fetchRecentOrders();
  },
  methods: {
    async fetchAdminProfile() {
      try {
        const token = localStorage.getItem('user');
        if (token) {
          const userData = JSON.parse(atob(token.split('.')[1]));
          this.adminInfo = {
            username: userData.username || 'Admin',
            email: userData.email || 'N/A',
            roles: userData.roles || ['admin'],
            createdAt: userData.iat ? new Date(userData.iat * 1000).toISOString() : null
          };
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      }
    },

    async fetchStatistics() {
      try {
        // Fetch users count
        const usersResponse = await apiService.get('/api/users');
        this.stats.totalUsers = usersResponse.data.length || 0;

        // Fetch products count
        const productsResponse = await apiService.get('/api/products');
        this.stats.totalProducts = productsResponse.data.length || 0;

        // Fetch orders and calculate stats
        const ordersResponse = await apiService.get('/api/orders/admin/all');
        const orders = ordersResponse.data || [];
        this.stats.totalOrders = orders.length;
        
        // Calculate total revenue (only from completed orders)
        this.stats.totalRevenue = orders
          .filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    },

    async fetchRecentOrders() {
      try {
        this.loadingOrders = true;
        const response = await apiService.get('/api/orders/admin/all');
        // Get last 5 orders
        this.recentOrders = (response.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
      } catch (error) {
        console.error('Error fetching recent orders:', error);
      } finally {
        this.loadingOrders = false;
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
  }
};
</script>

<style scoped>
.admin_dashboard {
  max-width: 1400px;
  margin: 40px auto;
  padding: 20px;
}

h1 {
  color: #243E36;
  margin-bottom: 30px;
  font-size: 36px;
  text-align: center;
}

h3 {
  color: #243E36;
  margin-bottom: 20px;
  font-size: 24px;
  border-bottom: 2px solid #243E36;
  padding-bottom: 10px;
}

/* Admin Profile Section */
.admin_profile_section {
  margin-bottom: 40px;
}

.profile_card {
  background: linear-gradient(135deg, #243E36 0%, #1a2d26 100%);
  border-radius: 15px;
  padding: 30px;
  color: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.profile_header {
  display: flex;
  align-items: center;
  gap: 25px;
  margin-bottom: 25px;
}

.profile_avatar {
  width: 80px;
  height: 80px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.profile_info h2 {
  margin: 0 0 5px 0;
  color: white;
  font-size: 28px;
}

.profile_info .email {
  color: rgba(255,255,255,0.8);
  margin: 5px 0;
}

.role_badge {
  display: inline-block;
  background: rgba(255,255,255,0.3);
  padding: 6px 15px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  margin-top: 10px;
}

.profile_stats {
  display: flex;
  gap: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.2);
}

.stat_item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat_label {
  color: rgba(255,255,255,0.7);
  font-size: 14px;
}

.stat_value {
  font-size: 18px;
  font-weight: bold;
}

/* Statistics Cards */
.stats_section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat_card {
  background: white;
  border-radius: 10px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat_card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.stat_icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}

.stat_icon.users {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat_icon.products {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat_icon.orders {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat_icon.revenue {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat_content h3 {
  margin: 0;
  padding: 0;
  border: none;
  font-size: 32px;
  color: #243E36;
}

.stat_content p {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 14px;
}

/* Quick Actions */
.quick_actions_section {
  margin-bottom: 40px;
}

.action_buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.action_btn {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px 30px;
  border-radius: 10px;
  text-decoration: none;
  color: white;
  font-weight: 500;
  font-size: 16px;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.action_btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.action_btn svg {
  font-size: 24px;
}

.users_btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.products_btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

/* Recent Orders */
.recent_orders_section {
  margin-bottom: 40px;
}

.loading,
.no_data {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

.orders_table_wrapper {
  overflow-x: auto;
}

.orders_table {
  width: 100%;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.orders_table thead {
  background: #243E36;
  color: white;
}

.orders_table th,
.orders_table td {
  padding: 15px;
  text-align: left;
}

.orders_table tbody tr {
  border-bottom: 1px solid #eee;
  transition: background-color 0.3s;
}

.orders_table tbody tr:hover {
  background-color: #f8f9fa;
}

.status_badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
}

.status_badge.status_pending {
  background-color: #fff3cd;
  color: #856404;
}

.status_badge.status_processing {
  background-color: #cfe2ff;
  color: #084298;
}

.status_badge.status_completed {
  background-color: #d1e7dd;
  color: #0f5132;
}

.status_badge.status_cancelled {
  background-color: #f8d7da;
  color: #842029;
}

@media (max-width: 768px) {
  .profile_header {
    flex-direction: column;
    text-align: center;
  }

  .stats_section {
    grid-template-columns: 1fr;
  }

  .action_buttons {
    grid-template-columns: 1fr;
  }

  .orders_table {
    font-size: 14px;
  }

  .orders_table th,
  .orders_table td {
    padding: 10px;
  }
}
</style>
