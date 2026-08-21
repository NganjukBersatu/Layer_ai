<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from 'vue-i18n'

// PERBAIKAN: nama event diubah dari "back" menjadi "back-from-history"
// supaya cocok dengan listener @back-from-history="goBackFromHistory"
// yang ada di App.vue. Sebelumnya nama event ini "back", yang ternyata
// "nabrak" dengan listener @back="goBack" milik halaman lain, sehingga
// tombol Kembali di halaman History malah memanggil goBack() dan
// mengarah ke halaman Catalog.
const emit = defineEmits(["back-from-history"]);
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

// Item yang sedang ditampilkan di modal preview. null = modal tertutup.
const previewItem = ref(null);

function openPreview(item) {
  // Jangan buka modal kalau gambar belum berhasil dimuat / gagal
  if (imageStatus[item.id] !== "loaded") return;
  previewItem.value = item;
}

function closePreview() {
  previewItem.value = null;
}

function handlePreviewKeydown(event) {
  if (event.key === "Escape") closePreview();
}

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
  { value: "chibi", label: () => t('input.categoryChibi') },
  { value: "anime", label: () => t('input.categoryAnime') },
  { value: "furry", label: () => t('input.categoryFurry') },
  { value: "kawaii", label: () => t('input.categoryKawaii') },
  { value: "spyxfamily", label: () => t('input.categorySpyxfamily') },
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
  document.addEventListener("keydown", handlePreviewKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutsideSort);
  document.removeEventListener("keydown", handlePreviewKeydown);
});
</script>

<template>

<div class="page-glow glow-1"></div>
<div class="page-glow glow-2"></div>

  <div class="history-page">
    <div class="page-header">
      <button class="back-btn" @click="emit('back-from-history')">&larr; {{ $t('history.back') }}</button>
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
      <div v-for="n in 10" :key="'skeleton-' + n" class="history-card skeleton-card">
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
        <div
          class="thumbnail"
          :class="{ clickable: imageStatus[item.id] === 'loaded' }"
          @click="openPreview(item)"
        >
          <!-- Overlay spinner selama gambar masih dimuat -->
          <div v-if="imageStatus[item.id] !== 'loaded' && imageStatus[item.id] !== 'error'" class="thumb-loading">
            <span class="spinner"></span>
          </div>

          <!-- Fallback kalau gambar gagal dimuat -->
          <div v-else-if="imageStatus[item.id] === 'error'" class="thumb-error">
            <span>{{ $t('history.imageFailed') || 'Gagal memuat gambar' }}</span>
          </div>

          <!-- Ikon kaca pembesar saat hover, menandakan gambar bisa diperbesar -->
          <div v-if="imageStatus[item.id] === 'loaded'" class="thumb-zoom-hint">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="7" stroke="white" stroke-width="2" />
              <path d="M21 21L16.65 16.65" stroke="white" stroke-width="2" stroke-linecap="round" />
            </svg>
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

    <!-- ===== Modal Preview ===== -->
    <Transition name="modal-fade">
      <div
        v-if="previewItem"
        class="preview-overlay"
        @click.self="closePreview"
      >
        <div class="preview-modal">
          <button class="preview-close" @click="closePreview" :title="$t('history.close') || 'Tutup'">
            &times;
          </button>

          <div class="preview-body">
            <div class="preview-image-wrap">
              <img
                :src="getImageUrl(previewItem.image_url)"
                :alt="previewItem.image_name"
                class="preview-image"
              />
            </div>

            <div class="preview-info">
              <h3 class="preview-name" :title="previewItem.image_name">
                {{ previewItem.image_name }}
              </h3>

              <div class="preview-badges">
                <span
                  class="model-badge"
                  :class="previewItem.model === 'advanced' ? 'advanced' : 'basic'"
                >
                  {{ previewItem.model === "advanced"
                    ? $t('history.filterAdvanced')
                    : $t('history.filterBasic') }}
                </span>
                <span v-if="getStyleLabel(previewItem)" class="style-badge">
                  {{ getStyleLabel(previewItem) }}
                </span>
              </div>

              <dl class="preview-meta-list">
                <div class="preview-meta-row">
                  <dt>{{ $t('history.createdAt') || 'Tanggal dibuat' }}</dt>
                  <dd>{{ formatDate(previewItem.created_at) }}</dd>
                </div>
                <div v-if="previewItem.width && previewItem.height" class="preview-meta-row">
                  <dt>{{ $t('history.dimensions') || 'Dimensi' }}</dt>
                  <dd>{{ previewItem.width }} &times; {{ previewItem.height }} px</dd>
                </div>
                <div v-if="previewItem.file_size" class="preview-meta-row">
                  <dt>{{ $t('history.fileSize') || 'Ukuran file' }}</dt>
                  <dd>{{ (previewItem.file_size / 1024).toFixed(1) }} KB</dd>
                </div>
              </dl>

              <div class="preview-actions">
                <button class="btn download" @click="downloadImage(previewItem)">
                  {{ $t('history.download') }}
                </button>
                <button
                  class="btn delete"
                  @click="deleteHistory(previewItem); closePreview()"
                >
                  {{ $t('history.delete') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
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
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}

/* Layar besar/menengah, sebelum tablet */
@media (max-width: 1100px) {
  .history-grid {
    grid-template-columns: repeat(4, 1fr);
  }
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
    height: 30px;
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
  height: 100%;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.history-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.history-card:active {
  transform: scale(1.05);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
}

.history-card .actions {
  cursor: default;
}

.thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--bg-accent-soft);
  overflow: hidden;
}

