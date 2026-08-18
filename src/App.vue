<script setup>
import { ref } from "vue";
import InputPage from "./components/InputPage.vue";
import ProcessPage from "./components/ProcessPage.vue";
import PreviewPage from "./components/PreviewPage.vue";
import LoginPage from "./components/LoginPage.vue";
import HistoryPage from "./components/HistoryPage.vue";
import ForgotPasswordPage from "./components/ForgotPasswordPage.vue";
import RegisterPage from "./components/RegisterPage.vue";
import LanguageSwitcher from "./components/LanguageSwitcher.vue";
import Navbar from "./components/Navbar.vue";
import { useI18n } from "vue-i18n";
import CatalogPage from "./components/CatalogPage.vue";

const { t } = useI18n();

const isLoggedIn = ref(
    localStorage.getItem("isLoggedIn") === "true"
);

// Halaman yang ditampilkan sebelum login: "login" | "forgot-password" | "register"
const authView = ref("login");

const currentPage = ref("catalog"); // "input" | "process" | "preview" | "history"
const historyOrigin = ref("input");
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
  authView.value = "login";
  currentPage.value = "catalog";
}

function logout() {
  isLoggedIn.value = false;

  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");

  authView.value = "login";
  currentPage.value = "input";
  selectedImage.value = null;
  selectedPreview.value = null;
  resultLayers.value = null;
}

function goToForgotPassword() {
  authView.value = "forgot-password";
}

function goToRegister() {
  authView.value = "register";
}

function backToLogin() {
  authView.value = "login";
}

function goToProcess({ image, imagePreview, model, category, userId, creditAmount }) {
  selectedImage.value = image;
  selectedPreview.value = imagePreview;
  selectedModel.value = model;
  selectedCategory.value = category || "none";
  selectedUserId.value = userId;
  selectedCreditAmount.value = creditAmount;
  currentPage.value = "process";
}

function goToPreview({ image, layers, model, category }) {
  console.log("✅ MASUK PREVIEW");
  console.log("Image:", image);
  console.log("Layers:", layers);
  console.log("Model:", model);
  console.log("Category:", category);

  selectedImage.value = image;
  resultLayers.value = layers;
  selectedModel.value = model;
  selectedCategory.value = category || selectedCategory.value || "none";
  currentPage.value = "preview";

  console.log("Current page:", currentPage.value);
}

function goBack() {
  currentPage.value = "catalog";
}

function restart() {
  selectedImage.value = null;
  selectedPreview.value = null;
  resultLayers.value = null;
  selectedCategory.value = "none";
  currentPage.value = "input";
}

function deleteResult() {
  resultLayers.value = null;
}

function goToHistory() {
  console.log("➡️ Membuka History");
  console.log("Halaman sebelumnya:", currentPage.value);

  historyOrigin.value = currentPage.value;
  currentPage.value = "history";

  console.log("Halaman sekarang:", currentPage.value);
}

function goBackFromHistory() {
  currentPage.value = historyOrigin.value;
}

</script>

<template>
  <!-- Navbar -->
  <Navbar
  @catalog="goToCatalog"
  @split="goToInput"
  @history="goToHistory"
/>

  <div class="app">

    <!-- Header -->
    <header class="hero">
      <p>{{ t('app.subtitle') }}</p>

  <div class="hero-features">
    <span class="hero-feature">⚡ {{ t('app.featureFast') }}</span>
    <span class="hero-feature">🎨 {{ t('app.featureCategory') }}</span>
    <span class="hero-feature">🤖 {{ t('app.featureAi') }}</span>
  </div>
    </header>

    <!-- Workspace -->

    <main class="workspace">

      <template v-if="!isLoggedIn">
        <Transition name="page-fade" mode="out-in">

          <LoginPage
            v-if="authView === 'login'"
            key="login"
            @login="loginSuccess"
            @forgot-password="goToForgotPassword"
            @register="goToRegister"
          />

          <ForgotPasswordPage
            v-else-if="authView === 'forgot-password'"
            key="forgot-password"
            @back-to-login="backToLogin"
          />

          <RegisterPage
            v-else-if="authView === 'register'"
            key="register"
            @back-to-login="backToLogin"
            @registered="backToLogin"
          />

        </Transition>
      </template>

      <section v-else class="left-panel">

        <!-- Halaman selain History -->
        
           <Transition name="page-fade" mode="out-in">

  <CatalogPage
    v-if="currentPage === 'catalog'"
    key="catalog"
    @split="goToInput"
    @history="goToHistory"
    @logout="logout"
  />

  <InputPage
    v-else-if="currentPage === 'input'"
    key="input"
    @next="goToProcess"
    @history="goToHistory"
    @logout="logout"
  />

  <ProcessPage
    v-else-if="currentPage === 'process'"
    key="process"
    :image="selectedImage"
    :imagePreview="selectedPreview"
    :model="selectedModel"
    :category="selectedCategory"
    :userId="selectedUserId"
    :creditAmount="selectedCreditAmount"
    @back="goBack"
    @complete="goToPreview"
  />

  <PreviewPage
    v-else-if="currentPage === 'preview'"
    key="preview"
    :image="selectedImage"
    :imagePreview="selectedPreview"
    :layers="resultLayers"
    :model="selectedModel"
    :category="selectedCategory"
    :userId="selectedUserId"
    @restart="restart"
    @delete-result="deleteResult"
    @history="goToHistory"
  />

</Transition>

        <!-- Halaman History -->
        <HistoryPage
          v-if="currentPage === 'history'"
          @back="goBackFromHistory"
        />

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
  margin-top: 16px;
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

@media (max-width: 600px) {
  .hero-features {
    gap: 8px;
    flex-wrap: nowrap;
    overflow-x: auto;
    justify-content: flex-start;
    padding: 0 4px 4px;
  }

  .hero-feature {
    font-size: 11px;
    padding: 6px 10px;
    flex-shrink: 0;
  }
}

:global([data-theme="dark"]) .hero-feature {
  background: #363954;
  border-color: #5a5e80;
  color: #d5d7e5;
}

</style>