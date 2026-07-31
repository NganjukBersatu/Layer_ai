<script setup>
import { ref } from "vue";
import InputPage from "./components/InputPage.vue";
import ProcessPage from "./components/ProcessPage.vue";
import PreviewPage from "./components/PreviewPage.vue";
import LoginPage from "./components/LoginPage.vue";

const currentPage = ref("input"); // "input" | "process" | "preview"
const selectedImage = ref(null);
const selectedPreview = ref(null);
const resultLayers = ref(null);
const selectedModel = ref("basic");

function goToProcess({ image, imagePreview, model }) {
  selectedImage.value = image;
  selectedPreview.value = imagePreview;
  selectedModel.value = model;
  currentPage.value = "process";
}

function goToPreview({ image, layers }) {
  selectedImage.value = image;
  resultLayers.value = layers;
  currentPage.value = "preview";
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

</script>

<template>
  <div class="app">

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

      <!-- Left -->
      <section class="left-panel">
        <InputPage
          v-if="currentPage === 'input'"
          @next="goToProcess"
        />

        <ProcessPage
  v-else-if="currentPage === 'process'"
  :image="selectedImage"
  :imagePreview="selectedPreview"
  :model="selectedModel"
  @back="goBack"
  @complete="goToPreview"
/>

        <PreviewPage
  v-else-if="currentPage === 'preview'"
  :image="selectedImage"
  :imagePreview="selectedPreview"
  :layers="resultLayers"
  @restart="restart"
  @delete-result="deleteResult"
/>
      </section>

    </main>
  </div>
</template>