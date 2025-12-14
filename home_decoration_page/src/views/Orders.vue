<template>
  <div class="profile_container">
    <h2>My Profile</h2>
    
    <!-- User Information Section -->
    <div class="profile_section">
      <h3>Personal Information</h3>
      <div v-if="loadingUser" class="loading">Loading profile...</div>
      <div v-else class="user_info_card">
        <div class="info_row">
          <label>Username:</label>
          <span>{{ userInfo.username || 'N/A' }}</span>
        </div>
        <div class="info_row">
          <label>Email:</label>
          <span>{{ userInfo.email || 'N/A' }}</span>
          <button @click="showEditEmailForm = true" class="edit_btn_small">Edit</button>
        </div>
        <div class="info_row">
          <label>Phone:</label>
          <span>{{ defaultPhone || 'Not set' }}</span>
          <button @click="openEditPhoneForm" class="edit_btn_small">Edit</button>
        </div>
        <div class="info_row">
          <label>Member Since:</label>
          <span>{{ userInfo.createdAt ? formatDate(userInfo.createdAt) : 'N/A' }}</span>
        </div>
        <div class="profile_actions">
          <button @click="deleteAccount" class="delete_account_btn">Delete Account</button>
        </div>
      </div>
    </div>
    
    <!-- Edit Email Modal -->
    <div v-if="showEditEmailForm" class="modal_overlay" @click.self="closeEditEmailForm">
      <div class="modal_content">
        <div class="modal_header">
          <h3>Edit Email</h3>
          <button @click="closeEditEmailForm" class="close_btn">&times;</button>
        </div>
        <form @submit.prevent="updateEmail" class="edit_email_form">
          <div class="form_group">
            <label>New Email *</label>
            <input v-model="newEmail" type="email" placeholder="your.email@example.com" required />
          </div>
          <div class="form_actions">
            <button type="button" @click="closeEditEmailForm" class="cancel_btn">Cancel</button>
            <button type="submit" class="submit_btn">Update Email</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Edit Phone Modal -->
    <div v-if="showEditPhoneForm" class="modal_overlay" @click.self="closeEditPhoneForm">
      <div class="modal_content">
        <div class="modal_header">
          <h3>Edit Phone Number</h3>
          <button @click="closeEditPhoneForm" class="close_btn">&times;</button>
        </div>
        <form @submit.prevent="updatePhone" class="edit_phone_form">
          <div class="form_group">
            <label>Phone Number</label>
            <input v-model="newPhone" type="tel" placeholder="+33 1 23 45 67 89" />
          </div>
          <div class="form_actions">
            <button type="button" @click="closeEditPhoneForm" class="cancel_btn">Cancel</button>
            <button type="submit" class="submit_btn">Update Phone</button>
          </div>
        </form>
      </div>
    </div>

    
    <!-- Generic Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal_overlay" @click.self="closeConfirmModal">
      <div class="modal_content">
        <div class="modal_header">
          <h3>{{ confirmModalTitle }}</h3>
          <button @click="closeConfirmModal" class="close_btn">&times;</button>
        </div>
        <div class="modal_body">
            <p>{{ confirmModalMessage }}</p>
        </div>
        <div class="form_actions">
          <button @click="closeConfirmModal" class="cancel_btn">No, Keep It</button>
          <button @click="confirmAction" class="submit_btn delete_account_btn">Yes, Confirm</button>
        </div>
      </div>
    </div>

    <!-- Addresses Section (User Only) -->
    <div v-if="!isAdmin" class="addresses_section">
      <h3>My Addresses</h3>
      
      <div v-if="loadingAddresses" class="loading">Loading addresses...</div>
      
      <div v-else-if="addresses.length === 0" class="no_addresses">
        <p>No addresses saved yet.</p>
        <button @click="showAddAddressForm = true" class="add_address_btn">Add Address</button>
      </div>
      
      <div v-else class="addresses_list">
        <div v-for="address in addresses" :key="address.id" class="address_card">
          <div class="address_header">
            <strong>{{ address.label || 'Address' }}</strong>
            <div class="address_badges">
              <span v-if="address.is_default_shipping" class="badge shipping">Default Shipping</span>
              <span v-if="address.is_default_billing" class="badge billing">Default Billing</span>
            </div>
          </div>
          <div class="address_body">
            <p>{{ address.address_line1 }}</p>
            <p v-if="address.address_line2">{{ address.address_line2 }}</p>
            <p>{{ address.city }}, {{ address.postal_code }}</p>
            <p>{{ address.country }}</p>
            <p v-if="address.phone"><strong>Phone:</strong> {{ address.phone }}</p>
          </div>
          <div class="address_actions">
            <button @click="editAddress(address)" class="edit_address_btn">Edit</button>
            <button @click="deleteAddress(address.id)" class="delete_address_btn">Delete</button>
          </div>
        </div>
        <button @click="showAddAddressForm = true" class="add_address_btn">Add New Address</button>
      </div>

      <!-- Add/Edit Address Form Modal -->
      <div v-if="showAddAddressForm" class="modal_overlay" @click="closeAddressForm">
        <div class="modal_content" @click.stop>
          <div class="modal_header">
            <h3>{{ editingAddressId ? 'Edit Address' : 'Add New Address' }}</h3>
            <button @click="closeAddressForm" class="close_btn">&times;</button>
          </div>
          
          <form @submit.prevent="submitAddress" class="address_form">
            <div class="form_group">
              <label>Label (e.g., Home, Office)</label>
              <input v-model="newAddress.label" type="text" placeholder="Home" />
            </div>

            <div class="form_group">
              <label>Address Line 1 *</label>
              <input v-model="newAddress.address_line1" type="text" placeholder="123 Main Street" required />
            </div>

            <div class="form_group">
              <label>Address Line 2</label>
              <input v-model="newAddress.address_line2" type="text" placeholder="Apartment, suite, etc." />
            </div>

            <div class="form_row">
              <div class="form_group">
                <label>City *</label>
                <input v-model="newAddress.city" type="text" placeholder="Paris" required />
              </div>

              <div class="form_group">
                <label>Postal Code *</label>
                <input v-model="newAddress.postal_code" type="text" placeholder="75001" required />
              </div>
            </div>

            <div class="form_group">
              <label>Country *</label>
              <input v-model="newAddress.country" type="text" placeholder="France" required />
            </div>

            <div class="form_group">
              <label>Phone</label>
              <input v-model="newAddress.phone" type="tel" placeholder="+33 1 23 45 67 89" />
            </div>

            <div class="form_group_checkbox">
              <label>
                <input v-model="newAddress.is_default_shipping" type="checkbox" />
                Set as default shipping address
              </label>
            </div>

            <div class="form_group_checkbox">
              <label>
                <input v-model="newAddress.is_default_billing" type="checkbox" />
                Set as default billing address
              </label>
            </div>

            <div class="form_actions">
              <button type="button" @click="closeAddressForm" class="cancel_btn">Cancel</button>
              <button type="submit" class="submit_btn">{{ editingAddressId ? 'Update' : 'Save' }} Address</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Order History Section (User Only) -->
    <div v-if="!isAdmin" class="orders_section">
      <h3>Order History</h3>
      
      <div v-if="loadingOrders" class="loading">Loading orders...</div>
      
      <div v-else-if="orders.length === 0" class="no_orders">
        <p>You haven't placed any orders yet.</p>
        <router-link to="/" class="shop_btn">Start Shopping</router-link>
      </div>
      
      <div v-else class="orders_container">
        
        <!-- Current Orders Section -->
        <div v-if="currentOrders.length > 0" class="orders_subsection">
          <h4>Current Orders</h4>
          <div class="orders_list">
            <div v-for="order in currentOrders" :key="order.id" class="order_card">
              <div class="order_header">
                <div class="order_info">
                  <h3>Order #{{ order.id }}</h3>
                  <span class="order_date">{{ formatDate(order.createdAt) }}</span>
                </div>
                <div class="order_status_badge" :class="getStatusClass(order.status)">
                  {{ order.status.toUpperCase() }}
                </div>
              </div>
              
              <div class="order_items">
                <div v-for="item in order.items" :key="item.id" class="order_item" @click="goToProduct(item.product.id)">
                  <img :src="item.product.img" :alt="item.product.product_name" />
                  <div class="item_details">
                    <h4>{{ item.product.product_name }}</h4>
                    <p>Quantity: {{ item.quantity }} × {{ item.price }}€</p>
                  </div>
                  <div class="item_total">
                    {{ (item.quantity * item.price).toFixed(2) }}€
                  </div>
                </div>
              </div>
              
              <div class="order_footer">
                <div class="order_total">
                  <strong>Total Amount: {{ parseFloat(order.total_amount).toFixed(2) }}€</strong>
                </div>
                <div class="order_actions">
                  <button 
                    v-if="canTrack(order.status)"
                    @click="trackOrder(order.id)"
                    class="track_btn"
                  >
                    Track Order
                  </button>

                  <button 
                    v-if="canCancel(order.status)" 
                    @click="cancelOrder(order.id)"
                    class="cancel_btn"
                  >
                    Cancel Order
                  </button>

                  <button 
                    v-if="canReturn(order.status)" 
                    @click="returnOrder(order.id)"
                    class="return_btn"
                  >
                    Return Order
                  </button>

                  <span v-if="order.status === 'cancelled'" class="cancelled_text">
                    Order Cancelled
                  </span>
                  <span v-if="order.status === 'returned'" class="cancelled_text">
                    Returned
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Past Orders Section -->
        <div v-if="pastOrders.length > 0" class="orders_subsection">
          <h4>Past Orders</h4>
          <div class="orders_list">
            <div v-for="order in pastOrders" :key="order.id" class="order_card past_order">
              <div class="order_header">
                <div class="order_info">
                  <h3>Order #{{ order.id }}</h3>
                  <span class="order_date">{{ formatDate(order.createdAt) }}</span>
                </div>
                <div class="order_status_badge" :class="getStatusClass(order.status)">
                  {{ order.status.toUpperCase() }}
                </div>
              </div>
              
              <div class="order_items">
                <div v-for="item in order.items" :key="item.id" class="order_item" @click="goToProduct(item.product.id)">
                  <img :src="item.product.img" :alt="item.product.product_name" />
                  <div class="item_details">
                    <h4>{{ item.product.product_name }}</h4>
                    <p>Quantity: {{ item.quantity }} × {{ item.price }}€</p>
                  </div>
                  <div class="item_total">
                    {{ (item.quantity * item.price).toFixed(2) }}€
                  </div>
                </div>
              </div>
              
              <div class="order_footer">
                <div class="order_total">
                  <strong>Total Amount: {{ parseFloat(order.total_amount).toFixed(2) }}€</strong>
                </div>
                <div class="order_actions">
                  <!-- No actions for past orders mostly, unless re-order is added later -->
                  <span v-if="order.status === 'cancelled'" class="cancelled_text">
                    Order Cancelled
                  </span>
                  <span v-if="order.status === 'completed'" class="completed_text">
                    Sales Receipt Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import apiService from '../services/apiService';

