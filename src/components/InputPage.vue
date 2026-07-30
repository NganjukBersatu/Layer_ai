<script setup>
import { ref } from "vue";

const emit = defineEmits(["next"]);

const image = ref(null);
const imagePreview = ref(null);

function chooseFile(event) {
  const file = event.target.files[0];
  if (file) {
    image.value = file;
    imagePreview.value = URL.createObjectURL(file);
  }
}
</script>

<template>
  <div class="input-card">

    <div class="card-header">
      <h2>Input</h2>

      <div class="info">
        i
      </div>
    </div>

    <label class="label">
      Upload Image
    </label>

    <label class="upload-box">

      <input
        type="file"
        @change="chooseFile"
        hidden
      >

      <div class="upload-content">

  <template v-if="!image">
    <div class="upload-icon">
      🖼️
    </div>

    <p>
      Click to upload or drag image here
    </p>
  </template>

  <template v-else>
    <img :src="imagePreview" class="preview-img" alt="preview" />
    <p>{{ image.name }}</p>
  </template>

</div>

    </label>

    <label class="label">
      AI Model
    </label>

    <div class="model-info">

      <span class="badge">
        New
      </span>

      <span>
        Advanced model provides better quality but costs more credits
      </span>

    </div>

    <select class="select-model">

      <option>Basic</option>

      <option>Advanced</option>

    </select>

    <button
  

      class="split-btn"
  @click="emit('next', { image, imagePreview })"
>
  Split Image
</button>

  </div>
</template>