<script setup>
import { ref } from "vue";

const emit = defineEmits(["login"]);

const username = ref("");
const password = ref("");
const error = ref("");

async function login() {
  error.value = "";

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: username.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (data.success) {

  // Simpan status login
  localStorage.setItem("isLoggedIn", "true");

  // Simpan data user
  localStorage.setItem("userId", data.user.id);
  localStorage.setItem("userName", data.user.name);
  localStorage.setItem("userEmail", data.user.email);

  emit("login");

} else {
  error.value = data.message;
}

  } catch (err) {
    console.error(err);
    error.value = "Tidak dapat terhubung ke server.";
  }
}
</script>

<template>
  <div class="login-card">
    <h2>AI Layer Splitter</h2>

    <input v-model="username" type="email" placeholder="Email" />

    <input v-model="password" type="password" placeholder="Password" />

    <button @click="login">Login</button>

    <p class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.login-card {
  width: 400px;
  margin: 80px auto;
  padding: 35px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.login-card h2 {
  color: #2e2fa2;
  font-size: 36px;
  margin-bottom: 12px;
}

.login-card input {
  width: 100%;
  padding: 14px;
  margin: 12px 0;
  border: 1px solid #d6d6d6;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}

.login-card input:focus {
  border-color: #7b3ff2;
}

.login-card button {
  width: 100%;
  padding: 14px;
  margin-top: 15px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  color: white;
  font-size: 16px;
  font-weight: bold;
  background: linear-gradient(90deg, #7b3ff2, #b56eff);
  transition: 0.3s;
}

.login-card button:hover {
  transform: translateY(-2px);
}

.error {
  color: #e53935;
  margin-top: 15px;
  font-size: 14px;
}
</style>
