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
  position: relative;
  overflow: hidden;
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
  display: block;          /* penting */
  position: relative;
  z-index: 1;
}

.description-image {
  float: left;
  width: 280px;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: 12px;
  background: var(--bg-accent-soft);
  margin-right: 28px;
  margin-bottom: 16px;
}

.description-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
  border-radius: 12px;
}

.description-info h1 {
  margin: 0 0 10px;
  font-size: 28px;
}

.category-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.description-text {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 20px;
  text-align: justify;
}

.tag {
  background: var(--bg-accent-soft);
  color: var(--accent-color);
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
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

.stars-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.stars-bg::before {
  content: "";
  position: absolute;
  top: -100%;
  left: -100%;
  width: 200%;
  height: 200%;
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
  will-change: transform;
  animation: starsMove 40s linear infinite;
}

@keyframes starsMove {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(450px, 300px, 0); }
}

@media (max-width: 700px) {
  .description-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .description-image {
    float: none !important;
    width: 100%;
    max-width: 280px;
    margin: 0 auto 20px;
  }

  .description-info {
    width: 100%;
  }
}

@media (max-width: 500px) {
  .description-page {
    padding: 16px 14px 40px;
  }

  .btn-back {
    padding: 6px 10px;
    font-size: 12px;
    margin-bottom: 12px;
  }

  .description-info h1 {
    font-size: 20px;
  }

  .description-text {
    font-size: 13px;
    line-height: 1.5;
  }

  .tag {
    font-size: 11px;
    padding: 3px 10px;
  }
}
</style>