export default {
  name: 'UserProfile',
  data() {
    return {
      userInfo: {},
      orders: [],
      addresses: [],
      loadingUser: true,
      loadingOrders: true,
      loadingAddresses: true,
      showAddAddressForm: false,
      showEditEmailForm: false,
      showEditPhoneForm: false,
      newEmail: '',
      newPhone: '',
      defaultAddressId: null,
      editingAddressId: null,
      newAddress: {
        label: '',
        address_line1: '',
        address_line2: '',
        city: '',
        postal_code: '',
        country: '',
        phone: '',
        is_default_shipping: false,
        is_default_billing: false,
      },
      // Confirmation Modal State
      showConfirmModal: false,
      confirmModalTitle: '',
      confirmModalMessage: '',
      pendingAction: null, // 'cancel' or 'return'
      pendingOrderId: null,
    };
  },
  computed: {
    defaultPhone() {
      const defaultAddress = this.addresses.find(addr => addr.is_default_shipping);
      return defaultAddress?.phone || null;
    },
    isAdmin() {
      return this.userInfo.roles && this.userInfo.roles.includes('admin');
    },
    currentOrders() {
      return this.orders.filter(order => {
        const s = order.status.toLowerCase();
        return s !== 'completed' && s !== 'cancelled';
      });
    },
    pastOrders() {
      return this.orders.filter(order => {
        const s = order.status.toLowerCase();
        return s === 'completed' || s === 'cancelled';
      });
    }
  },
  created() {
    this.fetchUserProfile();
    if (!this.isAdmin) {
      this.fetchOrders();
      this.fetchAddresses();
    }
  },
  methods: {
    async fetchUserProfile() {
      // Combined GraphQL Fetch
      try {
        this.loadingUser = true;
        this.loadingOrders = true;
        this.loadingAddresses = true;
        
        const token = localStorage.getItem('user');
        if (!token) {
          this.$router.push('/login');
          return;
        }

        const query = `
          {
            me {
              id
              username
              email
              phone
              orders {
                id
                total_amount
                status
                createdAt
                items {
                  id
                  quantity
                  price
                  product {
                    id
                    product_name
                    img
                  }
                }
              }
              addresses {
                id
                label
                address_line1
                address_line2
                city
                postal_code
                country
                phone
                is_default_shipping
                is_default_billing
              }
            }
          }
        `;
        
        const data = await apiService.graphQL(query);
        const me = data.me;

        // User Info
        this.userInfo = {
            id: me.id,
            username: me.username,
            email: me.email,
            phone: me.phone,
            roles: ['user'], // GraphQL simplified this, maybe add roles to schema later?
            createdAt: null // Schema missing created_at for user, optional
        };
        
        // Orders
        this.orders = me.orders;

        // Addresses
        this.addresses = me.addresses;

      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        this.loadingUser = false;
        this.loadingOrders = false;
        this.loadingAddresses = false;
      }
    },
    // fetchOrders and fetchAddresses are now redundant but kept empty or removed to avoid breaks if called elsewhere
    async fetchOrders() {}, 
    async fetchAddresses() {},

    async submitAddress() {
      try {
        if (this.editingAddressId) {
          // Update existing address
          const response = await apiService.put(`/api/users/addresses/${this.editingAddressId}`, this.newAddress);
          alert('Address updated successfully!');
        } else {
          // Add new address
          const response = await apiService.post('/api/users/addresses', this.newAddress);
          alert('Address added successfully!');
        }
        
        // Reset form and close modal
        this.closeAddressForm();
        
        // Refresh addresses list
        await this.fetchAddresses();
      } catch (error) {
        console.error('Error saving address:', error);
        alert(error.response?.data?.message || 'Failed to save address');
      }
    },

    editAddress(address) {
      this.editingAddressId = address.id;
      this.newAddress = {
        label: address.label || '',
        address_line1: address.address_line1,
        address_line2: address.address_line2 || '',
        city: address.city,
        postal_code: address.postal_code,
        country: address.country,
        phone: address.phone || '',
        is_default_shipping: address.is_default_shipping,
        is_default_billing: address.is_default_billing,
      };
      this.showAddAddressForm = true;
    },

    async deleteAddress(addressId) {
      this.pendingOrderId = addressId; // Reusing this var as targetId
      this.pendingAction = 'delete_address';
      this.confirmModalTitle = 'Delete Address';
      this.confirmModalMessage = 'Are you sure you want to delete this address?';
      this.showConfirmModal = true;
    },

    closeAddressForm() {
      this.showAddAddressForm = false;
      this.editingAddressId = null;
      // Reset form
      this.newAddress = {
        label: '',
        address_line1: '',
        address_line2: '',
        city: '',
        postal_code: '',
        country: '',
        phone: '',
        is_default_shipping: false,
        is_default_billing: false,
      };
    },
    
    goToProduct(productId) {
      this.$router.push(`/product/${productId}`);
    },
    

    async trackOrder(orderId) {
      this.$router.push(`/track-delivery/${orderId}`);
    },
    
    async cancelOrder(orderId) {
      this.pendingOrderId = orderId;
      this.pendingAction = 'cancel';
      this.confirmModalTitle = 'Cancel Order';
      this.confirmModalMessage = 'Are you sure you want to cancel this order? Stock will be restored.';
      this.showConfirmModal = true;
    },

    async returnOrder(orderId) {
        this.pendingOrderId = orderId;
        this.pendingAction = 'return';
        this.confirmModalTitle = 'Return Order';
        this.confirmModalMessage = 'Do you want to return this order? This will initiate the return process.';
        this.showConfirmModal = true;
    },

    async confirmAction() {
        if (!this.pendingOrderId && !this.pendingAction) return; 
        
        // For account/address delete, we might not have pendingOrderId but maybe a generic pendingId
        // Let's generalize pendingOrderId to pendingTargetId
        
        this.showConfirmModal = false;

        try {
            let response;
            if (this.pendingAction === 'cancel') {
                 await apiService.put(`/api/orders/${this.pendingOrderId}/cancel`);
                 // alert('Order cancelled'); // Optional: replace with toast if needed, for now rely on UI update
            } else if (this.pendingAction === 'return') {
                 await apiService.put(`/api/orders/${this.pendingOrderId}/return`);
            } else if (this.pendingAction === 'delete_address') {
                 await apiService.delete(`/api/users/addresses/${this.pendingOrderId}`);
                 await this.fetchAddresses();
                 return; // addresses fetch handles UI
            } else if (this.pendingAction === 'delete_account') {
                 await apiService.delete('/api/users/profile');
                 localStorage.removeItem('user');
                 localStorage.removeItem('userName');
                 this.$router.push('/');
                 window.location.reload();
                 return;
            }
            
            // Refresh orders if generic action
            if (['cancel', 'return'].includes(this.pendingAction)) {
                await this.fetchOrders();
            }
        } catch (error) {
            console.error(`Error processing ${this.pendingAction}:`, error);
            // Fallback for error notification if alert is broken?
            // console.log is safe. Maybe set a global error banner?
        } finally {
            this.pendingOrderId = null;
            this.pendingAction = null;
        }
    },
    
    closeConfirmModal() {
        this.showConfirmModal = false;
        this.pendingOrderId = null;
        this.pendingAction = null;
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    getStatusClass(status) {
      return {
        'status_pending': status === 'pending',
        'status_processing': status === 'processing',
        'status_completed': status === 'completed',
        'status_cancelled': status === 'cancelled'
      };
    },

    canCancel(status) {
      const s = status.toLowerCase();
      return ['pending', 'preparing', 'processing'].includes(s);
    },

    canReturn(status) {
      const s = status.toLowerCase();
      return ['delivered', 'completed'].includes(s);
    },
    
    canTrack(status) {
      const s = status.toLowerCase();
      return ['pending', 'preparing', 'processing', 'en route'].includes(s) && s !== 'cancelled';
    },
    
    closeEditEmailForm() {
      this.showEditEmailForm = false;
      this.newEmail = '';
    },
    
    async updateEmail() {
      if (!this.newEmail || !this.newEmail.includes('@')) {
        alert('Please enter a valid email address');
        return;
      }

      try {
        const response = await apiService.put('/api/users/profile', {
          email: this.newEmail
        });
        
        alert('Email updated successfully!');
        this.userInfo.email = this.newEmail;
        this.closeEditEmailForm();
      } catch (error) {
        console.error('Error updating email:', error);
        alert(error.response?.data?.message || 'Failed to update email');
      }
    },
    
    openEditPhoneForm() {
      // Try to find default shipping address, or use first address, or null
      const defaultAddress = this.addresses.find(addr => addr.is_default_shipping) || this.addresses[0];
      this.defaultAddressId = defaultAddress?.id || null;
      this.newPhone = defaultAddress?.phone || '';
      this.showEditPhoneForm = true;
    },
    
    closeEditPhoneForm() {
      this.showEditPhoneForm = false;
      this.newPhone = '';
      this.defaultAddressId = null;
    },
    
    async updatePhone() {
      try {
        // If user has addresses, update the default or first one
        if (this.defaultAddressId) {
          const defaultAddress = this.addresses.find(addr => addr.id === this.defaultAddressId);
          
          await apiService.put(`/api/users/addresses/${this.defaultAddressId}`, {
            label: defaultAddress.label,
            address_line1: defaultAddress.address_line1,
            address_line2: defaultAddress.address_line2,
            city: defaultAddress.city,
            postal_code: defaultAddress.postal_code,
            country: defaultAddress.country,
            phone: this.newPhone,
            is_default_shipping: defaultAddress.is_default_shipping,
            is_default_billing: defaultAddress.is_default_billing,
          });
        } else {
          // If no addresses exist, create a new one with just phone
          await apiService.post('/api/users/addresses', {
            label: 'Primary Contact',
            address_line1: 'Not provided',
            city: 'Not provided',
            postal_code: '00000',
            country: 'Not provided',
            phone: this.newPhone,
            is_default_shipping: true,
            is_default_billing: true,
          });
        }
        
        alert('Phone number updated successfully!');
        this.closeEditPhoneForm();
        await this.fetchAddresses();
      } catch (error) {
        console.error('Error updating phone:', error);
        alert(error.response?.data?.message || 'Failed to update phone number');
      }
    },
    
    async deleteAccount() {
      const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.');
      
      if (!confirmed) return;
      
      const doubleConfirm = confirm('This is your last chance. Are you absolutely sure you want to delete your account?');
      
      if (!doubleConfirm) return;

      try {
        await apiService.delete('/api/users/profile');
        alert('Account deleted successfully. You will be logged out.');
        
        // Clear localStorage and redirect to home
        localStorage.removeItem('user');
        localStorage.removeItem('userName');
        this.$router.push('/');
        window.location.reload(); // Force reload to update UI
      } catch (error) {
        console.error('Error deleting account:', error);
        alert(error.response?.data?.message || 'Failed to delete account');
      }
    }
  }
};
</script>

<style scoped>
.profile_container {
  max-width: 1200px;
  margin: 40px auto;
  padding: 20px;
}

h2 {
  color: #243E36;
  margin-bottom: 30px;
  font-size: 32px;
  text-align: center;
}

h3 {
  color: #243E36;
  margin-bottom: 20px;
  font-size: 24px;
  border-bottom: 2px solid #243E36;
  padding-bottom: 10px;
}

/* User Info Section */
.profile_section {
  margin-bottom: 40px;
}

.user_info_card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.info_row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
  gap: 15px;
}

