<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from 'vue-i18n'

const emit = defineEmits(["back"]);
const { t } = useI18n()

const histories = ref([]);
const searchQuery = ref("");
const modelFilter = ref("all"); // "all" | "basic" | "advanced" | "chibi" | "anime" | "furry" | "kawaii" | "spyxfamily"
const sortOrder = ref("newest"); // "newest" | "oldest"
const isSortMenuOpen = ref(false);
const sortDropdownRef = ref(null);
const sortOptions = [
  { value: "newest", label: () => t('history.sortNewest') },
  { value: "oldest", label: () => t('history.sortOldest') },
];

function selectSort(value) {
  sortOrder.value = value;
  isSortMenuOpen.value = false;
}

function handleClickOutsideSort(event) {
  if (sortDropdownRef.value && !sortDropdownRef.value.contains(event.target)) {
    isSortMenuOpen.value = false;
  }
}
const API_BASE = "http://localhost:3000";

// Loading state utama saat fetch daftar history dari API
const isLoadingList = ref(true);

// Status loading tiap gambar: { [item.id]: "loading" | "loaded" | "error" }
const imageStatus = reactive({});

function setImageStatus(id, status) {
  imageStatus[id] = status;
}

function onImageLoad(item) {
  setImageStatus(item.id, "loaded");
}

function onImageError(item) {
  setImageStatus(item.id, "error");
}

// Dipanggil lewat :ref pas elemen <img> baru mount.
// Kalau gambar sudah ada di cache browser, event "load" bisa saja sudah
// selesai duluan sebelum listener sempat terpasang, jadi status jadi
// "loading" selamanya. Ini jaga-jaga untuk kasus tersebut.
function checkImageComplete(el, item) {
  if (!el) return;
  if (imageStatus[item.id] === "loaded" || imageStatus[item.id] === "error") return;
  if (el.complete) {
    if (el.naturalWidth > 0) {
      onImageLoad(item);
    } else {
      onImageError(item);
    }
  }
}

// Kategori "model" (tier AI) -> dicek dari item.model
const MODEL_TIERS = ["basic", "advanced"];

// Kategori "style" (gaya gambar) -> dari kolom `category` di tabel results
const FIELD_CANDIDATES = ["category"];

const filterTabs = [
  { value: "all", label: () => t('history.filterAll') },
  { value: "basic", label: () => t('history.filterBasic') },
  { value: "advanced", label: () => t('history.filterAdvanced') },
  { value: "chibi", label: () => "Chibi" },
  { value: "anime", label: () => "Anime" },
  { value: "furry", label: () => "Furry" },
  { value: "kawaii", label: () => "Kawaii" },
  { value: "spyxfamily", label: () => "Spy x Family" },
];

// Ambil nilai kategori style dari item, coba beberapa kemungkinan nama field
function getItemStyleValue(item) {
  for (const field of FIELD_CANDIDATES) {
    if (item[field]) {
      return String(item[field]).toLowerCase().replace(/[\s_-]/g, "");
    }
  }
  return "";
}

const filteredHistories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const filter = modelFilter.value;

  const result = histories.value.filter((item) => {
    const matchesSearch = !q || (item.image_name || "").toLowerCase().includes(q);

    let matchesFilter = true;
    if (filter !== "all") {
      if (MODEL_TIERS.includes(filter)) {
        matchesFilter = item.model === filter;
      } else {
        // filter === "chibi" | "anime" | "furry" | "kawaii" | "spyxfamily"
        matchesFilter = getItemStyleValue(item) === filter;
      }
    }

    return matchesSearch && matchesFilter;
  });

  return result.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder.value === "newest" ? dateB - dateA : dateA - dateB;
  });
});

async function loadHistory() {
  isLoadingList.value = true;
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

    // Set status awal semua gambar jadi "loading" sebelum <img> selesai render
    histories.value.forEach((item) => {
      setImageStatus(item.id, "loading");
    });

    console.log("📋 Histories:", histories.value);
    console.log("📊 Jumlah history:", histories.value.length);

  } catch (error) {
    console.error("❌ Gagal load history:", error);
  } finally {
    isLoadingList.value = false;
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

// Label badge untuk kartu (tetap pakai basic/advanced sebagai badge utama,
// tapi kalau item punya nilai style, tampilkan itu juga)
function getStyleLabel(item) {
  const val = getItemStyleValue(item);
  if (!val) return null;
  const found = filterTabs.find((t) => t.value === val);
  return found ? found.label() : val;
}

onMounted(() => {
  loadHistory();
  document.addEventListener("click", handleClickOutsideSort);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutsideSort);
});
</script>

