<template>
  <div class="auth-container">
    <h1>Login</h1>
    <form class="auth-form" @submit.prevent="loginUser">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="auth-input"
        required
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="auth-input"
        required
      />
      <button type="submit" class="auth-button">Login</button>
    </form>
  </div>
</template>

<script>
import apiClient from "../services/apiService";

export default {
  data() {
    return {
      email: "",
      password: "",
    };
  },
  methods: {
    async loginUser() {
      try {
        const response = await apiClient.post("/api/auth/signin", {
          email: this.email,
          password: this.password,
        });

        const { accessToken, role, username, blocked } = response.data;
        if (blocked) {
          alert(`${username}, your account has been blocked by the admin.`);
          // Treat as a guest, even after logging in
          localStorage.setItem("role", "guest");
        } else {
            // Store user details in localStorage
            localStorage.setItem("user", accessToken);
            localStorage.setItem("role", role); // Set role dynamically
            localStorage.setItem("userName", username);

        alert("Login successful!");
        }
        location.reload(); // Reload the page to reflect role-based UI changes
        this.$router.push("/"); // Redirect to home page
      } catch (error) {
        console.error("Login failed:", error.response?.data?.message || error.message);
        alert(error.response?.data?.message || "Login failed!");
      }
    },
  },
};
</script>
  
  <style scoped>
  .auth-container {
    width: 100%;
    max-width: 500px;
    margin: 50px auto;
    text-align: center;
    font-family: "Montserrat", sans-serif;
  }
  
  .auth-container h1 {
    font-size: 2rem;
    color: #243e36;
    margin-bottom: 20px;
  }
  
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .auth-input {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1rem;
  }
  
  .auth-button {
    background-color: #243e36;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 10px 15px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease-in-out;
  }
  
  .auth-button:hover {
    background-color: white;
    color: #243e36;
    border: 1px solid #243e36;
  }
  </style>
  
  