.info_row:last-child {
  border-bottom: none;
}

.edit_btn_small {
  padding: 6px 16px;
  background-color: #0d6efd;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.edit_btn_small:hover {
  background-color: #0b5ed7;
}

.profile_actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.delete_account_btn {
  padding: 10px 24px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.delete_account_btn:hover {
  background-color: #bb2d3b;
}

.return_btn {
  padding: 6px 12px;
  background-color: #ffc107;
  color: #000;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 5px;
}
.return_btn:hover {
  background-color: #e0a800;
}

.edit_email_form,
.edit_phone_form {
  padding: 20px 30px;
}

.edit_phone_form small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 12px;
}

.info_row label {
  font-weight: bold;
  color: #243E36;
  font-size: 16px;
}

.info_row span {
  color: #666;
  font-size: 16px;
}

.role_badge {
  background-color: #243E36;
  color: white;
  padding: 5px 15px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

/* Addresses Section */
.addresses_section {
  margin: 40px 0;
}

.no_addresses {
  text-align: center;
  padding: 40px;
  background-color: #f9f9f9;
  border-radius: 10px;
}

.no_addresses p {
  margin-bottom: 15px;
  color: #666;
}

.addresses_list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.address_card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.address_header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eee;
}

.address_header strong {
  color: #243E36;
  font-size: 16px;
}

