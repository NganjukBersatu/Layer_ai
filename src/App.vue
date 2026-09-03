<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import Navbar from "./components/Navbar.vue";
import LoginModal from "./components/LoginModal.vue";
import { useI18n } from "vue-i18n";

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

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

function loginSuccess(redirectPath) {
  isLoggedIn.value = true;
  localStorage.setItem("isLoggedIn", "true");
  router.push(redirectPath || "/");
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

  router.push("/"); 
}

function resetScroll() {
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo(0, 0);
}

onMounted(() => {
  resetScroll();
  window.addEventListener('load', resetScroll);
  setTimeout(resetScroll, 100);
  setTimeout(resetScroll, 500);
});

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
    :isLoggedIn="isLoggedIn"
    @catalog="goToCatalogRoute"
    @split="goToInputRoute"
    @history="goToHistoryRoute"
    @logout="logout"
  />
  <LoginModal @login="loginSuccess" />

  <div class="app" :class="{ 'app--login': route.path === '/login' }">
    <Transition name="hero-fade">
  <header class="hero" v-if="route.path !== '/' && !route.path.startsWith('/catalog') && route.path !== ('/login') && route.path !== ('/register') && route.path !== ('/forgot-password')">
    <div class="hero-inner">
      <button
  v-if="route.path === '/split-gambar'"
  type="button"
  class="hero-back-btn"
  @click="goToCatalogRoute"
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
  <span class="hero-back-text-full">{{ t('input.backToCatalog') }}</span>
  <span class="hero-back-text-short">{{ t('history.back') }}</span>
</button>

      <p>{{ t('app.subtitle') }}</p>
      <div class="hero-features">
        <span class="hero-feature">⚡ {{ t('app.featureFast') }}</span>
        <span class="hero-feature">🎨 {{ t('app.featureCategory') }}</span>
        <span class="hero-feature">🤖 {{ t('app.featureAi') }}</span>
      </div>
    </div>
  </header>
</Transition>

       <main class="workspace">
      <section class="left-panel">
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
              @login="loginSuccess"
              @forgot-password="goToForgotPassword"
              @register="goToRegister"
              @back-to-login="backToLogin"
              @registered="backToLogin"
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
  position: relative;
}

.app--login {
  padding-top: 24px;
}

/* ===== hero (badge) tidak lagi pakai margin bawaan browser ===== */
.hero {
  margin: 0;
  padding: 0;
  text-align: center;
  position: relative;   /* tambahkan ini */
}

.hero-back-btn {
  position: absolute;
  left: 0;
  top: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.hero-back-btn:hover {
  color: var(--accent-color);
  background: var(--bg-accent-soft);
}

.hero-back-text-short {
  display: none;
}

@media (max-width: 600px) {
  .hero-back-btn {
    position: static;    /* di mobile: kembali ke alur normal, di atas paragraf */
    display: flex; 
    width: fit-content;
    margin: 0 0 8px;      /* HAPUS "auto" di kiri, ini yang bikin dia ke tengah */
  }

  .hero-back-text-full {
    display: none;
  }

  .hero-back-text-short {
    display: inline;
  }
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

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-fade-leave-active {
  position: absolute;
  left: 0;
  right: 0;
}

.hero-fade-enter-active,
.hero-fade-leave-active {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.2s ease, opacity 0.2s ease;
  overflow: hidden;
}

.hero-fade-leave-active {
  position: absolute;
  left: 0;
  right: 0;
}

.hero-fade-enter-from,
.hero-fade-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

.hero-fade-enter-to,
.hero-fade-leave-from {
  grid-template-rows: 1fr;
  opacity: 1;
}

.hero-inner {
  min-height: 0;
  overflow: hidden;
  position: relative;
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

.workspace,
.left-panel {
  position: relative;
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

@media (max-width: 600px) {
  .app {
    padding-top: 68px; /* menyesuaikan tinggi navbar versi mobile */
  }
}
</style>