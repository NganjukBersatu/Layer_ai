<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchItemById, updateItem, deleteItem } from "../data/catalogStore.js";

const route = useRoute();
const router = useRouter();

const item = ref(null);
const title = ref("");
const selectedCategories = ref([]);
const description = ref("");

const AVAILABLE_CATEGORIES = ["anime", "chibi", "furry", "kawaii", "spyxfamily"];

onMounted(async () => {
  item.value = await fetchItemById(route.params.id);
  if (item.value) {
    title.value = item.value.name;
    selectedCategories.value = [...(item.value.category || [])];
    description.value = item.value.description;
  }
});

function goBack() {
  router.push({ name: "CatalogDetail", params: { id: route.params.id } });
}

async function handleUpload() {
  await updateItem(route.params.id, {
    name: title.value,
    category: selectedCategories.value,
    description: description.value,
  });
  router.push({ name: "CatalogDetail", params: { id: route.params.id } });
}

async function handleDelete() {
  await deleteItem(route.params.id);
  router.push({ name: "Catalog" });
}
</script>

<template>
  <div class="edit-page" v-if="item">
    <button class="btn-back" @click="goBack">← Kembali</button>

    <div class="edit-content">
      <div class="edit-image">
        <img :src="item.image" :alt="item.name" />
      </div>

      <div class="edit-form">
        <div class="field-group">
          <label>Judul</label>
          <input v-model="title" type="text" placeholder="Judul karakter" />
        </div>

        <div class="field-group">
          <label>Kategori <span class="hint">(bisa pilih lebih dari satu)</span></label>
          <div class="category-checkboxes">
            <label
              v-for="cat in AVAILABLE_CATEGORIES"
              :key="cat"
              class="chip"
              :class="{ active: selectedCategories.includes(cat) }"
            >
              <input type="checkbox" :value="cat" v-model="selectedCategories" />
              {{ cat }}
            </label>
          </div>
        </div>

        <div class="field-group">
          <label>Deskripsi</label>
          <textarea v-model="description" rows="6" placeholder="Tulis deskripsi karakter..."></textarea>
        </div>

        <div class="edit-actions">
          <button class="btn-delete" @click="handleDelete">Hapus</button>
          <button class="btn-upload" @click="handleUpload">Simpan</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="not-found">
    <p>Item tidak ditemukan.</p>
  </div>
</template>

<style scoped>
.edit-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px 60px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 18px;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-back:hover {
  background: var(--bg-hover);
}

.edit-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: start;
}

.edit-image {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 3px 12px var(--shadow-color);
}

.edit-image img {
  width: 100%;
  display: block;
  object-fit: cover;
}

.edit-form {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 3px 12px var(--shadow-color);
}

.field-group {
  margin-bottom: 20px;
}

.field-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.field-group .hint {
  font-weight: 400;
  color: var(--text-secondary);
  font-size: 12px;
}

.edit-form input[type="text"],
.edit-form textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s ease;
}

.edit-form input[type="text"]:focus,
.edit-form textarea:focus {
  border-color: var(--accent-color);
}

.edit-form textarea {
  resize: vertical;
  line-height: 1.5;
}

.category-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}

.chip input[type="checkbox"] {
  display: none;
}

.chip.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
  font-weight: 600;
}

.chip:hover {
  border-color: var(--accent-color);
}

.edit-actions {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
}

.btn-delete {
  background: var(--bg-error-soft);
  color: #e04343;
  border: 1px solid #f3caca;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-delete:hover {
  opacity: 0.85;
}

.btn-upload {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-upload:hover {
  opacity: 0.9;
}

.not-found {
  max-width: 900px;
  margin: 60px auto;
  text-align: center;
  color: var(--text-secondary);
}

@media (max-width: 700px) {
  .edit-content {
    grid-template-columns: 1fr;
  }
}
</style>