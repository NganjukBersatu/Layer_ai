<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { fetchItemById } from "../data/catalogStore.js";
import { useCategoryLabel } from "../utils/category.js";

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const tagLabel = useCategoryLabel();
const displayDescription = computed(() => {
  if (!item.value) return '';
  let desc = item.value.description;

  if (typeof desc === 'string') {
    try {
      desc = JSON.parse(desc);
    } catch (e) {
      return desc; // kalau memang teks biasa (bukan JSON), tampilkan apa adanya
    }
  }

  return desc?.[locale.value] || desc?.id || 'Belum ada deskripsi.';
});

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
    <div class="stars-bg"></div>

    <button class="btn-back" @click="goBackToCatalog">← {{ t('catalogNew.back') }}</button>

    <div class="description-content">
      <div class="description-image">
        <img :src="item.image" :alt="item.name" />
      </div>

      <div class="description-info">
        <h1>{{ item.name }}</h1>

        <div class="category-tags">
          <span v-for="cat in item.category" :key="cat" class="tag">{{ tagLabel(cat) }}</span>
        </div>

        <button v-if="isAdmin" class="btn-edit" @click="goToEdit">{{ t('catalogDetail.edit') }}</button>

        <p class="description-text">{{ displayDescription }}</p>
      </div>
    </div>
  </div>

  <div v-else>
    <p>Item tidak ditemukan.</p>
  </div>
</template>

<style scoped>
.description-page {
  max-width: 95%;
  margin: 0 auto;
  padding: 30px 40px;
  box-sizing: border-box;
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
.btn-back:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent-color) 35%, transparent);
}
.description-content {
  display: grid;
  grid-template-columns: minmax(280px, 380px) 1fr;
  gap: 24px;
}
.description-image img {
  width: 100%;
  height: auto;
  border-radius: 12px;
  object-fit: contain;
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
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px var(--shadow-color);
  z-index: 100;
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.btn-edit:hover {
  transform: translateY(-2px);
  opacity: 0.95;
}
@media (max-width: 700px) {
  .description-content {
    grid-template-columns: 1fr;
  }
}
.description-page {
  position: relative;
  overflow: hidden;
}
.description-content {
  position: relative;
  z-index: 1;
}
.stars-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    radial-gradient(4px 4px at 20px 30px, var(--accent-color), transparent),
    radial-gradient(4px 4px at 120px 80px, var(--accent-color), transparent),
    radial-gradient(3px 3px at 250px 150px, var(--accent-color), transparent),
    radial-gradient(4px 4px at 350px 40px, var(--accent-color), transparent),
    radial-gradient(3px 3px at 80px 200px, var(--accent-color), transparent),
    radial-gradient(4px 4px at 400px 250px, var(--accent-color), transparent);
  background-repeat: repeat;
  background-size: 450px 300px;
  opacity: 0.35;
  animation: starsMove 40s linear infinite;
}

@keyframes starsMove {
  from { background-position: 0 0; }
  to { background-position: 450px 300px; }
}
</style>