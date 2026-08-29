<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useI18n } from "vue-i18n";
import { catalogItems, fetchCatalog } from "../data/catalogStore.js";

const { t } = useI18n();

// Directive untuk animasi "muncul" saat elemen masuk ke area layar
// (bukan langsung semua jalan saat halaman dimuat), jadi card yang
// posisinya di bawah tetap ikut animasi saat di-scroll ke sana.
const vReveal = {
  mounted(el) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
  },
};

const isAdmin = computed(() => localStorage.getItem("isAdmin") === "true");
const isRestoringScroll = ref(true);

const selectedCategory = ref("all");
const searchQuery = ref("");

const filteredItems = computed(() => {
  let items = catalogItems;

  if (selectedCategory.value !== "all") {
    items = items.filter((item) => item.category?.includes(selectedCategory.value));
  }

  if (searchQuery.value.trim() !== "") {
    const q = searchQuery.value.toLowerCase().trim();
    items = items.filter((item) => item.name?.toLowerCase().includes(q));
  }

  return items;
});

// Menentukan apakah hasil pencarian/filter kosong,
// dipakai untuk menampilkan pesan "tidak ditemukan"
const hasResults = computed(() => filteredItems.value.length > 0);

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
  return key ? t(`catalog.${key}`) : tag;
}

const categories = [
  { value: "Anime", labelKey: "filterAnime" },
  { value: "Chibi", labelKey: "filterChibi" },
  { value: "Furry", labelKey: "filterFurry" },
  { value: "Kawaii", labelKey: "filterKawaii" },
  { value: "Jujutsu Kaisen", labelKey: "filterJujutsuKaisen" },
  { value: "Spy X Family", labelKey: "filterSpyXFamily" },
  { value: "Naruto", labelKey: "filterNaruto" },
  { value: "Waifu", labelKey: "filterWaifu" },
  { value: "Husbando", labelKey: "filterHusbando" },
  { value: "Black Butler", labelKey: "filterBlackButler" },
  { value: "Detective Conan", labelKey: "filterDetectiveConan" },
  { value: "Date A live", labelKey: "filterDateAlive" },
  { value: "Darling in the Franxx", labelKey: "filterDarlingInTheFranxx" },
  { value: "My Dress-Up Darling", labelKey: "filterMyDressUpDarling" },
  { value: "Aeni", labelKey: "filterAeni" },
  { value: "My Hero Academia", labelKey: "filterMyHeroAcademia" },
  { value: "Demon Slayer", labelKey: "filterDemonSlayer" },
  { value: "Classroom of the Elite", labelKey: "filterClassroomOfTheElite" },
  { value: "Brand New Animal", labelKey: "filterBrandNewAnimal" },
];

function selectCategory(value, event) {
  selectedCategory.value = value;

  const btn = event.currentTarget;
  if (btn && typeof btn.scrollIntoView === "function") {
    btn.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }
}

// Simpan posisi scroll sebelum meninggalkan halaman katalog
onBeforeRouteLeave(() => {
  sessionStorage.setItem("catalogScrollPos", window.scrollY.toString());
});

onMounted(async () => {
  // Cegah browser ikut campur mengatur scroll restoration bawaannya
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  await fetchCatalog();
  await nextTick();

  const saved = sessionStorage.getItem("catalogScrollPos");
  if (saved !== null) {
    window.scrollTo(0, parseInt(saved, 10));
  }

  // Tunggu satu frame render supaya posisi scroll benar-benar
  // diterapkan browser SEBELUM halaman ditampilkan ke user.
  await new Promise((resolve) => requestAnimationFrame(resolve));

  isRestoringScroll.value = false;
});
</script>

