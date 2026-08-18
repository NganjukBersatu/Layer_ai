<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getItemById, fetchItemById, updateItem, deleteItem } from "../data/catalogStore.js";

const route = useRoute();
const router = useRouter();

const item = ref(null);
const title = ref("");
const category = ref("");
const description = ref("");

function goBackToCatalog() {
  router.push({ name: 'Catalog' });
}

onMounted(async () => {
  item.value = await fetchItemById(route.params.id);
  if (item.value) {
    title.value = item.value.name;
    category.value = item.value.category;
    description.value = item.value.description;
  }
});

async function handleUpload() {
  await updateItem(route.params.id, {
    name: title.value,
    category: category.value,
    description: description.value,
  });
  router.push({ name: 'Catalog' });
}

async function handleDelete() {
  await deleteItem(route.params.id);
  router.push({ name: 'Catalog' });
}

</script>

<template>
  <div class="detail-page" v-if="item">
    <div class="detail-image">
      <div class="detail-image">
        <button class="btn-back" @click="goBackToCatalog">← Kembali</button>
        <img :src="item.image" :alt="item.name" />
      </div>
    </div>

    <div class="detail-form">
      <label>Judul</label>
      <input v-model="title" type="text" />

      <label>Kategori</label>
      <input v-model="category" type="text" />

      <label>Deskripsi</label>
      <textarea v-model="description" rows="5"></textarea>

      <div class="detail-actions">
        <button class="btn-delete" @click="handleDelete">Hapus</button>
        <button class="btn-upload" @click="handleUpload">Upload</button>
      </div>
    </div>
  </div>

  <div v-else>
    <p>Item tidak ditemukan.</p>
  </div>
</template>

<style scoped>
.detail-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 30px 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.detail-image img {
  width: 100%;
  border-radius: 12px;
  object-fit: cover;
}

.detail-form {
  display: flex;
  flex-direction: column;
}

.detail-form label {
  font-size: 13px;
  font-weight: 600;
  margin: 12px 0 4px;
}

.detail-form input,
.detail-form textarea {
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
}

.detail-actions {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  padding: 8px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
}

.btn-delete {
  background: #fff0f0;
  color: #e04343;
  border: 1px solid #f3caca;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-upload {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

@media (max-width: 700px) {
  .detail-page {
    grid-template-columns: 1fr;
  }
}
</style>