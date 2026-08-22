<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { catalogItems, fetchCatalog } from "../data/catalogStore.js";

const { t } = useI18n();

const isAdmin = computed(() => localStorage.getItem("isAdmin") === "true");

onMounted(() => {
  fetchCatalog();
});

const selectedCategory = ref("all");

const filteredItems = computed(() => {
  if (selectedCategory.value === "all") return catalogItems;
  return catalogItems.filter((item) => item.category?.includes(selectedCategory.value));
});

const categoryKeyMap = {
  anime: "filterAnime",
  chibi: "filterChibi",
  furry: "filterFurry",
  kawaii: "filterKawaii",
  spyxfamily: "filterSpyXFamily",
  jujutsukaisen: "filterJujutsuKaisen",
  naruto: "filterNaruto",
  waifu: "filterWaifu",
  husbando: "filterHusbando",
  blackbutler: "filterBlackButler",
  detectiveconan: "filterDetectiveConan",
  datealive: "filterDateAlive",
  darlinginthefranxx: "filterDarlingInTheFranxx",
  mydressupdarling: "filterMyDressUpDarling",
  aeni: "filterAeni",
  myheroacademia: "filterMyHeroAcademia",
  demonslayer: "filterDemonSlayer",
  classroomoftheelite: "filterClassroomOfTheElite",
  brandnewanimal: "filterBrandNewAnimal",
};

function normalizeTag(tag) {
  return tag.toLowerCase().replace(/[\s_-]+/g, "");
}

function tagLabel(tag) {
  const key = categoryKeyMap[normalizeTag(tag)];
  return key ? t(`catalog.${key}`) : tag; // fallback tampilkan teks asli kalau tidak ketemu
}
</script>

<template>
  <div class="catalog-page">
    <div class="aurora-bg"></div>

    <div class="catalog-header">
      <div class="catalog-header-top">
        <h1>{{ t('catalog.title') }}</h1>
        <router-link
          v-if="isAdmin"
          to="/catalog/new"
          class="add-catalog-btn"
        >
          +
        </router-link>
      </div>
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

      <button
        :class="{ active: selectedCategory === 'Jujutsu Kaisen' }"
        @click="selectedCategory = 'Jujutsu Kaisen'"
      > 
        {{ t('catalog.filterJujutsuKaisen') }}
      </button>

      <button
        :class="{ active: selectedCategory === 'Spy X Family' }"
        @click="selectedCategory = 'Spy X Family'"
      > 
        {{ t('catalog.filterSpyXFamily') }}
      </button>

      <button
        :class="{ active: selectedCategory === 'Naruto' }"
        @click="selectedCategory = 'Naruto'"
      >
        {{ t('catalog.filterNaruto') }}
      </button>

      <button
        :class="{ active: selectedCategory === 'Waifu' }"
        @click="selectedCategory = 'Waifu'"
      >
        {{ t('catalog.filterWaifu') }}
      </button>

      <button
        :class="{ active: selectedCategory === 'Husbando' }"
        @click="selectedCategory = 'Husbando'"
      >
        {{ t('catalog.filterHusbando') }}
      </button>

      <button
  :class="{ active: selectedCategory === 'Black Butler' }"
  @click="selectedCategory = 'Black Butler'"
>
  {{ t('catalog.filterBlackButler') }}
</button>

<button
  :class="{ active: selectedCategory === 'Detective Conan' }"
  @click="selectedCategory = 'Detective Conan'"
>
  {{ t('catalog.filterDetectiveConan') }}
</button>

<button
  :class="{ active: selectedCategory === 'Date A live' }"
  @click="selectedCategory = 'Date A live'"
>
  {{ t('catalog.filterDateAlive') }}
</button>

<button
  :class="{ active: selectedCategory === 'Darling in the Franxx' }"
  @click="selectedCategory = 'Darling in the Franxx'"
>
  {{ t('catalog.filterDarlingInTheFranxx') }}
</button>

<button
  :class="{ active: selectedCategory === 'My Dress-Up Darling' }"
  @click="selectedCategory = 'My Dress-Up Darling'"
>
  {{ t('catalog.filterMyDressUpDarling') }}
</button>

<button
  :class="{ active: selectedCategory === 'Aeni' }"
  @click="selectedCategory = 'Aeni'"
>
  {{ t('catalog.filterAeni') }}
