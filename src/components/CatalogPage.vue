<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { catalogItems, fetchCatalog } from "../data/catalogStore.js";

const { t } = useI18n();

onMounted(() => {
  fetchCatalog();
});

const selectedCategory = ref("all");

const filteredItems = computed(() => {
  if (selectedCategory.value === "all") return catalogItems;
  return catalogItems.filter((item) => item.category?.includes(selectedCategory.value));
});
</script>

<template>
  <div class="catalog-page">

    <div class="catalog-header">
  <h1>{{ t('catalog.title') }}</h1>
  <p>
    {{ t('catalog.subtitle') }}
  </p>
</div>

    <div class="category-filter">
      <button
        :class="{ active: selectedCategory === 'all' }"
        @click="selectedCategory = 'all'"
      >
        {{ t('catalog.filterAll') }}
      </button>

      <button
        :class="{ active: selectedCategory === 'Anime' }"
        @click="selectedCategory = 'Anime'"
      >
        {{ t('catalog.filterAnime') }}
      </button>

      <button
        :class="{ active: selectedCategory === 'Chibi' }"
        @click="selectedCategory = 'Chibi'"
      >
        {{ t('catalog.filterChibi') }}
      </button>

      <button
        :class="{ active: selectedCategory === 'Furry' }"
        @click="selectedCategory = 'Furry'"
      >
        {{ t('catalog.filterFurry') }}
      </button>

      <button
        :class="{ active: selectedCategory === 'Kawaii' }"
        @click="selectedCategory = 'Kawaii'"
      >
        {{ t('catalog.filterKawaii') }}
      </button>
    </div>

    <div class="catalog-grid">

      <router-link
        v-for="item in filteredItems"
        :key="item.id"
        :to="'/catalog/' + item.id"
        class="catalog-card"
      >
        <div class="image-container">
          <img :src="item.image" :alt="item.name" />
        </div>
        
        <div class="catalog-info">
           <h3>{{ item.name }}</h3>
            <span>{{ item.category }}</span>
        </div>
      </router-link>

    </div>

  </div>
</template>

<style scoped>
.catalog-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px 60px;
}

.catalog-header {
  margin-bottom: 20px;
}

.catalog-header h1 {
  margin: 0 0 6px;
  font-size: 28px;
}

.catalog-header p {
  margin: 0;
  color: var(--text-secondary);
}

.category-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.category-filter button {
  padding: 8px 15px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
}

.category-filter button.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.catalog-card {
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 3px 12px var(--shadow-color);
  text-decoration: none;
  color: inherit;
  display: block;
  cursor: pointer;
}

.image-container {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #f1f1f1;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.catalog-info {
  padding: 12px;
}

.catalog-info h3 {
  margin: 0 0 5px;
  font-size: 14px;
}

.catalog-info span {
  font-size: 12px;
  color: var(--text-secondary);
}

@media (max-width: 800px) {
  .catalog-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .catalog-page {
    padding: 20px 12px 40px;
  }

  .catalog-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .catalog-info {
    padding: 9px;
  }

  .catalog-info h3 {
    font-size: 12px;
  }
}
</style>