<template>
  <div class="history-page">
    <div class="page-header">
      <button class="back-btn" @click="emit('back')">&larr; {{ $t('history.back') }}</button>
      <h2>{{ $t('history.title') }}</h2>
    </div>

    <div class="toolbar-row">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
          <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
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

      <div class="sort-dropdown" ref="sortDropdownRef">
        <button type="button" class="sort-button" @click="isSortMenuOpen = !isSortMenuOpen">
          <span>{{ sortOptions.find(o => o.value === sortOrder)?.label() }}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ rotated: isSortMenuOpen }">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div v-if="isSortMenuOpen" class="sort-menu">
          <button
            v-for="opt in sortOptions"
            :key="opt.value"
            type="button"
            class="sort-option"
            :class="{ active: sortOrder === opt.value }"
            @click="selectSort(opt.value)"
          >
            {{ opt.label() }}
          </button>
        </div>
      </div>
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in filterTabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: modelFilter === tab.value }"
        @click="modelFilter = tab.value"
      >
        {{ tab.label() }}
      </button>
    </div>

    <p v-if="!isLoadingList && histories.length > 0" class="result-count">
      {{ filteredHistories.length }} {{ $t('history.imagesFound') }}
    </p>

    <!-- Skeleton grid saat daftar history awal masih di-fetch -->
    <div v-if="isLoadingList" class="history-grid">
      <div v-for="n in 8" :key="'skeleton-' + n" class="history-card skeleton-card">
        <div class="thumbnail skeleton-shimmer"></div>
        <div class="meta">
          <div class="skeleton-line skeleton-shimmer" style="width: 70%"></div>
          <div class="skeleton-line skeleton-shimmer" style="width: 40%; margin-top: 6px"></div>
        </div>
      </div>
    </div>

    <div v-else class="history-grid">
      <div
        v-for="item in filteredHistories"
        :key="item.id"
        class="history-card"
      >
        <div class="thumbnail">
          <!-- Overlay spinner selama gambar masih dimuat -->
          <div v-if="imageStatus[item.id] !== 'loaded' && imageStatus[item.id] !== 'error'" class="thumb-loading">
            <span class="spinner"></span>
          </div>

          <!-- Fallback kalau gambar gagal dimuat -->
          <div v-else-if="imageStatus[item.id] === 'error'" class="thumb-error">
            <span>{{ $t('history.imageFailed') || 'Gagal memuat gambar' }}</span>
          </div>

          <img
            :src="getImageUrl(item.image_url)"
            :alt="item.image_name"
            :ref="(el) => checkImageComplete(el, item)"
            @load="onImageLoad(item)"
            @error="onImageError(item)"
          />
        </div>

        <div class="meta">
          <p class="image-name" :title="item.image_name">
            {{ item.image_name }}
          </p>
          <div class="meta-row">
            <p class="date">{{ formatDate(item.created_at) }}</p>
            <div class="badges">
              <span
                class="model-badge"
                :class="item.model === 'advanced' ? 'advanced' : 'basic'"
              >
                {{ item.model === "advanced" ?
                $t('history.filterAdvanced')
                : $t('history.filterBasic') }}
              </span>
              <span v-if="getStyleLabel(item)" class="style-badge">
                {{ getStyleLabel(item) }}
              </span>
            </div>
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

    <p v-if="!isLoadingList && histories.length === 0" class="empty">{{ $t('history.empty') }}</p>
    <p v-else-if="!isLoadingList && filteredHistories.length === 0" class="empty">
      {{ $t('history.emptyFiltered') }}
    </p>
  </div>
</template>

