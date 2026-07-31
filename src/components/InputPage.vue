<script setup>
import { ref } from "vue";

const emit = defineEmits(["next"]);

const image = ref(null);
const imagePreview = ref(null);

const selectedModel = ref("basic");

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

    <div class="model-buttons">

  <button
    class="model-btn"
    :class="{ active: selectedModel === 'basic' }"
    @click="selectedModel = 'basic'"
  >
    Basic
  </button>

  <button
    class="model-btn"
    :class="{ active: selectedModel === 'advanced' }"
    @click="selectedModel = 'advanced'"
  >
    Advanced
  </button>

</div>

    <button
  class="split-btn"
  @click="emit('next', {
    image,
    imagePreview,
    model: selectedModel
  })"
>
  Split Image
</button>

  </div>
</template>

<style scoped>

.split-btn {
  margin-top: 16px;
  /* baris-baris style lain yang sudah ada, biarkan tetap */
}

.model-buttons{
    display:flex;
    gap:12px;
    margin-top:12px;
}

.model-btn{
    flex:1;
    padding:14px;
    border:2px solid #7c3aed;
    border-radius:12px;
    background:#fff;
    color:#7c3aed;
    font-size:15px;
    font-weight:600;
    cursor:pointer;
    transition:.25s;
}

.model-btn:hover{
    background:#f5f3ff;
}

.model-btn.active{
    background:#7c3aed;
    color:#fff;
}
</style>