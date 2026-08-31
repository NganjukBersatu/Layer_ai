<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import Navbar from "./components/Navbar.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const showHero = computed(() => route.path === "/split-gambar");

const isLoggedIn = ref(localStorage.getItem("isLoggedIn") === "true");

const selectedImage = ref(null);
const selectedPreview = ref(null);
const resultLayers = ref(null);
const selectedModel = ref("basic");
const selectedCategory = ref("none");
const selectedUserId = ref(null);
const selectedCreditAmount = ref(0);

function loginSuccess() {
  isLoggedIn.value = true;
  localStorage.setItem("isLoggedIn", "true");
  router.push("/");
}

function logout() {
  isLoggedIn.value = false;
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");

  selectedImage.value = null;
  selectedPreview.value = null;
  resultLayers.value = null;

  router.push("/login");
}

function goToCatalog() {
  currentPage.value = "catalog";
}

function goToInput() {
  currentPage.value = "input";
}

function goToForgotPassword() { router.push("/forgot-password"); }
function goToRegister() { router.push("/register"); }
function backToLogin() { router.push("/login"); }

function goToCatalogRoute() { router.push("/"); }
function goToInputRoute() { router.push("/split-gambar"); }
function goToHistoryRoute() { router.push("/history"); }

function goToProcess({ image, imagePreview, model, category, userId, creditAmount }) {
  selectedImage.value = image;
  selectedPreview.value = imagePreview;
  selectedModel.value = model;
  selectedCategory.value = category || "none";
  selectedUserId.value = userId;
  selectedCreditAmount.value = creditAmount;
  router.push("/process");
}

function goToPreview({ image, layers, model, category }) {
  selectedImage.value = image;
  resultLayers.value = layers;
  selectedModel.value = model;
  selectedCategory.value = category || selectedCategory.value || "none";
  router.push("/preview");
}

function goBack() { router.push("/"); }

function restart() {
  selectedImage.value = null;
  selectedPreview.value = null;
  resultLayers.value = null;
  selectedCategory.value = "none";
  router.push("/split-gambar");
}

function deleteResult() { resultLayers.value = null; }

// PENTING: fungsi ini hanya akan terpanggil kalau HistoryPage.vue
// meng-emit event bernama "back-from-history". Pastikan di HistoryPage.vue
// tombol Kembali menggunakan: emit('back-from-history'), BUKAN emit('back').
// Jika masih emit('back'), yang akan terpanggil justru goBack() di bawah,
// yang mengarah ke halaman Catalog ("/").
function goBackFromHistory() { router.push("/split-gambar"); }
</script>

<template>
  <Navbar
    v-if="!['/login', '/forgot-password', '/register'].includes(route.path)"
    @catalog="goToCatalogRoute"
    @split="goToInputRoute"
    @history="goToHistoryRoute"
    @logout="logout"
  />

  <div class="app" :class="{ 'app--login': route.path === '/login' }">
    <header class="hero" v-if="route.path !== '/' && !route.path.startsWith('/catalog') && route.path !== '/login'">
      <p>{{ t('app.subtitle') }}</p>
      <div class="hero-features">
        <span class="hero-feature">⚡ {{ t('app.featureFast') }}</span>
        <span class="hero-feature">🎨 {{ t('app.featureCategory') }}</span>
        <span class="hero-feature">🤖 {{ t('app.featureAi') }}</span>
      </div>
    </header>

    <main class="workspace">
      <template v-if="!isLoggedIn">
        <router-view v-slot="{ Component }">
          <Transition name="page-fade" mode="out-in">
            <component
              :is="Component"
              @login="loginSuccess"
              @forgot-password="goToForgotPassword"
              @register="goToRegister"
              @back-to-login="backToLogin"
              @registered="backToLogin"
            />
          </Transition>
        </router-view>
      </template>

      <section v-else class="left-panel">
        <router-view v-slot="{ Component, route }">
          <Transition name="page-fade" mode="out-in">
            <component
              :is="Component"
              :key="route.fullPath"
              :image="selectedImage"
              :imagePreview="selectedPreview"
              :layers="resultLayers"
              :model="selectedModel"
              :category="selectedCategory"
              :userId="selectedUserId"
              :creditAmount="selectedCreditAmount"
              @split="goToInputRoute"
              @history="goToHistoryRoute"
              @logout="logout"
              @next="goToProcess"
              @back="goBack"
              @complete="goToPreview"
              @restart="restart"
              @delete-result="deleteResult"
              @back-from-history="goBackFromHistory"
            />
          </Transition>
        </router-view>
      </section>
    </main>
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
}

#app {
  margin: 0;
  padding: 0;
}

/* ===== Variabel Tema (Light & Dark) ===== */
:root {
  --bg-primary: #f5f6fa;
  --bg-card: #ffffff;
  --bg-hover: #f4f3ff;
  --text-primary: #25283a;
  --text-secondary: #6b7280;
  --border-color: #e2e5f0;
  --accent-color: #4f46e5;
  --shadow-color: rgba(30, 35, 60, 0.08);
  --bg-accent-soft: #ede9fe;
  --bg-error-soft: #fee2e2;
}

[data-theme="dark"] {
  --bg-primary: #14151f;
  --bg-card: #1e2030;
  --bg-hover: #2a2c3f;
  --text-primary: #f0f0f5;
  --text-secondary: #9ca3af;
  --border-color: #33354a;
  --accent-color: #8b7cf6;
  --shadow-color: rgba(0, 0, 0, 0.4);
  --bg-accent-soft: #352b5c;
  --bg-error-soft: #4a2020;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.2s ease, color 0.2s ease;
}

html {
  background: var(--bg-primary);
}

.app {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.2s ease, color 0.2s ease;
  padding-top: 125px;
}

.app--login {
  padding-top: 24px;
}

/* ===== hero (badge) tidak lagi pakai margin bawaan browser ===== */
.hero {
  margin: 0;
  padding: 0;
  text-align: center;
}

.hero p {
  margin: 0 0 4px;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.hero-features {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 8px;
  margin-bottom: 0;
  flex-wrap: wrap;
}

.hero-feature {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 7px 14px;
  border-radius: 999px;
}

/* ===== PERBAIKAN: badge di mobile sekarang wrap ke baris baru,
   bukan di-scroll horizontal, jadi tidak ada lagi yang terpotong ===== */
@media (max-width: 600px) {
  .hero-features {
    gap: 4px;
    flex-wrap: nowrap;
    overflow-x: visible;
    justify-content: center;
    padding: 0 4px;
  }

  .hero-feature {
    font-size: 9px;
    padding: 4px 6px;
    gap: 3px;
    flex-shrink: 1;
    white-space: nowrap;
  }
}

:global([data-theme="dark"]) .hero-feature {
  background: #363954;
  border-color: #5a5e80;
  color: #d5d7e5;
}

</style>