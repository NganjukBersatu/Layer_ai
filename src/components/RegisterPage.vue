<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const emit = defineEmits(["back-to-login", "registered"]);

const name = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);

async function register() {
  error.value = "";

  if (!name.value.trim() || !email.value.trim() || !password.value.trim()) {
    error.value = t('register.errorRequired');
    return;
  }

  isLoading.value = true;

  try {
    const response = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (data.success) {
      emit("registered");
    } else {
      error.value = data.message || t('register.errorGeneric');
    }
  } catch (err) {
    console.error(err);
    error.value = t('register.errorConnection');
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
    <h2>{{ t('register.title') }}</h2>

    <form @submit.prevent="register">
      <label class="field-label" for="register-name">{{ t('register.name') }}</label>
      <input
        id="register-name"
        v-model="name"
        type="text"
        :placeholder="t('register.namePlaceholder')"
        autocomplete="name"
      />

      <label class="field-label" for="register-email">{{ t('register.email') }}</label>
      <input
        id="register-email"
        v-model="email"
        type="email"
        :placeholder="t('register.emailPlaceholder')"
        autocomplete="username"
      />

      <label class="field-label" for="register-password">{{ t('register.password') }}</label>
      <input
        id="register-password"
        v-model="password"
        type="password"
        :placeholder="t('register.passwordPlaceholder')"
        autocomplete="new-password"
      />

      <button type="submit" class="login-btn" :disabled="isLoading">
        {{ isLoading ? t('register.submitting') : t('register.submit') }}
      </button>
    </form>

    <p class="error" role="alert" aria-live="polite">{{ error }}</p>

    <p class="register-row">
      {{ t('register.haveAccount') }}
      <a href="#" class="link" @click.prevent="backToLogin">{{ t('register.loginLink') }}</a>
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
  margin-bottom: 12px;
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