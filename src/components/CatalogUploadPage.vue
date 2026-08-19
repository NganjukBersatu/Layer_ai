<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const imageFile = ref(null);
const previewUrl = ref(null);
const name = ref("");
const description = ref("");
const selectedCategories = ref([]);
const isSubmitting = ref(false);
const errorMsg = ref("");

const availableCategories = ["Anime", "Chibi", "Furry", "Kawaii", "Spy X Family", "Jujutsu Kaisen"];

function handleFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  imageFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
}

function toggleCategory(cat) {
  const idx = selectedCategories.value.indexOf(cat);
  if (idx === -1) selectedCategories.value.push(cat);
  else selectedCategories.value.splice(idx, 1);
}

async function handleSubmit() {
  if (!imageFile.value || !name.value) {
    errorMsg.value = "Gambar dan judul wajib diisi.";
    return;
  }

  isSubmitting.value = true;
  errorMsg.value = "";

  try {
    const formData = new FormData();
    formData.append("image", imageFile.value);
    formData.append("name", name.value);
    formData.append("description", description.value);
    formData.append("category", JSON.stringify(selectedCategories.value));

    const userId = localStorage.getItem("userId");
    if (userId) formData.append("user_id", userId);

    const res = await fetch("http://localhost:3000/catalog", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Gagal menyimpan");

    router.push("/");
  } catch (err) {
    errorMsg.value = "Terjadi kesalahan saat menyimpan katalog.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="upload-page">
    <h1>Tambah Katalog Baru</h1>

    <div class="upload-form">
      <label class="file-drop" :class="{ 'has-image': previewUrl }">
        <input type="file" accept="image/*" @change="handleFileChange" hidden />
        <img v-if="previewUrl" :src="previewUrl" alt="preview" />
        <span v-else>Klik untuk pilih gambar</span>
      </label>

      <div class="form-fields">
        <input v-model="name" type="text" placeholder="Judul karakter" class="text-input" />

        <textarea
          v-model="description"
          placeholder="Deskripsi singkat"
          class="text-input"
          rows="3"
        ></textarea>

        <div class="category-select">
          <button
            v-for="cat in availableCategories"
            :key="cat"
            type="button"
            :class="{ active: selectedCategories.includes(cat) }"
            @click="toggleCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button class="submit-btn" :disabled="isSubmitting" @click="handleSubmit">
          {{ isSubmitting ? "Menyimpan..." : "Simpan Katalog" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-page {
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 30px 20px 60px;
  box-sizing: border-box;
}

.upload-form {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 24px;
  margin-top: 20px;
}

.file-drop {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  width: 300px;
  min-width: 300px;
  aspect-ratio: 3 / 4;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  color: var(--text-secondary);
  background: var(--bg-card);
  text-align: center;
  font-size: 13px;
}

.file-drop.has-image {
  border-style: solid;
}

.file-drop img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.form-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.text-input {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-family: inherit;
}

.category-select {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.category-select button {
  padding: 8px 15px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
}

.category-select button.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.submit-btn {
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: var(--accent-color);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: #e53e3e;
  font-size: 13px;
}

@media (max-width: 800px) {
  .upload-form {
    flex-direction: column;
    align-items: center;
  }

  .file-drop {
    width: 240px;
    min-width: unset;
  }

  .form-fields {
    width: 100%;
  }
}
</style>