# 🛒 Ecommerce Website: **Furniture Store**

A simple ecommerce platform for buying home furniture — inspired by IKEA.  
It includes role-based access with key functionalities for each user type.

---

## 👥 User Roles & Features

### 🧑‍💻 Guest
- Can browse the website and view furniture
- Cannot add products to the cart

### 👤 Registered User
- Add products to the cart
- Validate and complete purchases

### 🛠️ Admin
- Full CRUD (Create, Read, Update, Delete) for products
- Manage user roles (promote, demote, or block users)

### 🔐 Authentication
- Includes login and signup system
- Roles: **Guest**, **User**, **Admin**

---

# 🏠 Home Decoration Project Setup

This guide explains how to set up and run the frontend and backend of the Home Decoration project on your local machine.

---

## 📦 Frontend Setup

1. Open a terminal and navigate to the frontend folder:
   ```bash
   cd home_decoration_page
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. (Optional) Fix any security issues:
   ```bash
   npm audit fix
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🗄️ Backend Setup

1. Open **MySQL Workbench** (or your preferred SQL tool).

2. Create a new database:
   ```sql
   CREATE DATABASE home_decoration;
   ```

3. Open the config file located at:
   ```
   home_decoration_page/WebServer/app/config/db.js
   ```

4. Replace the following fields with your local database credentials:
   - `user`
   - `password`
   - `port`

5. In your terminal, navigate to the backend folder:
   ```bash
   cd home_decoration_page/WebServer
   ```

6. Install backend dependencies:
   ```bash
   npm install
   ```

7. (Optional) Fix any security issues:
   ```bash
   npm audit fix
   ```

8. Start the backend server:
   ```bash
   npm start
   ```

---

✅ **Your project is now running locally!**  
The frontend will be served on `http://localhost:5173` (or similar), and the backend API will be accessible based on your configured port.
