<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { catalogItems, fetchCatalog } from "../data/catalogStore.js";
import { useAuthUser } from "../composables/useAuthUser.js";

const { t } = useI18n();
const router = useRouter();

function goToSplit() {
  router.push("/split-gambar");
}

const heroFeatures = [
  {
    icon: "brain",
    titleKey: "hero.feature1Title",
    descKey: "hero.feature1Desc",
  },
  {
    icon: "sparkle",
    titleKey: "hero.feature2Title",
    descKey: "hero.feature2Desc",
  },
  {
    icon: "download",
    titleKey: "hero.feature3Title",
    descKey: "hero.feature3Desc",
  },
];

const howItWorksSteps = [
  { icon: "upload", titleKey: "howItWorks.step1Title", descKey: "howItWorks.step1Desc" },
  { icon: "cpu", titleKey: "howItWorks.step2Title", descKey: "howItWorks.step2Desc" },
  { icon: "layers", titleKey: "howItWorks.step3Title", descKey: "howItWorks.step3Desc" },
  { icon: "download", titleKey: "howItWorks.step4Title", descKey: "howItWorks.step4Desc" },
];

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

// isAdmin diambil dari useAuthUser.js (state reactive yang dibagikan
// ke seluruh aplikasi), BUKAN dari localStorage.getItem() langsung.
// Ini supaya tombol "+" langsung muncul begitu login berhasil, tanpa
// perlu buka halaman lain dulu untuk memicu remount komponen.
const { isAdmin } = useAuthUser();

const isRestoringScroll = ref(true);

const selectedCategory = ref("all");
const searchQuery = ref("");

