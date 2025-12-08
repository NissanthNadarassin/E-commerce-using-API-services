<template>
  <div class="user_management">
    <div class="header">
      <h1>User Management</h1>
      <div class="header_stats">
        <div class="stat_badge">
          <span class="stat_number">{{ totalUsers }}</span>
          <span class="stat_label">Total Users</span>
        </div>
        <div class="stat_badge active">
          <span class="stat_number">{{ activeUsers }}</span>
          <span class="stat_label">Active</span>
        </div>
        <div class="stat_badge blocked">
          <span class="stat_number">{{ blockedUsers }}</span>
          <span class="stat_label">Blocked</span>
        </div>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="controls">
      <div class="search_box">
        <font-awesome-icon :icon="['fas', 'search']" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search by username or email..."
        />
      </div>
      <div class="filter_buttons">
        <button 
          :class="{ active: filterStatus === 'all' }" 
          @click="filterStatus = 'all'"
        >
          All Users
        </button>
        <button 
          :class="{ active: filterStatus === 'active' }" 
          @click="filterStatus = 'active'"
        >
          Active
        </button>
        <button 
          :class="{ active: filterStatus === 'blocked' }" 
          @click="filterStatus = 'blocked'"
        >
          Blocked
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div v-if="loading" class="loading">Loading users...</div>
    
    <div v-else-if="filteredUsers.length === 0" class="no_users">
      <font-awesome-icon :icon="['fas', 'users-slash']" />
      <p>No users found</p>
    </div>

    <div v-else class="users_table_wrapper">
      <table class="users_table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id" :class="{ blocked_row: user.blocked }">
            <td>
              <div class="user_cell">
                <div class="user_avatar">
                  <font-awesome-icon :icon="['fas', 'user']" />
                </div>
                <span class="username">{{ user.username }}</span>
              </div>
            </td>
            <td class="email_cell">{{ user.email }}</td>
            <td>
              <span class="role_badge" :class="getRoleClass(user)">
                {{ getRoleName(user) }}
              </span>
            </td>
            <td>
              <span class="status_badge" :class="user.blocked ? 'blocked' : 'active'">
                {{ user.blocked ? 'Blocked' : 'Active' }}
              </span>
            </td>
            <td class="date_cell">{{ formatDate(user.createdAt) }}</td>
            <td>
              <div class="action_buttons">
                <button 
                  v-if="!user.blocked" 
                  @click="blockUser(user)" 
                  class="block_btn"
                  title="Block user"
                >
                  <font-awesome-icon :icon="['fas', 'ban']" />
                  Block
                </button>
                <button 
                  v-else 
                  @click="unblockUser(user)" 
                  class="unblock_btn"
                  title="Unblock user"
                >
                  <font-awesome-icon :icon="['fas', 'check-circle']" />
                  Unblock
                </button>
                <button 
                  @click="confirmDelete(user)" 
                  class="delete_btn"
                  title="Delete user"
                >
                  <font-awesome-icon :icon="['fas', 'trash']" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import UserService from "../services/UserService";