.thumbnail.clickable {
  cursor: zoom-in;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
  transition: transform 0.25s ease;
}

.thumbnail.clickable:hover img {
  transform: scale(1.05);
}

/* Ikon kaca pembesar yang muncul saat hover di atas thumbnail */
.thumb-zoom-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0);
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease;
  pointer-events: none;
  z-index: 2;
}

.thumbnail.clickable:hover .thumb-zoom-hint {
  opacity: 1;
  background: rgba(0, 0, 0, 0.25);
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
  padding: 10px 12px 4px;
  flex: 1;
}

.image-name {
  font-weight: 600;
  font-size: 13px;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.date {
  font-size: 11px;
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
  font-size: 9px;
  font-weight: 700;
  padding: 3px 8px;
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
  font-size: 9px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  white-space: nowrap;
  background: #dbeafe;
  color: #1d4ed8;
}

.actions {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  flex-shrink: 0;
}

.btn {
  flex: 1;
  border: 1px solid transparent;
  border-radius: 8px;
  height: 34px;
  padding: 0;
  font-size: 12px;
  line-height: 1;
  font-weight: 600;
  cursor: pointer;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn.download {
  background: var(--accent-color); 
  color: white;
  border-color: var(--accent-color);
}

.btn.delete {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fee2e2;
}

.empty {
  text-align: center;
  color: var(--text-secondary);
  margin-top: 40px;
}

/* ===== Modal Preview ===== */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 20, 0.65);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 2000;
}

.preview-modal {
  position: relative;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  display: flex;
}

.preview-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.2s ease;
}

.preview-close:hover {
  background: rgba(0, 0, 0, 0.7);
}

.preview-body {
  display: flex;
  width: 100%;
  max-height: 90vh;
}

.preview-image-wrap {
  flex: 1.4;
  min-width: 0;
  background: var(--bg-accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;
  max-height: 90vh;
  object-fit: contain;
  display: block;
}

.preview-info {
  flex: 1;
  min-width: 260px;
  max-width: 340px;
  padding: 24px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

.preview-name {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  word-break: break-word;
}

.preview-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.preview-meta-list {
  margin: 0;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-meta-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
}

.preview-meta-row dt {
  color: var(--text-secondary);
}

.preview-meta-row dd {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
  text-align: right;
}

.preview-actions {
  margin-top: auto;
  display: flex;
  gap: 10px;
  padding-top: 10px;
}

/* Transisi buka/tutup modal */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .preview-modal,
.modal-fade-leave-active .preview-modal {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .preview-modal,
.modal-fade-leave-to .preview-modal {
  transform: scale(0.96);
}

/* Tablet & mobile: gambar di atas, info di bawah, bisa di-scroll */
@media (max-width: 720px) {
  .preview-overlay {
    padding: 0;
  }

  .preview-modal {
    max-height: 100vh;
    height: 100%;
    border-radius: 0;
  }

  .preview-body {
    flex-direction: column;
    max-height: 100vh;
    overflow-y: auto;
  }

  .preview-image-wrap {
    flex: none;
    height: 45vh;
  }

  .preview-info {
    max-width: none;
    flex: none;
  }
}

/* =====================================
   SOFT GLOW
===================================== */

.page-glow {
  position: fixed;

  width: 420px;
  height: 420px;

  border-radius: 50%;

  pointer-events: none;

  filter: blur(120px);

  opacity: 0.16;

  z-index: 0;
}


/* =====================================
   GLOW POJOK KIRI ATAS
===================================== */

.glow-1 {
  top: -230px;
  left: -230px;

  background: #694cff;
}


/* =====================================
   GLOW POJOK KANAN BAWAH
===================================== */

.glow-2 {
  right: -230px;
  bottom: -230px;

  background: #8b5cf6;
}


/* =====================================
   GLOW BAWAH TENGAH
   HAPUS / JANGAN DIGUNAKAN
===================================== */

/*
.glow-3 {
  display: none;
}
*/

</style>