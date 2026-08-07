<script setup>
import { ref } from "vue";

const emit = defineEmits(["back-to-login"]);

const email = ref("");
const error = ref("");
const successMessage = ref("");
const isLoading = ref(false);

async function sendResetLink() {
  error.value = "";
  successMessage.value = "";

  if (!email.value.trim()) {
    error.value = "Email wajib diisi.";
    return;
  }

  isLoading.value = true;

  try {
    const response = await fetch("http://localhost:3000/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.value }),
    });

    const data = await response.json();

    if (data.success) {
      successMessage.value = "Link reset password sudah dikirim ke email kamu.";
    } else {
      error.value = data.message || "Gagal mengirim link reset password.";
    }
  } catch (err) {
    console.error(err);
    error.value = "Tidak dapat terhubung ke server.";
  } finally {
    isLoading.value = false;
  }
}

function backToLogin() {
  emit("back-to-login");
}
</script>

<template>
  <div class="login-card">
    <h2>Lupa password</h2>
    <p class="subtitle">
      Masukkan email kamu, kami akan kirim link untuk reset password.
    </p>

    <form @submit.prevent="sendResetLink">
      <label class="field-label" for="forgot-email">Email</label>
      <input
        id="forgot-email"
        v-model="email"
        type="email"
        placeholder="nama@email.com"
        autocomplete="username"
      />

      <button type="submit" class="login-btn" :disabled="isLoading">
        {{ isLoading ? "Mengirim..." : "Kirim link reset" }}
      </button>
    </form>

    <p class="error" role="alert" aria-live="polite">{{ error }}</p>
    <p class="success" role="status" aria-live="polite">{{ successMessage }}</p>

    <p class="register-row">
      <a href="#" class="link" @click.prevent="backToLogin">Kembali ke login</a>
    </p>
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
  font-size: 32px;
  margin-bottom: 8px;
}

.subtitle {
  color: #6b6b6b;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.5;
}

.field-label {
  display: block;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #4b4b4b;
  margin: 14px 0 6px;
}

.login-card input {
  width: 100%;
  padding: 14px;
  margin: 0;
  border: 1px solid #d6d6d6;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}

.login-card input:focus {
  border-color: #7b3ff2;
}

.login-btn {
  width: 100%;
  padding: 14px;
  margin-top: 20px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  color: white;
  font-size: 16px;
  font-weight: bold;
  background: linear-gradient(90deg, #7b3ff2, #b56eff);
  transition: 0.3s;
}

.login-btn:hover {
  transform: translateY(-2px);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.error {
  color: #e53935;
  margin-top: 15px;
  font-size: 14px;
  min-height: 18px;
}

.success {
  color: #16a34a;
  margin-top: 4px;
  font-size: 14px;
}

.register-row {
  margin-top: 18px;
  font-size: 14px;
  color: #555;
}

.link {
  color: #7b3ff2;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.link:hover {
  text-decoration: underline;
}
</style>