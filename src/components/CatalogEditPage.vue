<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { fetchItemById, updateItem, deleteItem } from "../data/catalogStore.js";
import { useCategoryLabel } from "../utils/category.js";

const categoryLabel = useCategoryLabel();

const route = useRoute();
const router = useRouter();

const item = ref(null);
const title = ref("");
const selectedCategories = ref([]);
const { t, locale } = useI18n(); // tambahkan locale di sini (baris yang sudah ada, tinggal tambah locale)
const description = ref({ id: "", en: "", ja: "", ko: "" });

const currentDescription = computed({
  get() {
    return description.value[locale.value] || "";
  },
  set(value) {
    description.value[locale.value] = value;
  }
});

const availableCategories = [
  "Anime", "Chibi", "Furry", "Kawaii", "Spy X Family", "Jujutsu Kaisen",
  "Naruto", "Waifu", "Husbando", "Black Butler", "Detective Conan",
  "Date A live", "Darling in the Franxx", "My Dress-Up Darling", "Aeni",
  "My Hero Academia", "Demon Slayer", "Classroom of the Elite", "Brand New Animal"
];

function isSelected(cat) {
  return selectedCategories.value.some(
    (c) => c.trim().toLowerCase() === cat.trim().toLowerCase()
  );
}

onMounted(async () => {
  item.value = await fetchItemById(route.params.id);
  if (item.value) {
    title.value = item.value.name;
    selectedCategories.value = [...(item.value.category || [])];
    let desc = item.value.description;
if (typeof desc === 'string') {
  try {
    desc = JSON.parse(desc);
  } catch (e) {
    desc = { id: desc, en: "", ja: "", ko: "" }; // kalau data lama masih teks polos, taruh sbg versi Indo
  }
}
description.value = desc || { id: "", en: "", ja: "", ko: "" };
  }
});

function goBack() {
  router.push({ name: "CatalogDetail", params: { id: route.params.id } });
}

async function handleUpload() {
  await updateItem(route.params.id, {
    name: title.value,
    category: selectedCategories.value,
    description: JSON.stringify(description.value),
  });

}


async function handleDelete() {
  await deleteItem(route.params.id);
  router.push({ name: "Catalog" });
}
</script>

<template>
  <div class="edit-page" v-if="item">
    <button class="btn-back" @click="goBack">← {{ t('catalogEdit.back') }}</button>

    <div class="edit-content">
      <div class="edit-image">
        <img :src="item.image" :alt="item.name" />
      </div>

      <div class="edit-form">
        <div class="field-group">
          <label>{{ t('catalogEdit.title') }}</label>
          <input v-model="title" type="text" :placeholder="t('catalogEdit.titlePlaceholder')" />
        </div>

        <div class="field-group">
          <label>{{ t('catalogEdit.category') }} <span class="hint">({{ t('catalogEdit.categoryHint') }})</span></label>
          <div class="category-checkboxes">
            <label
            v-for="cat in availableCategories"
            :key="cat"
            class="chip"
            :class="{ active: isSelected(cat) }"
            >
         <input type="checkbox" :value="cat" v-model="selectedCategories" />
       {{ categoryLabel(cat) }}
          </label>
          </div>
        </div>

        <div class="field-group">
          <label>{{ t('catalogEdit.description') }}</label>
          <textarea v-model="currentDescription" rows="12" :placeholder="t('catalogEdit.descriptionPlaceholder')"></textarea>
        </div>

        <div class="edit-actions">
          <button class="btn-delete" @click="handleDelete">{{ t('catalogEdit.delete') }}</button>
          <button class="btn-upload" @click="handleUpload">{{ t('catalogEdit.save') }}</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="not-found">
    <p>{{ t('catalogEdit.notFound') }}</p>
  </div>
</template>

<style scoped>
.edit-page {
  max-width: 95%;
  margin: 0 auto;
  padding: 30px 40px 60px;
  box-sizing: border-box;
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
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent-color) 35%, transparent);
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
  min-height: 260px;
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