<style scoped>
.history-page {
  width: 100vw !important;
  max-width: 100vw !important;
  margin-left: calc(-50vw + 50%) !important; 
  padding: 16px clamp(20px, 6vw, 100px) !important;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.history-page h2 {
  margin: 0;
  font-size: 22px;
}

.back-btn {
  border: none;
  background: var(--bg-accent-soft); 
  color: var(--accent-color);
  font-weight: 600;
  font-size: 14px;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
}

.back-btn:hover {
  opacity: 0.85;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 0;
}

.sort-dropdown {
  position: relative;
  flex-shrink: 0;
}

.sort-button {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 11px 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--bg-card);
  outline: none;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.sort-button:hover {
  border-color: #8b7cf6;
}

.sort-button svg {
  transition: transform 0.2s ease;
  color: var(--text-secondary);
}

.sort-button svg.rotated {
  transform: rotate(180deg);
}

.sort-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 140px;
  padding: 6px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 13px;
  box-shadow: 0 10px 30px var(--shadow-color);
  z-index: 1000;
}

.sort-option {
  width: 100%;
  text-align: left;
  padding: 9px 11px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.sort-option:hover {
  background: color-mix(in srgb, var(--accent-color) 12%, transparent);
  color: var(--accent-color);
}

.sort-option.active {
  background: color-mix(in srgb, var(--accent-color) 18%, transparent);
  color: var(--accent-color);
  font-weight: 600;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

.search-box input {
  width: 100%;
  padding: 11px 40px 11px 38px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  background: var(--bg-card);
  color: var(--text-primary);
}

.search-box input:focus {
  border-color: var(--accent-color);
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.filter-tabs::-webkit-scrollbar {
  display: none;
}

.filter-tab {
  border: 1px solid var(--border-color); 
  background: var(--bg-card); 
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 13px;
  padding: 7px 14px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
}

.filter-tab.active {
  background: var(--accent-color); 
  border-color: var(--accent-color); 
  color: #fff;
}

.result-count {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 10px;
}

/* ===== GRID ===== */
.history-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* Tablet */
@media (max-width: 900px) {
  .history-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Mobile */
@media (max-width: 600px) {
  .history-page {
    width: 100% !important;
    max-width: 100% !important;
    margin-left: 0 !important;
    padding: 12px !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px;
  }

  .page-header {
    gap: 10px;
    margin-bottom: 12px;
  }

  .toolbar-row {
    flex-wrap: wrap;
  }

  .sort-button {
    padding: 9px 10px;
    font-size: 13px;
  }

  .history-page h2 {
    font-size: 20px;
  }

  .history-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .meta {
    padding: 8px 10px 2px;
  }

  .image-name {
    font-size: 12px;
  }

  .date {
    font-size: 11px;
  }

  .model-badge,
  .style-badge {
    font-size: 9px;
    padding: 2px 7px;
  }

  .actions {
    padding: 8px 10px;
    gap: 6px;
  }

  .btn {
    padding: 6px 0;
    font-size: 12px;
  }
}

/* ===== Card ===== */
.history-card {
  background: var(--bg-card);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
}

.thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--bg-accent-soft);
  overflow: hidden;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Overlay spinner ketika gambar sedang dimuat */
.thumb-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-accent-soft);
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* State ketika gambar gagal dimuat */
.thumb-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px;
  background: var(--bg-accent-soft);
  color: var(--text-secondary);
  font-size: 12px;
}

/* Skeleton placeholder saat daftar history awal masih di-fetch */
.skeleton-card .thumbnail {
  background: none;
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-accent-soft) 25%,
    rgba(255, 255, 255, 0.5) 50%,
    var(--bg-accent-soft) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-line {
  height: 12px;
  border-radius: 4px;
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
  color: var(--text-secondary);
  margin: 0;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  gap: 6px;
}

.badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.model-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  text-transform: uppercase;
  white-space: nowrap;
}

.model-badge.basic {
  background: #ede9fe;
  color: #7c3aed;
}

.model-badge.advanced {
  background: #fef3c7;
  color: #b45309;
}

.style-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  text-transform: uppercase;
  white-space: nowrap;
  background: #dbeafe;
  color: #1d4ed8;
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
}

.btn.download {
  background: var(--accent-color); 
  color: white;
}

.btn.delete {
  background: #fee2e2;
  color: #dc2626;
}

.empty {
  text-align: center;
  color: var(--text-secondary);
  margin-top: 40px;
}
</style>