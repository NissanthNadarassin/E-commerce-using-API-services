# 🔐 User Roles & Permissions Summary
## Test Accounts

### Admin Account
- **Email:** admin@example1.com
- **Password:** admin123
- **Role:** admin

### Test User Account
- **Email:** linh_3@example.com
- **Password:** user123
- **Role:** user



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
| Add reviews | ✅ Allowed | PASS (minor error) |
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
| View inventory (check quantity) | ✅ Allowed |
| Fill quantity when add product| ✅ Allowed | - |
 Warehouse distribution ✅ Allowed 
 Add/modify/delete Warehouses (warehouse management)
| View all orders | ✅ Allowed | - |



## Security Features

1. **JWT Authentication** - Token-based authentication
2. **Password Hashing** - bcryptjs with salt rounds
3. **Role-Based Access Control** - Middleware checks user roles
4. **Token Validation** - x-access-token header verification
5. **Ownership Checks** - Users can only modify their own resources


