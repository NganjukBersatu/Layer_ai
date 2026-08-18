<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const emit = defineEmits(["back-to-login"]);

const email = ref("");
const error = ref("");
const successMessage = ref("");
const isLoading = ref(false);

async function sendResetLink() {
  error.value = "";
  successMessage.value = "";

  if (!email.value.trim()) {
    error.value = t('forgotPassword.errorRequired');
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
      successMessage.value = t('forgotPassword.successSent');
    } else {
      error.value = data.message || t('forgotPassword.errorGeneric');
    }
  } catch (err) {
    console.error(err);
    error.value = t('forgotPassword.errorConnection');
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
    <h2>{{ t('forgotPassword.title') }}</h2>
    <p class="subtitle">
      {{ t('forgotPassword.subtitle') }}
    </p>

    <form @submit.prevent="sendResetLink">
      <label class="field-label" for="forgot-email">{{ t('forgotPassword.email') }}</label>
      <input
        id="forgot-email"
        v-model="email"
        type="email"
        :placeholder="t('forgotPassword.emailPlaceholder')"
        autocomplete="username"
      />

      <button type="submit" class="login-btn" :disabled="isLoading">
        {{ isLoading ? t('forgotPassword.sending') : t('forgotPassword.submit') }}
      </button>
    </form>

    <p class="error" role="alert" aria-live="polite">{{ error }}</p>
    <p class="success" role="status" aria-live="polite">{{ successMessage }}</p>

    <p class="register-row">
      <a href="#" class="link" @click.prevent="backToLogin">{{ t('forgotPassword.backToLogin') }}</a>
    </p>
  </div>
</template>

<style scoped>

.login-card {
  width: 400px;
  margin: 80px auto;
  padding: 35px;
  background: var(--bg-card);
  border-radius: 18px;
  box-shadow: 0 10px 30px var(--shadow-color);
  text-align: center;
}

.login-card h2 {
  color: var(--accent-color);
  font-size: 32px;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.5;
}

.field-label {
  display: block;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 14px 0 6px;
}

.login-card input {
  width: 100%;
  padding: 14px;
  margin: 0;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
  background: var(--bg-card);
  color: var(--text-primary);
}

.login-card input:focus {
  border-color: var(--accent-color);
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
  color: var(--text-secondary);
}

.link {
  color: var(--accent-color);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.link:hover {
  text-decoration: underline;
}
</style>
