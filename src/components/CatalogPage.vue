<script setup>
import { ref, computed } from "vue";

const emit = defineEmits(["split"]);

const selectedCategory = ref("all");

const catalogItems = [
  {
    name: "Rain Hagwell",
    category: "Anime",
    image: "/catalog/Rain.jpg",
  },
  {
    name: "Marin Kitagawa",
    category: "Anime",
    image: "/catalog/marin.jpg",
  },
  {
    name: "Kurumi Tokisaki",
    category: "Furry",
    image: "/catalog/kurumi.jpg",
  },
  {
    name: "Anya Forget",
    category: "Kawaii",
    image: "/catalog/anya.jpg",
  },
  {
    name: "Zero Two",
    category: "Anime",
    image: "/catalog/zerotwo.png",
  },
];

const filteredItems = computed(() => {
  if (selectedCategory.value === "all") {
    return catalogItems;
  }

  return catalogItems.filter(
    (item) => item.category === selectedCategory.value
  );
});
</script>

<template>
  <div class="catalog-page">

    <div class="catalog-header">
      <h1>Catalog</h1>
      <p>
        Lihat berbagai hasil karya yang dibuat dengan AI Layer Splitter.
      </p>
    </div>

    <div class="category-filter">
      <button
        :class="{ active: selectedCategory === 'all' }"
        @click="selectedCategory = 'all'"
      >
        Semua
      </button>

      <button
        :class="{ active: selectedCategory === 'Anime' }"
        @click="selectedCategory = 'Anime'"
      >
        Anime
      </button>

      <button
        :class="{ active: selectedCategory === 'Chibi' }"
        @click="selectedCategory = 'Chibi'"
      >
        Chibi
      </button>

      <button
        :class="{ active: selectedCategory === 'Furry' }"
        @click="selectedCategory = 'Furry'"
      >
        Furry
      </button>

      <button
        :class="{ active: selectedCategory === 'Kawaii' }"
        @click="selectedCategory = 'Kawaii'"
      >
        Kawaii
      </button>
    </div>

    <div class="catalog-grid">

      <div
        v-for="item in filteredItems"
        :key="item.name"
        class="catalog-card"
      >

        <div class="image-container">
          <img
            :src="item.image"
            :alt="item.name"
          />
        </div>

        <div class="catalog-info">
          <h3>{{ item.name }}</h3>
          <span>{{ item.category }}</span>
        </div>

      </div>

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