.address_badges {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  text-align: center;
}

.badge.shipping {
  background-color: #d1e7dd;
  color: #0f5132;
}

.badge.billing {
  background-color: #cfe2ff;
  color: #084298;
}

.address_body p {
  margin: 5px 0;
  color: #666;
  line-height: 1.5;
}

.address_actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.edit_address_btn {
  flex: 1;
  padding: 8px 16px;
  background-color: #243E36;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.edit_address_btn:hover {
  background-color: #1a2d26;
}

.delete_address_btn {
  flex: 1;
  padding: 8px 16px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.delete_address_btn:hover {
  background-color: #c82333;
}

.add_address_btn {
  padding: 12px 24px;
  background-color: #243E36;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.add_address_btn:hover {
  background-color: #1a2d26;
}

/* Modal Styles */
.modal_overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal_content {
  background: white;
  border-radius: 10px;
  padding: 0;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.modal_header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 2px solid #eee;
}

.modal_header h3 {
  margin: 0;
  color: #243E36;
  border: none;
  padding: 0;
}

.close_btn {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #666;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.close_btn:hover {
  color: #243E36;
}

/* Form Styles */
.address_form {
  padding: 30px;
}

.form_group {
  margin-bottom: 20px;
}

.form_group label {
  display: block;
  margin-bottom: 8px;
  color: #243E36;
  font-weight: 500;
}

.form_group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  box-sizing: border-box;
}