<template>
  <div class="catalog-page" :class="{ 'is-restoring': isRestoringScroll }">
    <div class="aurora-bg"></div>

    <div class="catalog-header">
      <div class="catalog-header-top">
        <h1>{{ t('catalog.title') }}</h1>
      </div>
      <p>
        {{ t('catalog.subtitle') }}
      </p>
    </div>

    <div class="search-bar">
      <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/>
      </svg>
      <input
        v-model="searchQuery"
          type="text"
          :placeholder="t('catalog.searchPlaceholder')"
          />
    </div>


    <div class="category-filter">
      <button
        :class="{ active: selectedCategory === 'all' }"
        @click="selectCategory('all', $event)"
      >
        {{ t('catalog.filterAll') }}
      </button>

      <button
        v-for="cat in categories"
        :key="cat.value"
        :class="{ active: selectedCategory === cat.value }"
        @click="selectCategory(cat.value, $event)"
      >
        {{ t('catalog.' + cat.labelKey) }}
      </button>
    </div>

    <!-- Grid hasil, hanya tampil kalau ada hasil -->
    <div class="catalog-grid" v-if="hasResults">

      <router-link
        v-for="(item, index) in filteredItems"
        :key="item.id"
        :to="'/catalog/' + item.id"
        class="catalog-card"
        v-reveal
        :style="{ transitionDelay: (index % 5) * 0.1 + 's' }"
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

    <!-- Pesan kalau pencarian/filter tidak menghasilkan apa-apa -->
    <div class="empty-state" v-else>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/>
      </svg>
      <h3>Tidak ditemukan</h3>
      <p v-if="searchQuery.trim() !== ''">Tidak ada hasil untuk "{{ searchQuery }}"</p>
      <p v-else>Tidak ada hasil pada kategori ini</p>
    </div>

    <router-link
      v-if="isAdmin"
      to="/catalog/new"
      class="add-catalog-btn"
    >
      +
    </router-link>
      
  </div>
</template>

<style scoped>
.catalog-page {
  max-width: 1200px;
  margin: 0 auto;
  /* PERBAIKAN: halaman Catalog (route "/") tidak menampilkan hero
     di App.vue, sehingga .app { padding-top: 125px } tampil sebagai
     ruang kosong polos langsung di bawah Navbar. Margin-top negatif
     di sini menarik konten ke atas supaya jaraknya lebih dekat,
     tanpa mengubah .app padding-top (yang masih dipakai halaman lain
     seperti History / Split Gambar yang punya hero). */
  margin-top: -25px;
  padding: 30px 20px 60px;
  
  opacity: 1;
  transition: opacity 0.15s ease;
}

.catalog-page.is-restoring {
  opacity: 0;
  pointer-events: none;
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
  z-index: 1000;
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

.search-bar {
  position: relative;
  margin-bottom: 20px;
}

.search-bar input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.search-bar input:focus {
  border-color: var(--accent-color);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
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
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 3px 12px var(--shadow-color);
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  cursor: pointer;

  /* Kondisi awal sebelum card masuk ke layar */
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.7s ease, transform 0.7s ease, box-shadow 0.25s ease;
}

/* Class ini ditambahkan oleh directive v-reveal saat card
   terdeteksi masuk ke area layar (scroll-triggered), bukan
   langsung semua jalan saat halaman baru dibuka */
.catalog-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.catalog-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px var(--shadow-color);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
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
  border-radius: 12px 12px 0 0;
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
  padding: 10px 10px 14px;
  flex: 1;
  min-height: 82px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  border-radius: 0 0 12px 12px;
}

.catalog-info h3 {
  margin: 0 0 2px;
  font-size: 13px;
  line-height: 1.3;
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

/* ===== Empty state (hasil pencarian/filter tidak ditemukan) ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  position: relative;
  z-index: 1;
}

.empty-state svg {
  opacity: 0.4;
  margin-bottom: 12px;
}

.empty-state h3 {
  margin: 0 0 6px;
  color: var(--text-primary);
  font-size: 16px;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
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
    margin-top: -40px;
  }

  /*Bagian Yang Perkecil hero/header khusus mobile */
  .catalog-header {
    margin-bottom: 14px;
  }

  .catalog-header h1 {
    font-size: 17px;
    margin: 0 0 4px;
  }

  .catalog-header p {
    font-size: 12.5px;
    line-height: 1.4;
  }

  .catalog-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .catalog-info {
    padding: 9px 9px 10px;
    min-height: 64px;
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
    scrollbar-width: none;
  }

  .category-filter::-webkit-scrollbar {
    display: none;
  }

  .category-filter button {
    flex-shrink: 0;
    white-space: nowrap;
  }

  .empty-state {
    padding: 40px 16px;
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