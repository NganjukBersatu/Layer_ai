<script setup>
import { ref } from "vue";
import InputPage from "./components/InputPage.vue";
import ProcessPage from "./components/ProcessPage.vue";
import PreviewPage from "./components/PreviewPage.vue";

const currentPage = ref("input"); // "input" | "process" | "preview"
const selectedImage = ref(null);
const selectedPreview = ref(null);
const resultLayers = ref(null);

function goToProcess({ image, imagePreview }) {
  selectedImage.value = image;
  selectedPreview.value = imagePreview;
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
          @back="goBack"
          @complete="goToPreview"
        />

        <PreviewPage
          v-else-if="currentPage === 'preview'"
          :image="selectedImage"
          :imagePreview="selectedPreview"
          :layers="resultLayers"
          @restart="restart"
        />
      </section>

    </main>
  </div>
</template>