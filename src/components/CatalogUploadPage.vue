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
const isCategoryExpanded = ref(false);

const availableCategories = ["Anime", "Chibi", "Furry", "Kawaii", "Spy X Family", "Jujutsu Kaisen", "Naruto", "Waifu", "Husbando", "Black Butler", "Detective Conan", "Date A live", "Darling In The Franxx", "My Dress Up Darling", "Aeni", "My Hero Academia", "Demon Slayer", "Classroom Of The Elite", "Brand New Animal"];

function toggleCategoryExpanded() {
  isCategoryExpanded.value = !isCategoryExpanded.value;
}

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
          <span class="back-text">{{ t('catalogNew.back') }}</span>
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

        <!-- ===== Kategori: tombol toggle, chip baru muncul saat diklik ===== -->
        <div class="category-block">
          <button
            type="button"
            class="category-toggle-btn"
            @click="toggleCategoryExpanded"
          >
            <span>
              {{ isCategoryExpanded ? 'Sembunyikan kategori' : 'Pilih jenis kategori' }}
              <span v-if="selectedCategories.length" class="category-toggle-count">
                ({{ selectedCategories.length }})
              </span>
            </span>
            <svg
              class="category-toggle-icon"
              :class="{ rotated: isCategoryExpanded }"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div v-if="isCategoryExpanded" class="category-select">
            <button
              v-for="cat in availableCategories"
              :key="cat"
              type="button"
              :class="{ active: selectedCategories.includes(cat) }"
              @click="toggleCategory(cat)"
            >
              <svg
                v-if="selectedCategories.includes(cat)"
                class="category-check"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ t(`catalog.filter${cat.replace(/\s+/g, '')}`) }}
            </button>
          </div>
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

/* =====================================
   KATEGORI: counter + chip scrollable
===================================== */
.category-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* =====================================
   TOMBOL TOGGLE: default cuma nampilin ini,
   chip kategori baru muncul pas diklik
===================================== */
.category-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  box-sizing: border-box;
  transition: border-color 0.15s ease;
}

.category-toggle-btn:hover {
  border-color: var(--accent-color);
}

.category-toggle-count {
  color: var(--accent-color);
  font-weight: 600;
}

.category-toggle-icon {
  flex-shrink: 0;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.category-toggle-icon.rotated {
  transform: rotate(180deg);
}

/* Chip list: hanya di-render saat expanded (v-if), jadi
   otomatis 0 tinggi saat collapsed tanpa perlu max-height/scroll */
.category-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-card);
  animation: category-fade-in 0.18s ease;
}

@keyframes category-fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.category-select button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 15px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: var(--bg-accent-soft);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}

.category-select button:hover {
  border-color: var(--accent-color);
}

.category-select button:active {
  transform: scale(0.96);
}

.category-select button.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.category-check {
  flex-shrink: 0;
}

.category-empty {
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 12px 0;
  margin: 0;
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
    padding: 8px;
    font-size: 12px;
    gap: 0;
  }

  .back-text {
    display: none;
  }

  .back-icon {
    width: 13px;
    height: 13px;
  }

  .category-select button {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>