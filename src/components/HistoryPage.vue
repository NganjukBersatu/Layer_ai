<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from 'vue-i18n'

const emit = defineEmits(["back"]);
const { t } = useI18n()

const histories = ref([]);
const searchQuery = ref("");
const modelFilter = ref("all"); // "all" | "basic" | "advanced"
const API_BASE = "http://localhost:3000";

const filteredHistories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();

  return histories.value.filter((item) => {
    const matchesSearch = !q || (item.image_name || "").toLowerCase().includes(q);
    const matchesModel =
      modelFilter.value === "all" || item.model === modelFilter.value;

    return matchesSearch && matchesModel;
  });
});

async function loadHistory() {
  try {
    const currentUserId = Number(localStorage.getItem("userId"));

    console.log("👤 User ID:", currentUserId);

    const url = `${API_BASE}/history/${currentUserId}`;

    console.log("📡 Request:", url);

    const response = await fetch(url);

    console.log("📡 Status:", response.status);

    if (!response.ok) {
      throw new Error(`Request gagal: ${response.status}`);
    }

    const data = await response.json();

    console.log("📦 Response History:", data);

    histories.value = Array.isArray(data)
      ? data
      : data.data || [];

    console.log("📋 Histories:", histories.value);
    console.log("📊 Jumlah history:", histories.value.length);

  } catch (error) {
    console.error("❌ Gagal load history:", error);
  }
}

function getImageUrl(path) {
  // path contoh: "uploads/1785742196966.jpg"
  return `${API_BASE}/${path}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function downloadImage(item) {
  try {
    const url = getImageUrl(item.image_url);
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = item.image_name || "image.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Gagal download:", error);
  }
}

async function deleteHistory(item) {
  const confirmDelete = confirm(t('history.deleteConfirm', { name: item.image_name }));
  if (!confirmDelete) return;

  try {
    const response = await fetch(`${API_BASE}/history/${item.id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (data.success) {
      histories.value = histories.value.filter((h) => h.id !== item.id);
    } else {
      alert(t('history.deleteFailed'));
    }
  } catch (error) {
    console.error(error);
    alert(t('history.deleteError'));
  }
}

onMounted(() => {
  loadHistory();
});
</script>

<template>
  <div class="history-page">
    <div class="page-header">
      <button class="back-btn" @click="emit('back')">&larr; {{ $t('history.back') }}</button>
      <h2>{{ $t('history.title') }}</h2>
    </div>

    <div class="search-box">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="$t('history.searchPlaceholder')"
      />
      <button
        v-if="searchQuery"
        class="clear-btn"
        @click="searchQuery = ''"
        :title="$t('history.clearSearch')"
      >
        &times;
      </button>
    </div>

    <div class="filter-tabs">
      <button
        class="filter-tab"
        :class="{ active: modelFilter === 'all' }"
        @click="modelFilter = 'all'"
      >
        {{ $t('history.filterAll') }}
      </button>
      <button
        class="filter-tab"
        :class="{ active: modelFilter === 'basic' }"
        @click="modelFilter = 'basic'"
      >
       {{ $t('history.filterBasic') }}
      </button>
      <button
        class="filter-tab"
        :class="{ active: modelFilter === 'advanced' }"
        @click="modelFilter = 'advanced'"
      >
        {{ $t('history.filterAdvanced') }}
      </button>
    </div>

    <div class="history-grid">
      <div
        v-for="item in filteredHistories"
        :key="item.id"
        class="history-card"
      >
        <div class="thumbnail">
          <img :src="getImageUrl(item.image_url)" :alt="item.image_name" />
        </div>

        <div class="meta">
          <p class="image-name" :title="item.image_name">
            {{ item.image_name }}
          </p>
          <div class="meta-row">
            <p class="date">{{ formatDate(item.created_at) }}</p>
            <span
              class="model-badge"
              :class="item.model === 'advanced' ? 'advanced' : 'basic'"
            >
              {{ item.model === "advanced" ? 
              $t('history.filterAdvanced')
              : $t('history.filterBasic') }}
            </span>
          </div>
        </div>

        <div class="actions">
          <button class="btn download" @click="downloadImage(item)">
            {{ $t('history.download') }}
          </button>
          <button class="btn delete" @click="deleteHistory(item)">
            {{ $t('history.delete') }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="histories.length === 0" class="empty">{{ $t('history.empty') }}</p>
    <p v-else-if="filteredHistories.length === 0" class="empty">
      {{ $t('history.emptyFiltered') }}
    </p>
  </div>
</template>

<style scoped>
.history-page {
  max-width: 1000px;
  margin: 30px auto;
  padding: 0 16px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.history-page h2 {
  margin: 0;
}

.back-btn {
  border: none;
  background: #ede9fe;
  color: #4f46e5;
  font-weight: 600;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.back-btn:hover {
  opacity: 0.85;
}

.search-box {
  position: relative;
  margin-bottom: 20px;
}

.search-box input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 1px solid #d6d6d6;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.search-box input:focus {
  border-color: #7c3aed;
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  color: #999;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 4px;
}

.clear-btn:hover {
  color: #4f46e5;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.filter-tab {
  border: 1px solid #ddd;
  background: #fff;
  color: #555;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 18px;
  border-radius: 999px;
  cursor: pointer;
  transition: 0.15s;
}

.filter-tab:hover {
  border-color: #7c3aed;
  color: #7c3aed;
}

.filter-tab.active {
  background: #7c3aed;
  border-color: #7c3aed;
  color: #fff;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.history-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.thumbnail {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f2f2f2;
  overflow: hidden;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.meta {
  padding: 12px 14px 4px;
}

.image-name {
  font-weight: 600;
  font-size: 14px;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.date {
  font-size: 12px;
  color: #777;
  margin: 0;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.model-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  text-transform: uppercase;
}

.model-badge.basic {
  background: #ede9fe;
  color: #7c3aed;
}

.model-badge.advanced {
  background: #fef3c7;
  color: #b45309;
}

.actions {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
}

.btn {
  flex: 1;
  border: none;
  border-radius: 8px;
  padding: 8px 0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:hover {
  opacity: 0.85;
}

.btn.download {
  background: #4f46e5;
  color: white;
}

.btn.delete {
  background: #fee2e2;
  color: #dc2626;
}

.empty {
  text-align: center;
  color: #999;
  margin-top: 40px;
}
</style>