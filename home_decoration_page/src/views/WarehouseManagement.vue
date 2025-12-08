<template>
  <div class="warehouse_management">
    <h1>Warehouse Management</h1>

    <!-- Add New Warehouse Button -->
    <div class="action_bar">
      <button @click="showAddWarehouseModal = true" class="add_warehouse_btn">
        + Add New Warehouse
      </button>
    </div>

    <!-- Warehouses List -->
    <div v-if="loading" class="loading">Loading warehouses...</div>
    <div v-else-if="warehouses.length === 0" class="no_data">No warehouses found</div>
    <div v-else class="warehouses_grid">
      <div v-for="warehouse in warehouses" :key="warehouse.id" class="warehouse_card">
        <div class="warehouse_header">
          <h3>{{ warehouse.name }}</h3>
          <div class="warehouse_actions">
            <button @click="openEditModal(warehouse)" class="edit_btn" title="Edit">
              ✏️
            </button>
            <button @click="deleteWarehouse(warehouse.id)" class="delete_btn" title="Delete">
              🗑️
            </button>
          </div>
        </div>
        <div class="warehouse_details">
          <p><strong>Address:</strong> {{ warehouse.address_line1 }}</p>
          <p v-if="warehouse.address_line2"><strong>Address 2:</strong> {{ warehouse.address_line2 }}</p>
          <p><strong>City:</strong> {{ warehouse.city }}</p>
          <p><strong>Postal Code:</strong> {{ warehouse.postal_code }}</p>
          <p><strong>Country:</strong> {{ warehouse.country }}</p>
          <p><strong>Phone:</strong> {{ warehouse.phone }}</p>
        </div>
      </div>
    </div>

    <!-- Add/Edit Warehouse Modal -->
    <div v-if="showAddWarehouseModal || showEditWarehouseModal" class="modal_overlay" @click.self="closeModals">
      <div class="modal_content">
        <h2>{{ isEditMode ? 'Edit Warehouse' : 'Add New Warehouse' }}</h2>
        <form @submit.prevent="isEditMode ? updateWarehouse() : createWarehouse()">
          <div class="form_group">
            <label for="name">Warehouse Name *</label>
            <input 
              type="text" 
              id="name" 
              v-model="warehouseForm.name" 
              required 
              placeholder="e.g., Paris Main Warehouse"
            />
          </div>

          <div class="form_group">
            <label for="address1">Address Line 1 *</label>
            <input 
              type="text" 
              id="address1" 
              v-model="warehouseForm.address_line1" 
              required 
              placeholder="e.g., 123 Rue de Rivoli"
            />
          </div>

          <div class="form_group">
            <label for="address2">Address Line 2</label>
            <input 
              type="text" 
              id="address2" 
              v-model="warehouseForm.address_line2" 
              placeholder="Optional"
            />
          </div>

          <div class="form_row">
            <div class="form_group">
              <label for="city">City *</label>
              <input 
                type="text" 
                id="city" 
                v-model="warehouseForm.city" 
                required 
                placeholder="e.g., Paris"
              />
            </div>

            <div class="form_group">
              <label for="postal">Postal Code *</label>
              <input 
                type="text" 
                id="postal" 
                v-model="warehouseForm.postal_code" 
                required 
                placeholder="e.g., 75001"
              />
            </div>
          </div>

          <div class="form_row">
            <div class="form_group">
              <label for="country">Country *</label>
              <input 
                type="text" 
                id="country" 
                v-model="warehouseForm.country" 
                required 
                placeholder="e.g., France"
              />
            </div>

            <div class="form_group">
              <label for="phone">Phone *</label>
              <input 
                type="tel" 
                id="phone" 
                v-model="warehouseForm.phone" 
                required 
                placeholder="e.g., +33 1 23 45 67 89"
              />
            </div>
          </div>

          <div class="modal_actions">
            <button type="button" @click="closeModals" class="cancel_btn">Cancel</button>
            <button type="submit" class="submit_btn">
              {{ isEditMode ? 'Update Warehouse' : 'Create Warehouse' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import apiService from '../services/apiService';

export default {
  name: 'WarehouseManagement',
  data() {
    return {
      warehouses: [],
      loading: false,
      showAddWarehouseModal: false,
      showEditWarehouseModal: false,
      warehouseForm: {
        id: null,
        name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        postal_code: '',
        country: '',
        phone: ''
      }
    };
  },
  computed: {
    isEditMode() {
      return this.showEditWarehouseModal;
    }
  },
  created() {
    this.fetchWarehouses();
  },
  methods: {
    async fetchWarehouses() {
      this.loading = true;
      try {
        const token = localStorage.getItem('user');
        const response = await fetch('http://localhost:5002/api/warehouses', {
          headers: {
            'x-access-token': token
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch warehouses');
        }
        
        const data = await response.json();
        this.warehouses = data;
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        alert('Failed to load warehouses');
      } finally {
        this.loading = false;
      }
    },

    openEditModal(warehouse) {
      this.warehouseForm = {
        id: warehouse.id,
        name: warehouse.name,
        address_line1: warehouse.address_line1,
        address_line2: warehouse.address_line2 || '',
        city: warehouse.city,
        postal_code: warehouse.postal_code,
        country: warehouse.country,
        phone: warehouse.phone
      };
      this.showEditWarehouseModal = true;
    },

    closeModals() {
      this.showAddWarehouseModal = false;
      this.showEditWarehouseModal = false;
      this.resetForm();
    },

    resetForm() {
      this.warehouseForm = {
        id: null,
        name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        postal_code: '',
        country: '',
        phone: ''
      };
    },

    async createWarehouse() {
      try {
        const token = localStorage.getItem('user');
        const response = await fetch('http://localhost:5002/api/warehouses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token
          },
          body: JSON.stringify(this.warehouseForm)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to create warehouse');
        }

        alert('Warehouse created successfully!');
        this.closeModals();
        this.fetchWarehouses();
      } catch (error) {
        console.error('Error creating warehouse:', error);
        alert(error.message || 'Failed to create warehouse');
      }
    },

    async updateWarehouse() {
      try {
        const token = localStorage.getItem('user');
        const response = await fetch(`http://localhost:5002/api/warehouses/${this.warehouseForm.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token
          },
          body: JSON.stringify(this.warehouseForm)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to update warehouse');
        }

        alert('Warehouse updated successfully!');
        this.closeModals();
        this.fetchWarehouses();
      } catch (error) {
        console.error('Error updating warehouse:', error);
        alert(error.message || 'Failed to update warehouse');
      }
    },

    async deleteWarehouse(warehouseId) {
      if (!confirm('Are you sure you want to delete this warehouse? This will also remove all inventory records associated with it.')) {
        return;
      }

      try {
        const token = localStorage.getItem('user');
        const response = await fetch(`http://localhost:5002/api/warehouses/${warehouseId}`, {
          method: 'DELETE',
          headers: {
            'x-access-token': token
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete warehouse');
        }

        alert('Warehouse deleted successfully!');
        this.fetchWarehouses();
      } catch (error) {
        console.error('Error deleting warehouse:', error);
        alert(error.message || 'Failed to delete warehouse');
      }
    }
  }
};
</script>

<style scoped>
.warehouse_management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #2c3e50;
  margin-bottom: 30px;
  text-align: center;
}

.action_bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.add_warehouse_btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.add_warehouse_btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.loading, .no_data {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
}

.warehouses_grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.warehouse_card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.warehouse_card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.warehouse_header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.warehouse_header h3 {
  color: #2c3e50;
  margin: 0;
  font-size: 20px;
}

.warehouse_actions {
  display: flex;
  gap: 10px;
}

.edit_btn, .delete_btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background 0.2s;
}

.edit_btn:hover {
  background: #e3f2fd;
}

.delete_btn:hover {
  background: #ffebee;
}

.warehouse_details p {
  margin: 8px 0;
  color: #555;
  font-size: 14px;
}

.warehouse_details strong {
  color: #2c3e50;
  font-weight: 600;
}

/* Modal Styles */
.modal_overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal_content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal_content h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
}

.form_group {
  margin-bottom: 20px;
}

.form_group label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 600;
}

.form_group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form_group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form_row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.modal_actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

.cancel_btn, .submit_btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel_btn {
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #666;
}

.cancel_btn:hover {
  background: #e0e0e0;
}

.submit_btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.submit_btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .warehouses_grid {
    grid-template-columns: 1fr;
  }
  
  .form_row {
    grid-template-columns: 1fr;
  }
}
</style>
