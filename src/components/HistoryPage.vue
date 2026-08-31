<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from 'vue-i18n'

const emit = defineEmits(["back-from-history"]);
const { t, te, locale } = useI18n()

// helper: pakai translation kalau key-nya ada di file i18n,
// kalau belum ada (misal 'history.edit' belum didaftarkan), pakai fallback teks biasa
function tr(key, fallback) {
  return te(key) ? t(key) : fallback;
}

// Directive untuk animasi "muncul" saat elemen masuk ke area layar
// (sama seperti di CatalogPage.vue), jadi card yang posisinya di
// bawah tetap ikut animasi saat di-scroll ke sana, bukan langsung
// semua jalan sekaligus pas halaman dimuat.
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

const histories = ref([]);
const searchQuery = ref("");
const modelFilter = ref("all");
const sortOrder = ref("newest");
const isSortMenuOpen = ref(false);
const sortDropdownRef = ref(null);
const sortOptions = [
  { value: "newest", label: () => t('history.sortNewest') },
  { value: "oldest", label: () => t('history.sortOldest') },
];

// ===== Ref & fungsi untuk tombol geser filter kategori (mobile) =====
const filterTabsRef = ref(null);

function scrollFilterTabs(amount) {
  filterTabsRef.value?.scrollBy({ left: amount, behavior: "smooth" });
}

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

const previewItem = ref(null);

function openPreview(item) {
  if (imageStatus[item.id] !== "loaded") return;
  if (editingId.value === item.id) return; // jangan buka preview saat lagi rename
  previewItem.value = item;
}

function closePreview() {
  previewItem.value = null;
}

function handlePreviewKeydown(event) {
  if (event.key === "Escape") {
    if (editingId.value !== null) {
      cancelEdit();
    } else {
      closePreview();
    }
  }
}

const isLoadingList = ref(true);
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

const MODEL_TIERS = ["basic", "advanced"];
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

function getItemCategories(item) {
  for (const field of FIELD_CANDIDATES) {
    if (item[field]) {
      return String(item[field])
        .split(",")
        .map((c) => c.trim().toLowerCase().replace(/[\s_-]/g, ""))
        .filter(Boolean);
    }
  }
  return [];
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
        matchesFilter = getItemCategories(item).includes(filter);
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
    const url = `${API_BASE}/history/${currentUserId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request gagal: ${response.status}`);
    }

    const data = await response.json();

    histories.value = Array.isArray(data)
      ? data
      : data.data || [];

    histories.value.forEach((item) => {
      setImageStatus(item.id, "loading");
    });

  } catch (error) {
    console.error("❌ Gagal load history:", error);
  } finally {
    isLoadingList.value = false;
  }
}

function getImageUrl(path) {
  return `${API_BASE}/${path}`;
}

