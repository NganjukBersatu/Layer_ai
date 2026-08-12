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

const isLoggedIn = ref(
    localStorage.getItem("isLoggedIn") === "true"
);

// Halaman yang ditampilkan sebelum login: "login" | "forgot-password" | "register"
const authView = ref("login");

const currentPage = ref("input"); // "input" | "process" | "preview" | "history"
const historyOrigin = ref("input");
const selectedImage = ref(null);
const selectedPreview = ref(null);
const resultLayers = ref(null);
const selectedModel = ref("basic");

const selectedUserId = ref(null);
const selectedCreditAmount = ref(0);

function loginSuccess() {
  isLoggedIn.value = true;
  localStorage.setItem("isLoggedIn", "true");
  authView.value = "login"; // reset untuk sesi berikutnya (setelah logout)
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

function goToProcess({ image, imagePreview, model, userId, creditAmount }) {
  selectedImage.value = image;
  selectedPreview.value = imagePreview;
  selectedModel.value = model;
  selectedUserId.value = userId;
  selectedCreditAmount.value = creditAmount;
  currentPage.value = "process";
}

function goToPreview({ image, layers, model }) {
  console.log("✅ MASUK PREVIEW");
  console.log("Image:", image);
  console.log("Layers:", layers);
  console.log("Model:", model);

  selectedImage.value = image;
  resultLayers.value = layers;
  selectedModel.value = model;
  currentPage.value = "preview";

  console.log("Current page:", currentPage.value);
}

function goBack() {
  currentPage.value = "input";
}

function restart() {
  selectedImage.value = null;
  selectedPreview.value = null;
  resultLayers.value = null;
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
  <div class="app">

    <LanguageSwitcher />

    <!-- Header -->
    <header class="hero">
      <h1>AI Layer Splitter</h1>
      <p>
        Split your images into separate layers with AI.
        Upload a single image and generate animation-ready layers instantly.
      </p>
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

    <InputPage
      v-if="currentPage === 'input'"
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
</style>