.form_group input:focus {
  outline: none;
  border-color: #243E36;
}

.form_row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form_group_checkbox {
  margin-bottom: 15px;
}

.form_group_checkbox label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #243E36;
  cursor: pointer;
}

.form_group_checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form_actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #eee;
}

.cancel_btn {
  padding: 12px 24px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.cancel_btn:hover {
  background-color: #5a6268;
}

.submit_btn {
  padding: 12px 24px;
  background-color: #243E36;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.submit_btn:hover {
  background-color: #1a2d26;
}

/* Orders Section */
.orders_section {
  margin-top: 40px;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #666;
  font-size: 18px;
}

.no_orders {
  text-align: center;
  padding: 80px 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
}

.no_orders p {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
}

.shop_btn {
  display: inline-block;
  padding: 12px 30px;
  background-color: #243E36;
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.shop_btn:hover {
  background-color: #1a2d26;
}

.orders_list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order_card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.order_header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #eee;
}

.order_info h3 {
  color: #243E36;
  margin: 0 0 5px 0;
}

.order_date {
  color: #666;
  font-size: 14px;
}

.order_status_badge {
  padding: 6px 15px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.status_pending {
  background-color: #fff3cd;
  color: #856404;
}

.status_processing {
  background-color: #cfe2ff;
  color: #084298;
}

.status_completed {
  background-color: #d1e7dd;
  color: #0f5132;
}

.status_cancelled {
  background-color: #f8d7da;
  color: #842029;
}

.order_items {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.order_item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.order_item:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.order_item img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 5px;
}

.item_details {
  flex: 1;
}

.item_details h4 {
  margin: 0 0 5px 0;
  color: #243E36;
  font-size: 16px;
}

.item_details p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.item_total {
  font-weight: bold;
  color: #243E36;
  font-size: 18px;
}

.order_footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 2px solid #eee;
}

.order_total {
  font-size: 18px;
  color: #243E36;
}

.order_actions {
  display: flex;
  gap: 10px;
}

.cancel_btn {
  padding: 10px 20px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.cancel_btn:hover {
  background-color: #c82333;
}

.cancelled_text {
  color: #842029;
  font-weight: 500;
  font-style: italic;
}

.track_btn {
  padding: 10px 20px;
  background-color: #0d6efd;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.track_btn:hover {
  background-color: #0b5ed7;
}

@media (max-width: 768px) {
  .order_header {
    flex-direction: column;
    gap: 10px;
  }
  
  .order_item {
    flex-direction: column;
    text-align: center;
  }
  
  .order_footer {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .cancel_btn,
  .track_btn {
    width: 100%;
  }
}

.modal_body {
    padding: 20px 0;
    font-size: 16px;
    color: #555;
    text-align: center;
}

.orders_subsection {
  margin-bottom: 40px;
}

.orders_subsection h4 {
  font-size: 20px;
  color: #243E36;
  margin-bottom: 15px;
  border-bottom: 1px solid #ccc;
  padding-bottom: 5px;
}

.order_card.past_order {
  opacity: 0.8;
  background-color: #f9f9f9;
}

.completed_text {
  color: #243E36;
  font-size: 0.9rem;
  font-style: italic;
}
</style>