// Map dari kode locale aplikasi ke locale tag yang dikenali Intl/toLocaleDateString
const dateLocaleMap = {
  id: "id-ID",
  en: "en-US",
  ja: "ja-JP",
  ko: "ko-KR",
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(dateLocaleMap[locale.value] || "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Waktu relatif ("2 hari lalu", "Baru saja", dst), dihitung dari created_at.
// Teksnya sekarang diambil dari i18n (t()) supaya ikut berubah sesuai bahasa aktif.
function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return t('history.justNow');

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t('history.minutesAgo', { n: diffMin });

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return t('history.hoursAgo', { n: diffHour });

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return t('history.daysAgo', { n: diffDay });

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return t('history.monthsAgo', { n: diffMonth });

  const diffYear = Math.floor(diffMonth / 12);
  return t('history.yearsAgo', { n: diffYear });
}

// Format file diambil dari ekstensi URL gambar (mis. .png -> "PNG")
function getFileFormat(url) {
  if (!url) return null;
  const match = String(url).match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  return match ? match[1].toUpperCase() : null;
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

// ===================================================
// ===== FITUR EDIT / RENAME NAMA GAMBAR (BARU) =====
// ===================================================
const editingId = ref(null);
const editingValue = ref("");
const isSavingEdit = ref(false);
const editInputRef = ref(null);

function startEdit(item) {
  editingId.value = item.id;
  editingValue.value = item.image_name || "";
  // fokus & select isi input begitu muncul
  requestAnimationFrame(() => {
    editInputRef.value?.focus();
    editInputRef.value?.select();
  });
}

function cancelEdit() {
  editingId.value = null;
  editingValue.value = "";
}

async function saveEdit(item) {
  const newName = editingValue.value.trim();

  if (!newName) {
    alert(t('history.renameEmpty') || 'Nama file tidak boleh kosong');
    return;
  }

  if (newName === item.image_name) {
    cancelEdit();
    return;
  }

  isSavingEdit.value = true;
  try {
    const response = await fetch(`${API_BASE}/history/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_name: newName }),
    });

    if (!response.ok) {
      throw new Error(`Request gagal: ${response.status}`);
    }

    const data = await response.json();

    if (data.success === false) {
      throw new Error(data.message || "Gagal mengubah nama");
    }

    // update state lokal supaya UI langsung berubah tanpa reload
    item.image_name = newName;
    if (previewItem.value && previewItem.value.id === item.id) {
      previewItem.value.image_name = newName;
    }

    cancelEdit();
  } catch (error) {
    console.error("Gagal rename:", error);
    alert(t('history.renameError') || 'Terjadi kesalahan saat mengubah nama file');
  } finally {
    isSavingEdit.value = false;
  }
}

function handleEditKeydown(event, item) {
  if (event.key === "Enter") {
    event.preventDefault();
    saveEdit(item);
  } else if (event.key === "Escape") {
    event.preventDefault();
    cancelEdit();
  }
}

function getStyleLabels(item) {
  return getItemCategories(item).map((val) => {
    const found = filterTabs.find((t) => t.value === val);
    return found ? found.label() : val;
  });
}

// ===================================================
// ===== TOOLBAR & FILTER COLLAPSIBLE SAAT SCROLL (MOBILE) =====
// ===================================================
const isToolbarVisible = ref(true);
const lastScrollY = ref(0);
const MOBILE_BREAKPOINT = 600;
const SCROLL_THRESHOLD = 60; // px, jarak minimal scroll sebelum toolbar disembunyikan
let scrollTicking = false;

function updateToolbarVisibility() {
  // fitur collapse ini cuma aktif di layar mobile, desktop tetap selalu terlihat
  if (window.innerWidth > MOBILE_BREAKPOINT) {
    isToolbarVisible.value = true;
    lastScrollY.value = window.scrollY;
    scrollTicking = false;
    return;
  }

  const currentY = window.scrollY;

  if (currentY <= SCROLL_THRESHOLD) {
    // masih dekat atas halaman -> selalu tampilkan
    isToolbarVisible.value = true;
  } else if (currentY > lastScrollY.value) {
    // scroll ke bawah -> sembunyikan
    isToolbarVisible.value = false;
  } else if (currentY < lastScrollY.value) {
    // scroll ke atas -> tampilkan lagi
    isToolbarVisible.value = true;
  }

  lastScrollY.value = currentY;
  scrollTicking = false;
}

function handleScroll() {
  // throttle pakai requestAnimationFrame supaya update state selaras
  // dengan siklus render browser (tidak kaku/patah-patah saat scroll cepat)
  if (!scrollTicking) {
    scrollTicking = true;
    window.requestAnimationFrame(updateToolbarVisibility);
  }
}

function handleResize() {
  if (window.innerWidth > MOBILE_BREAKPOINT) {
    isToolbarVisible.value = true;
  }
}

onMounted(() => {
  loadHistory();
  document.addEventListener("click", handleClickOutsideSort);
  document.addEventListener("keydown", handlePreviewKeydown);
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutsideSort);
  document.removeEventListener("keydown", handlePreviewKeydown);
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
<div class="history-page-wrapper">
  <div class="page-glow glow-1"></div>
  <div class="page-glow glow-2"></div>

  <div class="history-page">
    <div class="page-header">
      <button class="back-btn" @click="emit('back-from-history')" :title="$t('history.back')">
        &larr; <span class="back-btn-text">{{ $t('history.back') }}</span>
      </button>
      <h2>{{ $t('history.title') }}</h2>
    </div>

    <div class="toolbar-filter-wrap" :class="{ collapsed: !isToolbarVisible }">
     <div class="toolbar-filter-inner">
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

      <!-- ===== Filter kategori: tombol geser hanya tampil di mobile ===== -->
      <div class="filter-tabs-wrap">
        <button class="filter-nav-btn" @click="scrollFilterTabs(-160)" aria-label="Geser kiri">
          &#10094;
        </button>

        <div class="filter-tabs" ref="filterTabsRef">
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

        <button class="filter-nav-btn" @click="scrollFilterTabs(160)" aria-label="Geser kanan">
          &#10095;
        </button>
      </div>
     </div>
    </div>

    <p v-if="!isLoadingList && histories.length > 0" class="result-count">
      {{ filteredHistories.length }} {{ $t('history.imagesFound') }}
    </p>

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
        v-for="(item, index) in filteredHistories"
        :key="item.id"
        class="history-card"
        v-reveal
        :style="{ transitionDelay: (index % 5) * 0.1 + 's' }"
      >
        <div
          class="thumbnail"
          :class="{ clickable: imageStatus[item.id] === 'loaded' }"
          @click="openPreview(item)"
        >
          <div v-if="imageStatus[item.id] !== 'loaded' && imageStatus[item.id] !== 'error'" class="thumb-loading">
            <span class="spinner"></span>
          </div>

          <div v-else-if="imageStatus[item.id] === 'error'" class="thumb-error">
            <span>{{ tr('history.imageFailed', 'Gagal memuat gambar') }}</span>
          </div>

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
          <!-- ===== Nama file: mode normal vs mode edit ===== -->
          <div v-if="editingId === item.id" class="edit-name-row" @click.stop>
            <input
              ref="editInputRef"
              v-model="editingValue"
              type="text"
              class="edit-name-input"
              :disabled="isSavingEdit"
              @keydown="handleEditKeydown($event, item)"
            />
            <button
              class="edit-icon-btn confirm"
              :disabled="isSavingEdit"
              :title="tr('history.saveRename', 'Simpan')"
              @click="saveEdit(item)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button
              class="edit-icon-btn cancel"
              :disabled="isSavingEdit"
              :title="tr('history.cancelRename', 'Batal')"
              @click="cancelEdit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p v-else class="image-name" :title="item.image_name">
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
              <span
                v-for="label in getStyleLabels(item)"
                :key="label"
                class="style-badge"
                :title="label"
              >
                {{ label }}
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
          <button class="preview-close" @click="closePreview" :title="tr('history.close', 'Tutup')">
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
              <!-- ===== Nama file di modal preview: mode normal vs mode edit ===== -->
              <div v-if="editingId === previewItem.id" class="edit-name-row">
                <input
                  ref="editInputRef"
                  v-model="editingValue"
                  type="text"
                  class="edit-name-input"
                  :disabled="isSavingEdit"
                  @keydown="handleEditKeydown($event, previewItem)"
                />
                <button
                  class="edit-icon-btn confirm"
                  :disabled="isSavingEdit"
                  :title="tr('history.saveRename', 'Simpan')"
                  @click="saveEdit(previewItem)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <button
                  class="edit-icon-btn cancel"
                  :disabled="isSavingEdit"
                  :title="tr('history.cancelRename', 'Batal')"
                  @click="cancelEdit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <h3 v-else class="preview-name" :title="previewItem.image_name">
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
                <span
                  v-for="label in getStyleLabels(previewItem)"
                  :key="label"
                  class="style-badge"
                >
                  {{ label }}
                </span>
              </div>

              <div class="preview-divider"></div>

              <dl class="preview-meta-list">
                <div class="preview-meta-row">
                  <dt>{{ tr('history.createdAt', 'Tanggal dibuat') }}</dt>
                  <dd>{{ formatDate(previewItem.created_at) }}</dd>
                </div>
                <div class="preview-meta-row">
                  <dt>{{ tr('history.time', 'Waktu') }}</dt>
                  <dd>{{ timeAgo(previewItem.created_at) }}</dd>
                </div>
                <div v-if="getFileFormat(previewItem.image_url)" class="preview-meta-row">
                  <dt>{{ tr('history.fileFormat', 'Format file') }}</dt>
                  <dd>{{ getFileFormat(previewItem.image_url) }}</dd>
                </div>
                <div v-if="previewItem.width && previewItem.height" class="preview-meta-row">
                  <dt>{{ tr('history.dimensions', 'Dimensi') }}</dt>
                  <dd>{{ previewItem.width }} &times; {{ previewItem.height }} px</dd>
                </div>
                <div v-if="previewItem.file_size" class="preview-meta-row">
                  <dt>{{ tr('history.fileSize', 'Ukuran file') }}</dt>
                  <dd>{{ (previewItem.file_size / 1024).toFixed(1) }} KB</dd>
                </div>
              </dl>

              <div class="preview-actions">
                <button class="btn edit" @click="startEdit(previewItem)">
                  {{ tr('history.edit', 'Edit') }}
                </button>
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
</div>
</template>

<style scoped>
.history-page-wrapper {
  margin-top: -40px;
}

.history-page {
  width: 100vw !important;
  max-width: 100vw !important;
  margin-left: calc(-50vw + 50%) !important; 
  padding: 0px clamp(20px, 6vw, 100px) 16px !important;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  margin-bottom: 16px;
}

.history-page h2 {
  margin: 0;
  font-size: 22px;
}

/* ===== Tombol kembali: desktop = teks + panah ===== */
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
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

/* ===== Filter tabs + tombol geser (tombol geser default disembunyikan, hanya muncul di mobile) ===== */
.filter-tabs-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 0;
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

.filter-nav-btn {
  display: none; /* disembunyikan di desktop, dimunculkan lagi di media query mobile */
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.filter-nav-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
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

/* =====================================
   TOOLBAR + FILTER: bisa "collapse" pas scroll ke bawah (mobile)
   ---------------------------------------
   .toolbar-filter-wrap membungkus search+sort+filter tabs.
   Kelas .collapsed cuma di-toggle lewat JS saat layar <= 600px,
   jadi di desktop wrapper ini selalu dalam kondisi normal.

   Dipakai teknik "grid-template-rows: 1fr -> 0fr" (bukan max-height
   dengan angka tebakan) supaya animasi ke tinggi asli konten
   selalu mulus, seberapa pun tinggi kontennya berubah.
===================================== */
.toolbar-filter-wrap {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.28s ease;
  opacity: 1;
  /* mencegah browser "scroll anchoring" mengoreksi posisi scroll
     tiap frame animasi berjalan - ini penyebab utama grid gambar
     di bawah kelihatan patah-patah/kaku saat toolbar mengecil */
  overflow-anchor: none;
  will-change: grid-template-rows;
}

.toolbar-filter-wrap.collapsed {
  grid-template-rows: 0fr;
  opacity: 0;
  pointer-events: none;
}

.toolbar-filter-inner {
  overflow: hidden;
  min-height: 0;
}

/* grid gambar diisolasi renderingnya (CSS containment) supaya browser
   tidak perlu menghitung ulang layout/paint semua card tiap kali
   tinggi elemen di atasnya (toolbar) berubah - card cukup "digeser"
   posisinya secara ringan, bukan direnderulang */
.history-grid {
  contain: layout style;
}

@media (max-width: 600px) {
  /* header dikembalikan ke perilaku normal (ikut scroll, tidak sticky),
     karena efek sticky+blur sebelumnya membuat area blur terlihat
     seperti kotak/tombol akibat kontras dengan glow di background */
}

/* ===== GRID ===== */
.history-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  align-items: stretch; /* penting: semua card dalam 1 row diregangkan sama tinggi */
}

@media (max-width: 1100px) {
  .history-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 900px) {
  .history-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ===== MOBILE: panah saja untuk tombol kembali + tombol geser filter muncul ===== */
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

  .back-btn-text {
    display: none;
  }

  .back-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: 8px;
    justify-content: center;
    font-size: 18px;
  }

  .filter-nav-btn {
    display: flex;
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
    min-height: 82px; /* dinaikkan sedikit karena nama file sekarang lebih besar */
  }

  .image-name {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.3;
  }

  .date {
    font-size: 11px;
  }

  .model-badge,
  .style-badge {
    font-size: 9px;
    padding: 0 7px;
  }

  .actions {
    padding: 8px 10px;
    gap: 6px;
  }

  .btn {
    height: 34px;
    font-size: 14px;
    font-weight: 700;
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

  /* Kondisi awal sebelum card masuk ke layar. Class .is-visible
     ditambahkan oleh directive v-reveal saat card terdeteksi masuk
     viewport (scroll-triggered), bukan langsung semua jalan saat
     halaman baru dibuka. */
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.7s ease, transform 0.7s ease, box-shadow 0.18s ease;
}

.history-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.history-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.history-card:active {
  transform: scale(1.05);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
}

.history-card .actions {
  cursor: default;
}

/* Skeleton loading tidak perlu ikut animasi reveal, langsung tampil */
.skeleton-card {
  opacity: 1;
  transform: none;
  transition: none;
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

/* =====================================
   META (nama file, tanggal, badge)
===================================== */
.meta {
  padding: 10px 12px 4px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.image-name {
  font-weight: 600;
  font-size: 13px;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== FITUR RENAME: input inline pengganti nama file ===== */
.edit-name-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 4px;
  cursor: default;
}

.edit-name-input {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 6px;
  border: 1px solid var(--accent-color);
  border-radius: 6px;
  background: var(--bg-card);
  color: var(--text-primary);
  outline: none;
}

.edit-icon-btn {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.edit-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-icon-btn.confirm {
  background: #dcfce7;
  color: #16a34a;
}

.edit-icon-btn.cancel {
  background: #fee2e2;
  color: #dc2626;
}

.date {
  font-size: 11px;
  color: var(--text-secondary);
  margin: 0;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.badges {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  flex-wrap: wrap;
  min-width: 0;
  min-height: 44px; /* reservasi ruang setara 2 baris badge, supaya tombol Unduh/Hapus tetap sejajar walau jumlah badge beda-beda antar card */
  align-content: flex-start;
}

.model-badge,
.style-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  line-height: 1;
  box-sizing: border-box;
  font-size: 9px;
  font-weight: 700;
  padding: 0 8px;
  border-radius: 999px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-badge {
  flex-shrink: 0;
  max-width: 40%;
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
  background: #dbeafe;
  color: #1d4ed8;
  flex-shrink: 1;
  min-width: 0;
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

.btn.edit {
  background: var(--bg-accent-soft);
  color: var(--accent-color);
  border-color: var(--bg-accent-soft);
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
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  box-sizing: border-box;
}

.preview-image {
  width: 100%;
  height: 100%;
  max-height: calc(90vh - 64px);
  object-fit: contain;
  display: block;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.preview-info {
  flex: 1;
  min-width: 280px;
  max-width: 360px;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
  background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-hover) 140%);
}

.preview-name {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  word-break: break-word;
}

.preview-info .edit-name-row {
  margin: 0;
}

.preview-info .edit-name-input {
  font-size: 15px;
  padding: 6px 8px;
}

.preview-info .edit-icon-btn {
  width: 26px;
  height: 26px;
}

.preview-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.preview-divider {
  height: 3px;
  width: 44px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-color), transparent);
}

.preview-meta-list {
  margin: 0;
  padding-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  padding-top: 16px;
}

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

.glow-1 {
  top: -230px;
  left: -230px;
  background: #694cff;
}

.glow-2 {
  right: -230px;
  bottom: -230px;
  background: #8b5cf6;
}
</style>