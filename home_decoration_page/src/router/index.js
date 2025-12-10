import { createRouter, createWebHistory } from 'vue-router'
import Home from "../views/Home.vue";
import Beds from '../views/Beds.vue';
import Decoration from '../views/Decoration.vue';
import Furniture from '../views/Furniture.vue';
import Storage from '../views/Storage.vue';
import Cart from '../views/Cart.vue';
import Individual_product from '../views/Individual_product.vue';
import Registry from "../views/Registry.vue";
import Login from "../views/Login.vue";
import ProductManagement from "../views/ProductManagement.vue";
import UserManagement from "../views/UserManagement.vue";
import WarehouseManagement from "../views/WarehouseManagement.vue";
import Orders from "../views/Orders.vue";
import AdminDashboard from "../views/AdminDashboard.vue";
import Checkout from "../views/Checkout.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/beds",
    name: "Beds",
    component: Beds,
  },
  {
    path: "/decoration",
    name: "Decoration",
    component: Decoration,
  },
  {
    path: "/furniture",
    name: "Furniture",
    component: Furniture,
  },
  {
    path: "/storage",
    name: "Storage",
    component: Storage,
  },
  {
    path: "/cart",
    name: "Cart",
    component: Cart,
    meta: { requiresAuth: true },
  },
  {
    path: "/checkout",
    name: "Checkout",
    component: Checkout,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "UserProfile",
    component: Orders,
    meta: { requiresAuth: true },
  },
  {
    path: "/product/:id",
    name: "Individual_product",
    component: Individual_product,
    props: true,
    // No auth required - public can view product details
  },
  {
    path: "/register",
    name: "Register",
    component: Registry,
    meta: { guest: true }, // Mark as accessible to guests only
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { guest: true }, // Mark as accessible to guests only
  },
  {
    path: "/products",
    name: "ProductManagement",
    component: ProductManagement,
    meta: { requiresAuth: true, role: "admin" }, // Restricted to admin
  },
  {
    path: "/users",
    name: "UserManagement",
    component: UserManagement,
    meta: { requiresAuth: true, role: "admin" }, // Restricted to admin
  },
  {
    path: "/warehouses",
    name: "WarehouseManagement",
    component: WarehouseManagement,
    meta: { requiresAuth: true, role: "admin" }, // Restricted to admin
  },
  {
    path: "/admin",
    name: "AdminDashboard",
    component: AdminDashboard,
    meta: { requiresAuth: true, role: "admin" }, // Restricted to admin
  },
  {
    path: "/track-delivery/:id",
    name: "DeliveryTracking",
    component: () => import("../views/DeliveryTracking.vue"),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 };
  }
});

// Route Guards
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("user");

  let user = null;
  if (token) {
    try {
      user = JSON.parse(atob(token.split(".")[1])); // Decode the token to extract user data
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("user");
      return next("/login"); // Redirect to login if token is invalid
    }
  }

  // If route requires authentication
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!token) {
      return next("/login"); // Redirect to login if not authenticated
    }

    if (to.meta.role && user && user.roles) {
      const hasRole = user.roles.includes(to.meta.role);
      if (!hasRole) {
        return next("/"); // Redirect to home if the user lacks the required role
      }
    }
    return next();
  }

  // If route is for guests only
  if (to.matched.some((record) => record.meta.guest)) {
    if (token) {
      return next("/"); // Redirect to home if already authenticated
    }
    return next();
  }

  next(); // Allow navigation if no guard is triggered
});

export default router;