export default {
  name: "UserManagement",
  data() {
    return {
      users: [],
      loading: true,
      searchQuery: '',
      filterStatus: 'all', // 'all', 'active', 'blocked'
    };
  },
  computed: {
    nonAdminUsers() {
      return this.users.filter((user) => {
        const roles = user.roles || [];
        return !roles.some(role => role.name === 'admin');
      });
    },
    
    filteredUsers() {
      let filtered = this.nonAdminUsers;
      
      // Filter by status
      if (this.filterStatus === 'active') {
        filtered = filtered.filter(user => !user.blocked);
      } else if (this.filterStatus === 'blocked') {
        filtered = filtered.filter(user => user.blocked);
      }
      
      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(user => 
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      }
      
      return filtered;
    },
    
    totalUsers() {
      return this.nonAdminUsers.length;
    },
    
    activeUsers() {
      return this.nonAdminUsers.filter(user => !user.blocked).length;
    },
    
    blockedUsers() {
      return this.nonAdminUsers.filter(user => user.blocked).length;
    }
  },
  methods: {
    async fetchUsers() {
      try {
        this.loading = true;
        this.users = await UserService.getAllUsers();
      } catch (error) {
        console.error("Error fetching users:", error);
        alert('Failed to load users');
      } finally {
        this.loading = false;
      }
    },
    
    async blockUser(user) {
      if (!confirm(`Are you sure you want to block ${user.username}?`)) {
        return;
      }
      
      try {
        await UserService.blockUser(user.id);
        user.blocked = true;
        alert(`${user.username} has been blocked successfully`);
      } catch (error) {
        console.error("Error blocking user:", error);
        alert('Failed to block user');
      }
    },
    
    async unblockUser(user) {
      try {
        await UserService.unblockUser(user.id);
        user.blocked = false;
        alert(`${user.username} has been unblocked successfully`);
      } catch (error) {
        console.error("Error unblocking user:", error);
        alert('Failed to unblock user');
      }
    },
    
    async confirmDelete(user) {
      const confirmed = confirm(
        `Are you sure you want to permanently delete ${user.username}?\n\nThis action cannot be undone and will delete:\n- User account\n- All orders\n- All reviews\n- All addresses`
      );
      
      if (!confirmed) return;
      
      const doubleConfirm = confirm(`Type "${user.username}" to confirm deletion`);
      if (!doubleConfirm) return;
      
      try {
        await UserService.deleteUser(user.id);
        this.users = this.users.filter(u => u.id !== user.id);
        alert(`${user.username} has been deleted successfully`);
      } catch (error) {
        console.error("Error deleting user:", error);
        alert('Failed to delete user');
      }
    },
    
    getRoleClass(user) {
      const roles = user.roles || [];
      if (roles.some(role => role.name === 'admin')) return 'role_admin';
      return 'role_user';
    },
    
    getRoleName(user) {
      const roles = user.roles || [];
      if (roles.length === 0) return 'User';
      return roles.map(role => role.name).join(', ').toUpperCase();
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  },
  mounted() {
    this.fetchUsers();
  },
};
</script>

<style scoped>
.user_management {
  max-width: 1400px;
  margin: 40px auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

h1 {
  color: #243E36;
  font-size: 36px;
  margin: 0;
}

.header_stats {
  display: flex;
  gap: 15px;
}

.stat_badge {
  background: white;
  padding: 15px 25px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.stat_badge.active {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat_badge.blocked {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat_number {
  font-size: 28px;
  font-weight: bold;
  line-height: 1;
}

.stat_label {
  font-size: 12px;
  margin-top: 5px;
  opacity: 0.9;
}

/* Controls */
.controls {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.search_box {
  flex: 1;
  min-width: 300px;
  position: relative;
  display: flex;
  align-items: center;
}

.search_box svg {
  position: absolute;
  left: 15px;
  color: #666;
  font-size: 16px;
}

.search_box input {
  width: 100%;
  padding: 12px 15px 12px 45px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.search_box input:focus {
  outline: none;
  border-color: #243E36;
}

.filter_buttons {
  display: flex;
  gap: 10px;
}

.filter_buttons button {
  padding: 12px 20px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.filter_buttons button:hover {
  border-color: #243E36;
  background: #f8f9fa;
}

.filter_buttons button.active {
  background: #243E36;
  color: white;
  border-color: #243E36;
}

/* Table */
.loading,
.no_users {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.no_users svg {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 15px;
}

.users_table_wrapper {
  overflow-x: auto;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.users_table {
  width: 100%;
  border-collapse: collapse;
}

.users_table thead {
  background: #243E36;
  color: white;
}

.users_table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.users_table td {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.users_table tbody tr {
  transition: background-color 0.3s;
}

.users_table tbody tr:hover {
  background-color: #f8f9fa;
}

.users_table tbody tr.blocked_row {
  background-color: #fff5f5;
}

.user_cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user_avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.username {
  font-weight: 600;
  color: #243E36;
}

.email_cell {
  color: #666;
  font-size: 14px;
}

.date_cell {
  color: #666;
  font-size: 14px;
}

.role_badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
}

.role_badge.role_user {
  background: #e3f2fd;
  color: #1976d2;
}

.role_badge.role_admin {
  background: #fce4ec;
  color: #c2185b;
}

.status_badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
}

.status_badge.active {
  background: #d1e7dd;
  color: #0f5132;
}

.status_badge.blocked {
  background: #f8d7da;
  color: #842029;
}

.action_buttons {
  display: flex;
  gap: 8px;
}

.action_buttons button {
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.block_btn {
  background: #ffc107;
  color: #000;
}

.block_btn:hover {
  background: #ffb300;
  transform: translateY(-2px);
}

.unblock_btn {
  background: #28a745;
  color: white;
}

.unblock_btn:hover {
  background: #218838;
  transform: translateY(-2px);
}

.delete_btn {
  background: #dc3545;
  color: white;
  padding: 8px 12px;
}

.delete_btn:hover {
  background: #c82333;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header_stats {
    width: 100%;
    justify-content: space-between;
  }

  .controls {
    flex-direction: column;
  }

  .search_box {
    min-width: 100%;
  }

  .filter_buttons {
    width: 100%;
  }

  .filter_buttons button {
    flex: 1;
  }

  .users_table {
    font-size: 13px;
  }

  .users_table th,
  .users_table td {
    padding: 10px;
  }

  .action_buttons {
    flex-direction: column;
  }

  .action_buttons button {
    width: 100%;
  }
}
</style>