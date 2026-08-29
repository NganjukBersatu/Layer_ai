<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from 'vue-i18n'

const emit = defineEmits(["login", "forgot-password", "register"]);
const { t } = useI18n()

const username = ref("");
const password = ref("");
const error = ref("");
const showPassword = ref(false);
const isLoading = ref(false);

async function login() {
  error.value = "";

  if (!username.value.trim() || !password.value.trim()) {
    error.value = t('login.requiredFields');
    return;
  }

  isLoading.value = true;

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
  localStorage.setItem("isAdmin", data.user.is_admin ? "true" : "false");

  emit("login");

} else {
  error.value = data.message;
}

  } catch (err) {
    console.error(err);
    error.value = t('login.cannotConnect');
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  window.google.accounts.id.initialize({
    client_id: "729124027686-hm3c27lgel9p28bqjd8ntr1hbu38vjcp.apps.googleusercontent.com",
    callback: handleGoogleResponse,
  });
  window.google.accounts.id.renderButton(
    document.getElementById("google-signin-btn"),
    { theme: "outline", size: "large", width: "100%" }
  );
});

async function handleGoogleResponse(response) {
  error.value = "";
  isLoading.value = true;

  try {
    const res = await fetch("http://localhost:3000/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("isAdmin", data.user.is_admin ? "true" : "false");
      emit("login");
    } else {
      error.value = data.message;
    }
  } catch (err) {
    console.error(err);
    error.value = t("login.cannotConnect");
  } finally {
    isLoading.value = false;
  }
}

function goForgotPassword() {
  emit("forgot-password");
}

function goRegister() {
  emit("register");
}
</script>

<template>
<div class="login-page">

  <!-- Efek bintik background -->
  <div class="catalog-dots">
    <span
      v-for="n in 45"
      :key="n"
      class="catalog-dot"
      :style="{
        left: `${(n * 37) % 100}%`,
        top: `${(n * 53) % 100}%`,
        animationDelay: `${(n % 8) * 0.4}s`
      }"
    ></span>
  </div>

  <div class="login-card">

    <h2>AI Layer Splitter</h2>

    <form @submit.prevent="login">
      <label class="field-label" for="login-email">{{ $t('login.email') }}</label>
      <input
        id="login-email"
        v-model="username"
        type="email"
        :placeholder="$t('login.emailPlaceholder')"
        autocomplete="username"
      />

      <label class="field-label" for="login-password">{{ $t('login.password') }}</label>
      <div class="password-wrapper">
  <input
    id="login-password"
    v-model="password"
    :type="showPassword ? 'text' : 'password'"
    :placeholder="$t('login.passwordPlaceholder')"
    autocomplete="current-password"
  />
  <button
    type="button"
    class="toggle-password"
    :aria-label="showPassword ? $t('login.hidePassword') : $t('login.showPassword')"
    @click="showPassword = !showPassword"
  >
  
          <svg v-if="!showPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        </button>
      </div>

      <div class="forgot-password-row">
          <a href="#" class="link" @click.prevent="goForgotPassword">
            {{ $t('login.forgotPassword') }}</a>
      </div>

      <button type="submit" class="login-btn" :disabled="isLoading">
        {{ isLoading ? $t('login.loggingIn') : $t('login.title') }}
      </button>
    </form>

    <div id="google-signin-btn" class="google-btn-wrapper"></div>

    <p class="error" role="alert" aria-live="polite">{{ error }}</p>

    <p class="register-row">
      {{ $t('login.noAccount') }}
      <a href="#" class="link" @click.prevent="goRegister">
      {{ $t('login.register') }}</a>
    </p>
  </div>
</div>
</template>

<style scoped>


/* =====================================
   EFEK BINTIK BACKGROUND
===================================== */

.login-page {
  position: relative;
  width: 100vw;                        /* ← tambahan */
  margin-left: calc(-50vw + 50%);      /* ← tambahan */
  min-height: calc(100vh - 65px);
  overflow: hidden;
  box-sizing: border-box;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;
}

.catalog-dots {
  position: absolute;

  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  pointer-events: none;

  overflow: hidden;

  z-index: 1;
}

.catalog-dot {
  position: absolute;

  width: 4px;
  height: 4px;

  border-radius: 50%;

  background: rgba(99, 102, 241, 0.60);

  box-shadow:
    0 0 5px rgba(99, 102, 241, 0.35),
    0 0 10px rgba(99, 102, 241, 0.18);

  opacity: 0;

  animation: dotMove 9s linear infinite;
}

@keyframes dotMove {

  0% {
    transform: translate(-30px, 30px);
    opacity: 0;
  }

  15% {
    opacity: 0.75;
  }

  85% {
    opacity: 0.75;
  }

  100% {
    transform: translate(40px, -40px);
    opacity: 0;
  }

}

.login-card {
  position: relative;
  z-index: 10;

  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 35px;

  background: var(--bg-card);

  border-radius: 18px;

  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.08);

  text-align: center;
}

.login-card h2 {
  color: var(--accent-color);
  font-size: 36px;
  margin-bottom: 12px;
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

.login-card input:-webkit-autofill,
.login-card input:-webkit-autofill:hover,
.login-card input:-webkit-autofill:focus,
.login-card input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px var(--bg-card) inset !important;
  box-shadow: 0 0 0 1000px var(--bg-card) inset !important;
  -webkit-text-fill-color: var(--text-primary) !important;
  caret-color: var(--text-primary);
  transition: background-color 9999s ease-in-out 0s;
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  padding-right: 44px;
}

.toggle-password {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 6px;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a8a8a;
}

.toggle-password:hover {
  color: #7b3ff2;
}

.forgot-password-row {
  text-align: right;
  margin-top: 8px;
}

.link {
  color: var(--accent-color);
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
}

.link:hover {
  text-decoration: underline;
}

.login-btn {
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

.login-btn:hover {
  transform: translateY(-2px);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.google-btn-wrapper {
  margin-top: 12px;
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
  color: var(--text-secondary);
}

.register-row .link {
  font-size: 14px;
  font-weight: 600;
  margin-left: 4px;
}

@media (max-width: 480px) {
  .login-card {
    padding: 28px 22px;
    border-radius: 16px;
  }

  .login-card h2 {
    font-size: 28px;
  }
}
</style>