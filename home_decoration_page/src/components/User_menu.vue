<template>
  <nav class="menu">
    <div class="menu_pages">
      <div class="menu_pages__links">
        <!-- Common Links for All Roles -->
        <router-link to="/" class="routers">Home</router-link>

        <!-- Admin-Specific Links -->
        <router-link v-if="role === 'admin'" to="/admin" class="routers">Dashboard</router-link>
        <router-link v-if="role === 'admin'" to="/products" class="routers">Product Management</router-link>
        <router-link v-if="role === 'admin'" to="/warehouses" class="routers">Warehouse Management</router-link>
        <router-link v-if="role === 'admin'" to="/users" class="routers">User Management</router-link>

        <!-- User-Specific Links -->
        <router-link v-if="role === 'user'" to="/storage" class="routers">Storage</router-link>
        <router-link v-if="role === 'user'" to="/furniture" class="routers">Furniture</router-link>
        <router-link v-if="role === 'user'" to="/beds" class="routers">Beds</router-link>
        <router-link v-if="role === 'user'" to="/decoration" class="routers">Decoration</router-link>
      </div>
    </div>

    <div class="menu_right_section">
      <!-- Cart Section for Users -->
      <template v-if="role === 'user'">
        <router-link to="/cart" class="cart">
          <div class="items_menu">
            <font-awesome-icon :icon="['fas', 'cart-shopping']" />
            <p>Cart</p>
          </div>
        </router-link>
        <div class="items_menu">
          {{ number_Cart_Items }} <p>Items</p>
        </div>
        <div class="items_menu">
          {{ totalPrice }}€ <p>Total Amount</p>
        </div>
      </template>

      <!-- Authentication Section -->
      <div class="right_section__buttons">
        <!-- Guest -->
        <div v-if="role === 'guest'" class="right_section__buttons_box">
          <button @click="goToLogin">Login</button>
          <button @click="goToRegister">Register</button>
        </div>
        <!-- User and Admin -->
        <div v-else class="user_logged_buttons">
          <router-link to="/profile" class="profile_icon_link">
            <font-awesome-icon :icon="['fas', 'user']" />
          </router-link>
          <span>{{ userName }}</span>
          <button @click.prevent="logout">Logout</button>
        </div>
      </div>
    </div>
  </nav>
  <div class="space"></div>
</template>

<script>
export default {
  name: "User_menu",
  props: {
    number_Cart_Items: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      default: 0.0,
    },
  },
  data() {
  const token = localStorage.getItem("user");
  let role = "guest";
  let blocked = false;
  let userName = "";

  if (token) {
    try {
      const user = JSON.parse(atob(token.split(".")[1])); // Decode the token
      console.log("Decoded token:", user); // Debug log
      blocked = user.blocked || false; // Check if the user is blocked
      role = blocked ? "guest" : user.roles.includes("admin") ? "admin" : "user";
      userName = localStorage.getItem("userName") || "";
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem("user");
    }
  }

  return {
    role: role, // Set the role based on the token
    userName: localStorage.getItem("userName") || "", // Get username from localStorage
  };
},
  methods: {
    giverole() {
      console.log("Primary role:", this.role);
    },
    goToLogin() {
      this.$router.push("/login"); // Navigate to Login page
    },
    goToRegister() {
      this.$router.push("/register"); // Navigate to Register page
    },
    logout() {
      localStorage.removeItem("user"); // Remove user data
      localStorage.removeItem("role");
      localStorage.removeItem("userName");
      this.role = "guest"; // Reset role to guest
      this.userName = ""; // Clear user name
      this.$router.push("/"); // Redirect to Home
      location.reload(); // Reload the page for immediate UI update
    },
  },
};
</script>



<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: "Montserrat";
  list-style: none;
}

.menu {
  width: 100%;
  position: fixed;
  height: 60px;
  display: flex;
  background-color: #f0e9d7;
  font-size: large;
  z-index: 1000;
}

.space {
  height: 60px;
}

.menu_pages,
.menu_right_section {
  display: flex;
  align-items: center;
  gap: 5px;
}

.menu_pages {
  width: 60%;
  justify-content: center;
  margin: 5px;
}

.menu_right_section {
  justify-content: center;
  width: 40%;
}

.menu_pages__links {
  width: 100%;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  list-style: none;
  gap: 5px;
}

.routers {
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 70%;
  border-radius: 20px;
  color: black;
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
  text-decoration: none;
}

.routers:hover, .right_section__buttons>button:hover {
    color: #243E36;
    background-color: white;
    border-bottom: 1px solid #243E36;
    cursor: pointer;
}

.right_section__buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.right_section__buttons button {
  background-color: #243e36;
  border: 1px solid #243e36;
  color: white;
  border-radius: 20px;
  padding: 7px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease-in-out;
}

.right_section__buttons button:hover {
  background-color: white;
  color: #243e36;
  border: 1px solid #243e36;
}

.right_section__buttons span {
  font-weight: bold;
  color: #243e36;
}

.items_menu {
  text-align: center;
  padding: 8px;
  border-radius: 10px;
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
}

.items_menu p {
  font-size: small;
}

.items_menu:hover {
  background: white;
}

.cart {
  border-radius: 10px;
  text-decoration: none;
  color: black;
}


.user_logged_buttons{
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile_icon_link {
  display: flex;
  align-items: center;
  color: #243e36;
  font-size: 20px;
  transition: color 0.3s;
}

.profile_icon_link:hover {
  color: #1a2d26;
}

.right_section__buttons_box{
  display: flex;
  gap: 10px
}
@media (max-width: 800px) {
  .menu {
    flex-direction: column;
    align-items: center;
    height: 100px;
  }
  .space {
    height: 100px;
  }

  .menu_pages__links,
  .menu_right_section ul {
    justify-content: center;
    gap: 15px;
  }

  .right_section__buttons {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }
  .routers {
    padding-left: 5px;
    padding-right: 5px;
  }
  
}
</style>