</button>

<button
  :class="{ active: selectedCategory === 'My Hero Academia' }"
  @click="selectedCategory = 'My Hero Academia'"
>
  {{ t('catalog.filterMyHeroAcademia') }}
</button>

<button
  :class="{ active: selectedCategory === 'Demon Slayer' }"
  @click="selectedCategory = 'Demon Slayer'"
>
  {{ t('catalog.filterDemonSlayer') }}
</button>

<button
  :class="{ active: selectedCategory === 'Classroom of the Elite' }"
  @click="selectedCategory = 'Classroom of the Elite'"
>
  {{ t('catalog.filterClassroomOfTheElite') }}
</button>

<button
  :class="{ active: selectedCategory === 'Brand New Animal' }"
  @click="selectedCategory = 'Brand New Animal'"
>
  {{ t('catalog.filterBrandNewAnimal') }}
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
          <div class="tag-list">
            <span
              v-for="tag in item.category"
              :key="tag"
                class="tag-badge"
              >
            {{ tagLabel(tag) }}
        </span>
          </div>
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

.catalog-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.add-catalog-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--accent-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  text-decoration: none;
  line-height: 1;
  box-shadow: 0 4px 14px var(--shadow-color);
  z-index: 100;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.add-catalog-btn:hover {
  transform: scale(1.08);
  opacity: 0.9;
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
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  /* Membuat semua item grid setinggi item tertinggi di barisnya,
     supaya .catalog-card bisa "stretch" mengisi penuh (lihat di bawah) */
  align-items: stretch;
}

.catalog-card {
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 3px 12px var(--shadow-color);
  text-decoration: none;
  color: inherit;
  /* Sebelumnya: display: block (tinggi mengikuti konten/gambar asli). 
     Diubah jadi flex-column supaya .catalog-info konsisten menempel 
     di bawah gambar, dan card sama tinggi antar kolom. */
  display: flex;
  flex-direction: column;
  height: 100%;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.catalog-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px var(--shadow-color);
}

.catalog-card:hover .image-container img {
  transform: scale(1.05);
}

/* KUNCI PERBAIKAN: sebelumnya .image-container tidak punya tinggi/rasio
   tetap, sehingga tingginya mengikuti ukuran asli tiap gambar (yang
   berbeda-beda), membuat card jadi tidak seragam. Dengan aspect-ratio,
   semua .image-container sekarang punya proporsi yang sama persis,
   dan img di dalamnya (object-fit: cover) otomatis menyesuaikan/crop. */
.image-container {
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: var(--bg-accent-soft);
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
  transition: transform 0.35s ease;
}

.catalog-info {
  padding: 10px;
  /* Mendorong info menempel ke bawah kalau ada card dengan jumlah tag
     berbeda-beda, supaya tinggi card tetap konsisten */
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.catalog-info h3 {
  margin: 0 0 5px;
  font-size: 13px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.tag-badge {
  font-size: 10px;
  color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 12%, transparent);
  padding: 2px 7px;
  border-radius: 999px;
  white-space: nowrap;
}

@media (max-width: 1000px) {
  .catalog-grid {
    grid-template-columns: repeat(3, 1fr);
  }
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

  /* --- Kategori bisa digeser horizontal, KHUSUS mobile --- */
  .category-filter {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 6px;
    margin-right: -12px;
    padding-right: 12px;
    scrollbar-width: none;
  }

  .category-filter::-webkit-scrollbar {
    display: none;
  }

  .category-filter button {
    flex-shrink: 0;
    white-space: nowrap;
  }
}

.catalog-page {
  position: relative;
  overflow: hidden;
}

.aurora-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: linear-gradient(
    100deg,
    transparent 20%,
    rgba(140, 100, 255, 0.25) 40%,
    rgba(100, 200, 255, 0.25) 55%,
    transparent 75%
  );
  filter: blur(40px);
  animation: auroraSweep 8s ease-in-out infinite;
}
@keyframes auroraSweep {
  0%   { transform: translateX(-40%); opacity: 0; }
  15%  { opacity: 1; }
  50%  { transform: translateX(20%); opacity: 1; }
  85%  { opacity: 0; }
  100% { transform: translateX(60%); opacity: 0; }
}
.catalog-header,
.category-filter,
.catalog-grid {
  position: relative;
  z-index: 1;
}
</style>