const filteredItems = computed(() => {
  let items = catalogItems;

  if (selectedCategory.value !== "all") {
    const target = normalizeTag(selectedCategory.value);
    items = items.filter((item) =>
      item.category?.some((tag) => normalizeTag(tag) === target)
    );
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

    <!-- Hero: menegaskan fungsi inti aplikasi (split gambar jadi layer),
     supaya Katalog tidak disangka sebagai tujuan utama produk. -->
    <section class="landing-hero">
      <div class="hero-content">
        <h1>
          {{ t('hero.titleBefore') }}
          <span class="hero-highlight">{{ t('hero.titleHighlight') }}</span>
          {{ t('hero.titleAfter') }}
        </h1>
        <p>{{ t('hero.description') }}</p>

        <button type="button" class="hero-cta" @click="goToSplit">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2 2 7l10 5 10-5-10-5Z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          {{ t('hero.cta') }}
        </button>

        <div class="hero-badges">
          <div class="hero-badge-item" v-for="feature in heroFeatures" :key="feature.titleKey">
            <div class="hero-badge-icon">
              <svg v-if="feature.icon === 'brain'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <path d="M9 9h.01M15 9h.01M8 14s1.5 2 4 2 4-2 4-2"/>
              </svg>
              <svg v-else-if="feature.icon === 'sparkle'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div class="hero-badge-text">
              <strong>{{ t(feature.titleKey) }}</strong>
              <span>{{ t(feature.descKey) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel "Bagaimana bekerja": tampil di kanan hero (desktop),
       pindah ke bawah hero (mobile) karena flex-direction berubah -->
      <div class="hero-steps">
        <h3 class="hero-steps-title">{{ t('howItWorks.title') }}</h3>
        <div class="hero-steps-row">
          <div class="hero-step" v-for="(step, idx) in howItWorksSteps" :key="step.titleKey">
            <div class="hero-step-icon-col">
              <div class="hero-step-icon">
                <svg v-if="step.icon === 'upload'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <svg v-else-if="step.icon === 'cpu'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                  <rect x="9" y="9" width="6" height="6"/>
                  <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>
                </svg>
                <svg v-else-if="step.icon === 'layers'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                  <polyline points="2 17 12 22 22 17"/>
                  <polyline points="2 12 12 17 22 12"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <svg v-if="idx < howItWorksSteps.length - 1" class="hero-step-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
            <div class="hero-step-text">
              <strong>{{ (idx + 1) + '. ' + t(step.titleKey) }}</strong>
              <span>{{ t(step.descKey) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="section-divider"></div>

    <div class="catalog-header">
      <div class="catalog-header-top">
        <h2>{{ t('catalog.title') }}</h2>
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
  <h3>{{ t('catalog.emptyTitle') }}</h3>
  <p v-if="searchQuery.trim() !== ''">{{ t('catalog.emptyForQuery', { query: searchQuery }) }}</p>
  <p v-else>{{ t('catalog.emptyCategory') }}</p>
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
  padding: 30px 20px 60px;

  opacity: 1;
  transition: opacity 0.15s ease;
}

.catalog-page.is-restoring {
  opacity: 0;
  pointer-events: none;
}

/* ===== Hero: fungsi inti aplikasi (Split Gambar) ===== */
.landing-hero {
  display: flex;
  align-items: stretch;
  gap: 32px;
  text-align: left;
  padding: 36px 16px 32px;
  margin-bottom: 8px;
}

.hero-content {
  flex: 1 1 480px;
  max-width: 640px;
}

.hero-steps {
  flex: 1 1 320px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--bg-card) 55%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid color-mix(in srgb, var(--border-color) 50%, transparent);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 8px 24px var(--shadow-color);
}

.hero-steps-title {
  text-align: center;
  margin: 0 0 16px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.hero-steps-row {
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
  gap: 14px;
}

.hero-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
}

.hero-step-icon-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.hero-step-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--accent-color);
  color: var(--accent-color);
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.hero-step-arrow {
  margin-top: 4px;
  color: var(--border-color);
}

.hero-step-text strong {
  display: block;
  font-size: 12px;
  color: var(--text-primary);
}

.hero-step-text span {
  display: block;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-secondary);
}

.landing-hero h1 {
  margin: 0 0 10px;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.25;
  color: var(--text-primary);
}

.hero-highlight {
  color: var(--accent-color);
}

.landing-hero p {
  margin: 0 0 20px;
  color: var(--text-secondary);
  font-size: 14.5px;
  line-height: 1.6;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: var(--accent-color);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 6px 18px color-mix(in srgb, var(--accent-color) 40%, transparent);
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.hero-cta:hover {
  transform: translateY(-2px);
  opacity: 0.92;
}

.hero-badges {
  display: flex;
  gap: 24px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.hero-badge-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 190px;
}

.hero-badge-icon {
  flex-shrink: 0;
  color: var(--accent-color);
  margin-top: 2px;
}

.hero-badge-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-badge-text strong {
  font-size: 13px;
  color: var(--text-primary);
}

.hero-badge-text span {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Reservasi tinggi ekstra (biar rapi antar bahasa) HANYA di desktop,
   karena di desktop badge tersusun sejajar dan butuh tinggi seragam.
   Di mobile badge tersusun ke bawah satu-satu, jadi tidak perlu ini. */
@media (min-width: 501px) {
  .hero-badge-text span {
    min-height: calc(1.4em * 2);
  }

  .landing-hero p {
    min-height: calc(1.6em * 3);
  }
}

@media (max-width: 500px) {
  .landing-hero {
    flex-direction: column;
    align-items: stretch;
    padding: 12px 4px 20px;
    gap: 12px;
  }

  /* PENTING: flex-basis 480px pada .hero-content awalnya untuk LEBAR
     (saat landing-hero row/desktop). Begitu landing-hero jadi column
     (mobile), angka itu otomatis dibaca sebagai TINGGI minimum, bikin
     ruang kosong di bawah teks yang pendek (mis. Jepang/Korea).
     "auto" membatalkan itu, tinggi mengikuti isi konten sepenuhnya. */
  .hero-content {
    flex-basis: auto;
  }

  .hero-step {
    flex: 0 1 40%;
  }

  .landing-hero h1 {
    font-size: 21px;
  }

  .landing-hero p {
    font-size: 12.5px;
  }

  .hero-cta {
    font-size: 13px;
    padding: 10px 20px;
  }

  .hero-badges {
    gap: 14px;
    margin-top: 18px;
  }

  .hero-badge-item {
    max-width: none;
    width: 100%;
  }
}

.catalog-card:hover .try-split-btn {
  opacity: 1;
  transform: translateY(0);
}

.try-split-btn:hover {
  background: var(--accent-color);
}

.catalog-header {
  margin-bottom: 20px;
}

.catalog-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-divider {
  position: relative;
  height: 1px;
  margin: 4px 0 28px;
  background: linear-gradient(
    to right,
    transparent,
    var(--border-color) 15%,
    var(--border-color) 85%,
    transparent
  );
}

.section-divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 3px;
  border-radius: 999px;
  background: var(--accent-color);
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
  align-items: stretch;
}

.catalog-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 3px 12px var(--shadow-color);
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  cursor: pointer;

  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.7s ease, transform 0.7s ease, box-shadow 0.25s ease;
}

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
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

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
  }

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
    padding: 8px 8px 10px;
    min-height: 78px;
  }

  .catalog-info h3 {
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
  }

  .tag-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
  }

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