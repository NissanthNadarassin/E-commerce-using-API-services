<template>
  <div class="auth-container">
    <h1>Register</h1>
    <form class="auth-form" @submit.prevent="registerUser">
      <input
        v-model="username"
        type="text"
        placeholder="Username"
        class="auth-input"
        required
      />
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
      <button type="submit" class="auth-button">Register</button>
    </form>
  </div>
</template>

<script>
import apiClient from "../services/apiService";

export default {
  data() {
    return {
      username: "",
      email: "",
      password: "",
    };
  },
  methods: {
    async registerUser() {
      try {
        const response = await apiClient.post("/api/auth/signup", {
          username: this.username,
          email: this.email,
          password: this.password,
        });
        alert("User registered successfully! You can now log in.");
        this.$router.push("/login"); // Redirect to login page
      } catch (error) {
        console.error("Registration failed:", error.response?.data?.message || error.message);
        alert(error.response?.data?.message || "Registration failed!");
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
  