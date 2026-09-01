<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useI18n } from 'vue-i18n'
import { useAuthUser } from '../composables/useAuthUser.js'

const emit = defineEmits(["login", "forgot-password", "register"]);
const { t, locale } = useI18n()
const { refreshAuthUser } = useAuthUser()

const username = ref("");
const password = ref("");
const error = ref("");
const showPassword = ref(false);
const isLoading = ref(false);
const isGoogleLoading = ref(false);
const googleBtnWrapper = ref(null);
let googleResizeObserver = null;

// Map dari kode locale aplikasi ke kode bahasa yang dikenali Google
const googleLocaleMap = {
  id: "id",
  en: "en",
  ja: "ja",
  ko: "ko",
};

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
  localStorage.setItem("userPhoto", "");
  refreshAuthUser();

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

// Google menentukan bahasa tombolnya dari parameter "hl" pada URL
// script gsi/client saat pertama kali dimuat, opsi "locale" di
// renderButton saja seringkali tidak cukup. Jadi setiap kali bahasa
// aplikasi berubah, kita hapus script lama & muat ulang dengan hl baru.
function loadGoogleScript(hl) {
  return new Promise((resolve) => {
    // Hapus script gsi/client lama kalau ada
    const oldScript = document.getElementById("google-gsi-script");
    if (oldScript) oldScript.remove();

    // Reset object google supaya benar-benar diinisialisasi ulang
    if (window.google && window.google.accounts) {
      delete window.google.accounts;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = `https://accounts.google.com/gsi/client?hl=${hl}`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

async function renderGoogleButton() {
  const el = document.getElementById("google-signin-btn");
  if (!el || !googleBtnWrapper.value) return;

  const hl = googleLocaleMap[locale.value] || "en";

  await loadGoogleScript(hl);

  el.innerHTML = ""; // bersihkan tombol lama sebelum render ulang

  window.google.accounts.id.initialize({
    client_id: "729124027686-hm3c27lgel9p28bqjd8ntr1hbu38vjcp.apps.googleusercontent.com",
    callback: handleGoogleResponse,
  });

  // Tombol asli dari Google butuh lebar dalam angka piksel (bukan "100%")
  // supaya benar-benar menutupi tombol custom kita di atasnya.
  const width = Math.round(googleBtnWrapper.value.getBoundingClientRect().width);

  window.google.accounts.id.renderButton(el, {
    theme: "outline",
    size: "large",
    width: width > 0 ? width : 300,
    locale: hl,
  });
}

onMounted(() => {
  renderGoogleButton();

  // Render ulang & sesuaikan lebar tombol asli setiap kali wrapper berubah ukuran
  // (misal resize window / rotasi layar), supaya area klik tetap pas menutupi tombol custom.
  if (googleBtnWrapper.value && "ResizeObserver" in window) {
    googleResizeObserver = new ResizeObserver(() => {
      renderGoogleButton();
    });
    googleResizeObserver.observe(googleBtnWrapper.value);
  }
});

onBeforeUnmount(() => {
  if (googleResizeObserver) {
    googleResizeObserver.disconnect();
    googleResizeObserver = null;
  }
});

// Setiap kali bahasa aplikasi berubah, muat ulang script Google & render ulang tombolnya
watch(locale, () => {
  renderGoogleButton();
});

async function handleGoogleResponse(response) {
  error.value = "";
  isGoogleLoading.value = true;

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
      localStorage.setItem("userPhoto", data.user.avatar_url || "");
      refreshAuthUser();
      emit("login");
    } else {
      error.value = data.message;
    }
  } catch (err) {
    console.error(err);
    error.value = t("login.cannotConnect");
  } finally {
    isGoogleLoading.value = false;
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

    <div class="divider">
      <span>{{ $t('login.orContinueWith') }}</span>
    </div>

    <div class="google-btn-wrapper" ref="googleBtnWrapper">
      <button
        type="button"
        class="google-btn"
        :class="{ 'is-loading': isGoogleLoading }"
        :disabled="isGoogleLoading"
        tabindex="-1"
      >
        <span v-if="isGoogleLoading" class="google-spinner" aria-hidden="true"></span>
        <svg v-else class="google-icon" viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.02l7.73 6c4.51-4.18 7.09-10.36 7.09-17.49z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        <span>{{ isGoogleLoading ? $t('login.loggingIn') : $t('login.googleLogin') }}</span>
      </button>

      <!-- Tombol asli Google dirender di sini, transparan & menutupi tombol
           custom di atas, supaya popup/consent flow Google tetap resmi & aman. -->
      <div id="google-signin-btn" class="google-real-btn"></div>
    </div>

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
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  overflow: hidden;
  box-sizing: border-box;
  padding: 16px 16px 16px;
  display: flex;
  align-items: flex-start;
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

/* =====================================
   DIVIDER "atau lanjutkan dengan"
===================================== */

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 22px 0 16px;
  color: var(--text-secondary);
  font-size: 12px;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

/* =====================================
   TOMBOL GOOGLE (CUSTOM)
===================================== */

.google-btn-wrapper {
  position: relative;
  width: 100%;
  height: 48px;
}

.google-btn {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-card);

  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);

  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.google-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  border-color: var(--accent-color);
}

.google-btn:active {
  transform: translateY(0);
}

.google-btn:disabled,
.google-btn.is-loading {
  cursor: default;
  transform: none;
  opacity: 0.75;
}

.google-icon {
  flex-shrink: 0;
}

.google-spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(123, 63, 242, 0.25);
  border-top-color: #7b3ff2;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Tombol asli dari Google GSI: disembunyikan secara visual tapi tetap
   menempel persis di atas tombol custom, supaya klik & flow OAuth-nya
   tetap 100% ditangani oleh Google (aman, sesuai kebijakan mereka). */
.google-real-btn {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.001; /* bukan 0, agar tetap dianggap "visible" oleh sebagian browser/adblocker */
}

.google-real-btn :deep(iframe) {
  width: 100% !important;
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