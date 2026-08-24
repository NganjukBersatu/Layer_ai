<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const router = useRouter();

const imageFile = ref(null);
const previewUrl = ref(null);
const name = ref("");
const description = ref("");
const selectedCategories = ref([]);
const isSubmitting = ref(false);
const errorMsg = ref("");

const availableCategories = ["Anime", "Chibi", "Furry", "Kawaii", "Spy X Family", "Jujutsu Kaisen", "Naruto", "Waifu", "Husbando", "Black Butler", "Detective Conan", "Date A live", "in the Franxx", "My Dress-Up Darling", "Aeni", "My Hero Academia", "Demon Slayer", "Classroom of the Elite", "Brand New Animal"];

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

// Fungsi untuk kembali ke halaman sebelumnya / utama
function goBack() {
  router.back();
}

async function handleSubmit() {
  if (!imageFile.value || !name.value) {
    errorMsg.value = t('catalogNew.requiredFields');
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
    errorMsg.value = t('catalogNew.saveError');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="upload-page">
    <!-- Bagian Header dengan Tombol Kembali -->
    <div class="header-section">
      <button class="back-btn" @click="goBack">
          <svg class="back-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
           </svg>
       {{ t('catalogNew.back') }}
        </button>
            <h1>{{ t('catalogNew.title') }}</h1>
                </div>

    <div class="upload-form">
      <label class="file-drop" :class="{ 'has-image': previewUrl }">
        <input type="file" accept="image/*" @change="handleFileChange" hidden />
        <img v-if="previewUrl" :src="previewUrl" alt="preview" />
        <span v-else>{{ t('catalogNew.clickToChoose') }}</span>
      </label>

      <div class="form-fields">
        <input v-model="name" type="text" :placeholder="t('catalogNew.namePlaceholder')" class="text-input" />

          <textarea
            v-model="description"
              :placeholder="t('catalogNew.descriptionPlaceholder')"
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
        {{ t(`catalog.filter${cat.replace(/\s+/g, '')}`) }}
          </button>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button class="submit-btn" :disabled="isSubmitting" @click="handleSubmit">
          {{t('catalogNew.submit')}}
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

/* Style untuk Header dan Tombol Kembali */
.header-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.header-section h1 {
  margin: 0;
}

.back-btn {
  padding: 9px 16px 9px 12px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  box-shadow: 0 2px 8px var(--shadow-color);
  transition: background-color 0.2s ease, border-color 0.2s ease,
    color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.back-icon {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.back-btn:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent-color) 35%, transparent);
}

.back-btn:hover .back-icon {
  transform: translateX(-2px);
}

.back-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px var(--shadow-color);
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

textarea.text-input {
  min-height: 220px;
  resize: vertical;
  line-height: 1.5;
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

@media (max-width: 500px) {
  .upload-page {
    padding: 16px 12px 40px;
  }

  .header-section {
    gap: 10px;
    margin-bottom: 14px;
  }

  .header-section h1 {
    font-size: 19px;
  }

  .back-btn {
    padding: 6px 10px 6px 8px;
    font-size: 12px;
    gap: 5px;
  }

  .back-icon {
    width: 13px;
    height: 13px;
  }

  .category-select {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(3, auto);
    gap: 6px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
  }

  .category-select button {
    padding: 6px 12px;
    font-size: 12px;
    white-space: nowrap;
  }
}
</style>