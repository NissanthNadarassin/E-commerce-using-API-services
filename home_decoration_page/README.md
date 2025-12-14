# Home Decoration E-commerce Platform

## Project Summary
A comprehensive full-stack e-commerce solution built with **Vue 3 (Vite)** for the frontend and **Node.js/Express** for the backend. This project simulates a real-world shopping experience, featuring role-based authentication, product catalog management, shopping cart functionality, and an advanced **Delivery Tracking System** powered by GraphQL and external mapping APIs.

---

## 🚀 Quick Start Requirements

### Frontend (`/`)
- **Framework**: Vue 3 + Vite
- **Maps**: Leaflet (OpenStreetMap)
- **State/Auth**: Axios, JWT

### Backend (`/WebServer`)
- **Server**: Express.js
- **Database**: Sequelize (MySQL/SQLite)
- **API**: REST + GraphQL
- **Security**: Helmet, Rate Limit, XSS-Clean

### Installation
1. **Frontend**:
   ```bash
   npm install
   npm run dev
   ```
2. **Backend**:
   ```bash
   cd WebServer
   npm install
   npm start
   ```

---

## 🛠 Features & API Technology

### 🤖 Smart Features
- **Recommendation System**: Personalized "Recommended for You" section based on user behavior and product categories.
- **Payment Validation**: Implements the **Luhn Algorithm** to validate credit card numbers during checkout, ensuring data integrity before processing.

### 🛠 Admin Dashboard
A powerful management interface for administrators (`admin` role):
- **User Management**:
    - View all registered users.
    - **Block/Unblock** access.
    - **Delete** users permanently.
- **Product Management (CRUD)**:
    - **Create**, **Read**, **Update**, and **Delete** products.
    - Manage stock levels and inventory across different warehouses.
- **Warehouse Management (CRUD)**:
    - Add new warehouse locations.
    - Modify existing warehouse details.
    - Remove warehouses from the logistics network.

### 📡 GraphQL API
We utilize GraphQL for complex data retrieval, specifically for the **Order Tracking** feature.
- **Endpoint**: `/graphql`
- **Capabilities**:
    - **Single Order Query**: Efficiently fetches order details, delivery status, timeline, and allocation data in a single request.
    - **Schema**: Strongly typed schema defining `Order`, `User`, `DeliveryInfo`, and `TimelineEvent`.
    - **Loaders**: Implements `DataLoader` to batch and cache database requests, preventing N+1 query performance issues.

### 🛡 Security
The application implements multiple layers of security:
1. **JWT Authentication**: Stateless, token-based authentication verified on protected routes.
2. **Role-Based Access Control (RBAC)**: Middleware ensures granular permissions (User vs. Admin).
3. **Password Hashing**: User passwords are securely hashed using `bcryptjs`.
4. **Helmet**: Sets secure HTTP headers to protect against common web vulnerabilities.
5. **Rate Limiting**: Protects against brute-force attacks and DDOS by limiting repeated requests.
6. **XSS Protection**: Sanitizes input to prevent Cross-Site Scripting attacks.

### 🚚 Tracking (External APIs)
The Delivery Tracking feature mimics real-world logistics:
- **Nominatim (OpenStreetMap)**: Used for geocoding addresses (converting "Paris" to coordinates).
- **OSRM (Open Source Routing Machine)**: Calculates accurate travel routes and estimated time of arrival (ETA) for delivery trucks in real-time.
- **Leaflet**: Renders interactive maps with live truck movement simulation.

---

## ⚙️ Configuration

### Environment Variables
Before running the project, ensure you have configured your environment variables.
1. Create a `.env` file in `WebServer/` (copy from `.env.example` if available).
2. Update the following credentials to match your local database:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=home_decoration_db
   ```

### Simulation Timings (Demo vs Real Life)
You can toggle between **Demo Mode** (minutes) and **Real Life Mode** (hours) for order status progression.

1. Open `WebServer/app/controllers/orderController.js` and `WebServer/app/services/orderService.js`.
2. Locate the line:
   ```javascript
   const USE_DEMO_TIMINGS = true; // or false
   ```
3. Set to `true` for **Demo Mode** (fast testing):
   - Preparation: ~1-3 minutes
   - Travel: ~2 minutes
   - Completion: 1 minute after delivery
4. Set to `false` for **Real Life Mode** (realistic):
   - Preparation: 2-4 hours (08:00 - 19:00 window)
   - Travel: Real driving time via OSRM.
   - Delivery Window: 08:00 - 16:00 (Weekdays only)
   - Completion: 1 hour after delivery

> **Note**: After changing this file, you must **restart the backend server** (`npm start`) for changes to take effect.

---

## 🔐 User Roles & Permissions Summary

### Test Accounts

#### Admin Account
- **Email:** admin@example1.com
- **Password:** admin123
- **Role:** admin

#### Test User Account
**(See `WebServer/seedUsers.js` for more)**
- **Email:** john.doe@example.com (and others)
- **Password:** user123

### 1. **PUBLIC** (No Authentication)
| Feature | Permission | Status |
|---------|-----------|---------|
| View products | ✅ Allowed | PASS |
| View product details | ✅ Allowed | PASS |
| View reviews | ✅ Allowed | PASS |
| Register account | ✅ Allowed | - |
| Login | ✅ Allowed | - |

### 2. **USER** Role (Authenticated User)
| Feature | Permission | Status |
|---------|-----------|---------|
| Login | ✅ Allowed | PASS |
| Update own profile | ✅ Allowed | PASS |
| Delete own account | ✅ Allowed | - |
| Create orders | ✅ Allowed | PASS |
| View own orders | ✅ Allowed | - |
| Cancel own orders | ✅ Allowed | - |
| Add reviews | ✅ Allowed | PASS |
| Delete own reviews | ✅ Allowed | - |

### 3. **ADMIN** Role (Administrator)
| Feature | Permission | Status |
|---------|-----------|---------|
| View all users | ✅ Allowed | PASS (6 users) |
| Delete any user | ✅ Allowed | - |
| Block/unblock users | ✅ Allowed | - |
| Create products | ✅ Allowed | - |
| Update products | ✅ Allowed | - |
| Delete products | ✅ Allowed | - |
| View inventory | ✅ Allowed | - |
| Manage Warehouses | ✅ Allowed | - |
| View all orders | ✅ Allowed | - |
