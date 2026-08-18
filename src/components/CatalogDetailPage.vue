<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchItemById } from "../data/catalogStore.js";

const route = useRoute();
const router = useRouter();

const item = ref(null);
const isAdmin = computed(() => localStorage.getItem("isAdmin") === "true");

onMounted(async () => {
  item.value = await fetchItemById(route.params.id);
});

function goBackToCatalog() {
  router.push({ name: "Catalog" });
}

function goToEdit() {
  router.push({ name: "CatalogEdit", params: { id: route.params.id } });
}
</script>

<template>
  <div class="description-page" v-if="item">
    <button class="btn-back" @click="goBackToCatalog">← Kembali</button>

    <div class="description-content">
      <div class="description-image">
        <img :src="item.image" :alt="item.name" />
      </div>

      <div class="description-info">
        <h1>{{ item.name }}</h1>

        <div class="category-tags">
          <span v-for="cat in item.category" :key="cat" class="tag">{{ cat }}</span>
        </div>

        <p class="description-text">{{ item.description || 'Belum ada deskripsi.' }}</p>

        <button v-if="isAdmin" class="btn-edit" @click="goToEdit">Edit</button>
      </div>
    </div>
  </div>

  <div v-else>
    <p>Item tidak ditemukan.</p>
  </div>
</template>

<style scoped>
.description-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 30px 20px;
}
.btn-back {
  margin-bottom: 16px;
  padding: 8px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
}
.description-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.description-image img {
  width: 100%;
  border-radius: 12px;
  object-fit: cover;
}
.description-info h1 {
  margin: 0 0 10px;
}
.category-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.tag {
  background: var(--bg-accent-soft);
  color: var(--accent-color);
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.description-text {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 20px;
}
.btn-edit {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}
@media (max-width: 700px) {
  .description-content {
    grid-template-columns: 1fr;
  }
}
</style>