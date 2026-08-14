<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useI18n } from 'vue-i18n'

const emit = defineEmits(["next", "history", "logout"]);
const { t } = useI18n()

const image = ref(null);
const imagePreview = ref(null);
const isDragging = ref(false);

const fileError = ref("");
const isSplitting = ref(false);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const selectedModel = ref("basic");
const isModelDropdownOpen = ref(false);
const isMobileMenuOpen = ref(false);

const modelOptions = {
  basic: "Basic",
  advanced: "Advanced",
};

// ===== Kategori style gambar (pilihan user) =====
const selectedCategory = ref("none");
const isCategoryDropdownOpen = ref(false);

const categoryOptions = {
  none: "Tidak ada / Umum",
  chibi: "Chibi",
  anime: "Anime",
  furry: "Furry",
  kawaii: "Kawaii",
  spyxfamily: "Spy x Family",
};

const availableCategories = computed(() =>
  Object.entries(categoryOptions).filter(
    ([value]) => value !== selectedCategory.value
  )
);

function toggleCategoryDropdown() {
  isCategoryDropdownOpen.value = !isCategoryDropdownOpen.value;

  if (isCategoryDropdownOpen.value) {
    nextTick(() => {
      const menu = document.querySelector(".category-dropdown .model-dropdown-menu");
      menu?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
}

function selectCategory(value) {
  selectedCategory.value = value;
  isCategoryDropdownOpen.value = false;
}

// Biaya credit per model. Harus SAMA dengan amount yang nanti dikirim
// ke endpoint /deduct-credit di backend.
const creditCost = {
  basic: 1,
  advanced: 3,
};

// TODO: sesuaikan dengan sistem auth kamu (misal dari localStorage/session)
const currentUserId = Number(localStorage.getItem("userId"));

// Sisa credit user. Diambil dari backend saat halaman dibuka.
const remainingCredits = ref(0);
const isLoadingCredits = ref(true);
const creditError = ref("");

async function fetchRemainingCredits() {
  isLoadingCredits.value = true;
  creditError.value = "";

  console.log("User ID dari localStorage:", currentUserId);

  try {
    const response = await fetch(
      `http://localhost:3000/user-credit?user_id=${currentUserId}`,
    );
    const data = await response.json();

    if (data.success) {
      remainingCredits.value = data.credit;
    } else {
      creditError.value = t('input.creditLoadFailed');
    }
  } catch (error) {
    console.error(error);
    creditError.value = t('input.creditLoadFailed');
  } finally {
    isLoadingCredits.value = false;
  }
}

onMounted(() => {
  fetchRemainingCredits();
});

async function addCredit() {
  try {
    const response = await fetch("http://localhost:3000/add-credit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: currentUserId,
        amount: 10,
      }),
    });

    const data = await response.json();

    console.log(data);

    if (data.success) {
      remainingCredits.value = data.credit;
      alert(t('input.creditAdded'));
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error(error);
    alert(t('input.creditAddFailed'));
  }
}

const estimatedCredit = computed(() => creditCost[selectedModel.value]);
const hasEnoughCredit = computed(
  () => remainingCredits.value >= estimatedCredit.value,
);

function toggleModelDropdown() {
  isModelDropdownOpen.value = !isModelDropdownOpen.value;
}

function selectModel(value) {
  selectedModel.value = value;
  isModelDropdownOpen.value = false;
}

function processFile(file) {
  // Reset
  fileError.value = "";
  image.value = null;
  imagePreview.value = null;

  if (!file) return;

  // Cek format file
  if (!ALLOWED_TYPES.includes(file.type)) {
    fileError.value = t('input.formatError');
    return;
  }

  // Cek ukuran file
  if (file.size > MAX_FILE_SIZE) {
    fileError.value = t('input.sizeError');
    return;
  }

  image.value = file;
  imagePreview.value = URL.createObjectURL(file);
}

function chooseFile(event) {
  const file = event.target.files[0];
  processFile(file);
}

// ===== Drag & drop =====
function handleDragOver(event) {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(event) {
  event.preventDefault();
  isDragging.value = false;
}

function handleDrop(event) {
  event.preventDefault();
  isDragging.value = false;

  const file = event.dataTransfer.files[0];
  processFile(file);
}

// Menghapus gambar yang sudah diupload, tanpa membuka dialog file lagi.
function removeImage(event) {
  event.preventDefault();
  event.stopPropagation();

  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value);
  }

  image.value = null;
  imagePreview.value = null;
  fileError.value = "";
}

async function handleSplitClick() {
  if (!image.value) {
    alert(t('input.uploadFirstAlert'));
    return;
  }

  if (!hasEnoughCredit.value) {
    alert(t('input.notEnoughCreditAlert'));
    return;
  }

  if (isSplitting.value) {
    return;
  }

  try {
    isSplitting.value = true;

    console.log("🚀 Mengirim gambar ke backend...");
    console.log("Model:", selectedModel.value);
    console.log("Kategori:", selectedCategory.value);
    console.log("User ID:", currentUserId);

    const formData = new FormData();
    formData.append("image", image.value);

    const response = await fetch(
      "http://localhost:3000/remove-background",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    console.log("📦 Response backend:", data);

    if (!response.ok || !data.success) {
      throw new Error(
    data.message || t('input.processError')
     );
    }

    console.log(
      "✅ Background berhasil dihapus:",
      data.result
    );

    const resultUrl =
      `http://localhost:3000${data.result}`;

    emit("next", {
      image: image.value,
      imagePreview: imagePreview.value,
      model: selectedModel.value,
      category: selectedCategory.value,
      userId: currentUserId,
      creditAmount: estimatedCredit.value,
      layers: [resultUrl],
      result: resultUrl,
    });

  } catch (error) {
    console.error("❌ Split image gagal:", error);

    alert(
      error instanceof Error
        ? error.message
        : t('input.processError')
    );

  } finally {
    isSplitting.value = false;
  }
}
</script>

<template>
  <div class="input-card" :class="{ 'category-open': isCategoryDropdownOpen }">
    <div class="card-header">
      <h2>{{ $t('input.title') }}</h2>

      <!-- Desktop actions (disembunyikan di mobile) -->
      <div class="header-actions">
        <span class="credit-info" :class="{ 'credit-error': creditError }">
          <template v-if="isLoadingCredits">{{ $t('input.loadingCredit') }}</template>
          <template v-else-if="creditError">{{ creditError }}</template>
          <template v-else>💎 {{ remainingCredits }} {{ $t('input.credits') }}</template>
        </span>

        <button class="add-credit-btn" @click="addCredit">{{ $t('input.addCredit') }}</button>
        <button class="history-btn" @click="emit('history')">{{ $t('input.history') }}</button>
        <button class="logout-btn" @click="emit('logout')">{{ $t('input.logout') }}</button>
        <div class="info">i</div>
      </div>

      <!-- Group khusus mobile: Credit + Hamburger -->
      <div class="mobile-right">
        <span class="credit-info mobile-credit" :class="{ 'credit-error': creditError }">
          <template v-if="isLoadingCredits">{{ $t('input.loadingCredit') }}</template>
          <template v-else-if="creditError">{{ creditError }}</template>
          <template v-else>💎 {{ remainingCredits }} {{ $t('input.credits') }}</template>
        </span>

        <button
          type="button"
          class="add-credit-btn mobile-add-credit-btn"
          @click="addCredit"
        >
          {{ $t('input.addCredit') }}
        </button>

        <button
          type="button"
          class="mobile-menu-btn"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <!-- Dropdown menu (hanya tombol aksi) -->
      <div v-if="isMobileMenuOpen" class="mobile-menu">
        <button class="history-btn" @click="emit('history')">{{ $t('input.history') }}</button>
        <button class="logout-btn" @click="emit('logout')">{{ $t('input.logout') }}</button>
      </div>
    </div>

    <label class="label"> {{ $t('input.uploadLabel') }} </label>

    <label
      class="upload-box"
      :class="{ 'is-dragging': isDragging }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        @change="chooseFile"
        hidden
      />

      <div class="upload-content">
        <template v-if="!imagePreview">
          <div class="upload-icon">
            <i class="fa-regular fa-image"></i>
          </div>

          <p>{{ $t('input.clickUpload') }}</p>
          <p class="upload-subtext">{{ $t('input.dragDrop') }}</p>
          <p class="upload-format">{{ $t('input.uploadFormat') }}</p>
        </template>

        <template v-else>
          <img :src="imagePreview" class="preview-img" alt="Preview" />

          <p class="preview-filename">{{ image.name }}</p>

          <button
            type="button"
            class="remove-image-btn"
            :title="$t('input.removeImage')"
            @click="removeImage"
          >
            &times;
          </button>
        </template>
      </div>
    </label>

    <p v-if="fileError" class="file-error">
      {{ fileError }}
    </p>

    <label class="label"> {{ $t('input.aiModel') }} </label>

    <div class="model-info">
      <span class="badge" :title="$t('input.newBadgeTitle')">
        {{ $t('input.newBadge') }}
      </span>

      <span>
        <strong>{{ $t('input.advanced') }}</strong> {{ $t('input.advancedDesc') }}
      </span>
    </div>

    <p class="credit-estimate" :class="{ warning: !hasEnoughCredit }">
      {{ $t('input.estimateCost') }} <strong>{{ estimatedCredit }} {{ $t('input.creditUnit')}}</strong>
      <span v-if="!hasEnoughCredit"> {{ $t('input.notEnoughCredit') }}</span>
    </p>

    <div class="model-dropdown">
      <button
        type="button"
        class="model-dropdown-btn"
        :class="{ 'is-open': isModelDropdownOpen }"
        @click="toggleModelDropdown"
      >
        <span>{{ selectedModel === 'basic' ? $t('input.basic') : $t('input.advanced') }}</span>
        <span class="chevron" :class="{ open: isModelDropdownOpen }"
          >&#9662;</span
        >
      </button>

      <div v-if="isModelDropdownOpen" class="model-dropdown-menu">
        <div
          v-if="selectedModel !== 'basic'"
          class="model-dropdown-item"
          @click="selectModel('basic')"
        >
          {{ $t('input.basic') }}
        </div>

        <div
          v-if="selectedModel !== 'advanced'"
          class="model-dropdown-item"
          @click="selectModel('advanced')"
        >
          {{ $t('input.advanced') }}
          <span class="badge badge-small">{{ $t('input.newBadge') }}</span>
        </div>
      </div>
    </div>

    <!-- ===== Pilihan Kategori Style Gambar ===== -->
    <label class="label category-label">Kategori Gaya Gambar</label>

    <div class="model-dropdown category-dropdown">
      <button
        type="button"
        class="model-dropdown-btn category-dropdown-btn"
        :class="{ 'is-open': isCategoryDropdownOpen }"
        @click="toggleCategoryDropdown"
      >
        <span>{{ categoryOptions[selectedCategory] }}</span>
        <span class="chevron" :class="{ open: isCategoryDropdownOpen }"
          >&#9662;</span
        >
      </button>

      <div v-if="isCategoryDropdownOpen" class="model-dropdown-menu">
        <div
          v-for="[value, label] in availableCategories"
          :key="value"
          class="model-dropdown-item"
          @click="selectCategory(value)"
        >
          {{ label }}
        </div>
      </div>
    </div>

    <button
      class="split-btn"
      :disabled="!image || !hasEnoughCredit || isSplitting"
      :title="
        !image
          ? $t('input.uploadFirstTitle')
          : !hasEnoughCredit
            ? $t('input.notEnoughCreditTitle')
            : ''
      "
      @click="handleSplitClick"
    >
      {{ isSplitting ? $t('input.processing') : $t('input.splitBtn') }}
    </button>
  </div>
</template>

<style scoped>
/* ===== Fix responsive: cegah card & gambar overflow di layar sempit ===== */
.input-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.upload-box {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.upload-content {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.preview-img {
  display: block;
  max-width: 100%;
  height: auto;
  max-height: 260px;
  object-fit: contain;
  margin: 0 auto;
}

.preview-filename {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 8px;
  box-sizing: border-box;
}

/* ===== Buttons & general ===== */
.add-credit-btn {
  border: none;
  background: #16a34a;
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}

.add-credit-btn:hover {
  opacity: 0.9;
}

.split-btn {
  margin-top: 16px;
  width: 100%;
  padding: 14px;
  border: 2px solid #7c3aed;
  border-radius: 12px;
  background: #7c3aed;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.25s;
}

.split-btn:hover {
  opacity: 0.9;
}

.split-btn:disabled {
  background: #c4b5fd;
  border-color: #c4b5fd;
  cursor: not-allowed;
  opacity: 0.7;
}

/* ===== Header ===== */
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  padding: 0;
}

.mobile-menu-btn span {
  display: block;
  width: 18px;
  height: 2px;
  background: #4f46e5;
  margin: 0 auto;
  border-radius: 2px;
}

.mobile-menu {
  display: none;
}

/* Group credit + hamburger (hanya untuk mobile) */
.mobile-right {
  display: none;
}

/* ===== Model Info ===== */
.model-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.model-info .badge {
  flex-shrink: 0;
  margin-top: 2px;
}

.model-info span:last-child {
  flex: 1;
  min-width: 0;
  line-height: 1.45;
  font-size: 14px;
  color: #4b5563;
}

/* ===== Credit badge ===== */
.credit-info {
  font-size: 13px;
  font-weight: 600;
  color: #4f46e5;
  background: #ede9fe;
  padding: 6px 12px;
  border-radius: 8px;
}

.credit-info.credit-error {
  color: #dc2626;
  background: #fee2e2;
}

/* ===== Badge ===== */
.badge {
  display: inline-flex;
  align-items: center;
  background: #7c3aed;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  margin-right: 6px;
}

.badge-small {
  margin-left: 8px;
  margin-right: 0;
  font-size: 10px;
  padding: 2px 7px;
  vertical-align: middle;
}

.model-dropdown-item.active .badge-small {
  background: #fff;
  color: #7c3aed;
}

/* ===== Credit estimate ===== */
.credit-estimate {
  margin-top: 10px;
  font-size: 13px;
  color: #4b5563;
}

.credit-estimate.warning {
  color: #dc2626;
  font-weight: 600;
}

/* ===== History & Logout ===== */
.history-btn {
  border: none;
  background: #ede9fe;
  color: #4f46e5;
  font-weight: 600;
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.history-btn:hover {
  opacity: 0.85;
}

.logout-btn {
  border: 1px solid #fca5a5;
  background: #fff;
  color: #dc2626;
  font-weight: 600;
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.logout-btn:hover {
  opacity: 0.85;
}

/* ===== Model Dropdown ===== */
.model-dropdown {
  position: relative;
  margin-top: 12px;
}

.model-dropdown-btn {
  width: 100%;
  padding: 14px;
  border: 2px solid #7c3aed;
  border-radius: 12px;
  background: #7c3aed;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  transition: 0.25s;
}

.model-dropdown-btn:hover {
  opacity: 0.9;
}

.chevron {
  font-size: 12px;
  transition: transform 0.2s;
}

.chevron.open {
  transform: rotate(180deg);
}

.model-dropdown-menu {
  position: absolute;
  top: 100%;
  margin-top: -2px;
  left: 0;
  right: 0;
  background: #fff;
  border: 2px solid #7c3aed;
  border-top: none;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  overflow: hidden;
  z-index: 10;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.model-dropdown-btn.is-open {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.model-dropdown-item {
  padding: 14px;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #7c3aed;
  cursor: pointer;
  transition: 0.2s;
}

.model-dropdown-item:hover {
  background: #f5f3ff;
}

.model-dropdown-item.active {
  background: #7c3aed;
  color: #fff;
}

/* ===== Kategori Style Dropdown ===== */
.category-label {
  margin-top: 4px;
}

.category-dropdown-btn {
  background: #4f46e5;
  border-color: #4f46e5;
}

.category-dropdown .model-dropdown-menu {
  border-color: #4f46e5;
  max-height: 260px;
  overflow-y: auto;
}

.input-card.category-open {
  margin-bottom: 120px;
  transition: margin-bottom 0.15s ease;
}

/* ===== Upload box hover ===== */
.upload-box {
  transition: border-color 0.2s ease, background-color 0.2s ease;
  cursor: pointer;
  position: relative;
}

.upload-box:hover {
  border-color: #7c3aed;
  background-color: #f5f3ff;
}

.upload-box:hover .upload-icon {
  transform: scale(1.08);
  transition: transform 0.2s ease;
}

.upload-box.is-dragging {
  border-color: #7c3aed;
  background-color: #f5f3ff;
  transform: scale(1.01);
}

.upload-subtext {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.upload-format {
  margin-top: 8px;
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.remove-image-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s;
}

.remove-image-btn:hover {
  background: #dc2626;
}

/* =========================================
   MOBILE STYLES
========================================= */
@media (max-width: 600px) {
  /* Sembunyikan header-actions desktop */
  .header-actions {
    display: none !important;
  }

  /* Tampilkan group credit + hamburger */
  .mobile-right {
    display: flex !important;
    align-items: center;
    gap: 6px;                    /* <-- atur jarak credit ↔ toggle di sini */
    margin-left: auto;
  }

  .mobile-credit {
    display: inline-flex !important;
    margin: 0 !important;
    font-size: 12px;
    padding: 5px 10px;
    white-space: nowrap;
  }

  .mobile-add-credit-btn {
    width: 26px !important;
    height: 26px !important;
    padding: 0 !important;
    border-radius: 6px !important;   /* <-- diubah dari 50% jadi 6px */
    font-size: 0 !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .mobile-add-credit-btn::after {
    content: "+";
    font-size: 20px;
    font-weight: 700;
    line-height: 24px;
    display: block;
    color: #fff;
  }

  .mobile-menu-btn {
    display: flex !important;
    margin: 0 !important;
    height: 36px;
    flex-shrink: 0;
  }

  /* Header layout */
  .card-header {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    justify-content: flex-start !important;
    align-items: center !important;
    position: relative;
    gap: 0 !important;
  }

  .card-header h2 {
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1.2 !important;
    font-size: 22px !important;
    text-align: left !important;
    width: auto !important;
    flex: 0 0 auto !important;
    height: 36px !important;
    display: flex !important;
    align-items: center !important;
  }

  /* Dropdown menu */
  .mobile-menu {
    display: flex !important;
    flex-direction: column;
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 180px;
    margin-top: 0 !important;
    padding: 12px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    z-index: 50;
    gap: 8px;
  }

  .mobile-menu .add-credit-btn,
  .mobile-menu .history-btn,
  .mobile-menu .logout-btn {
    width: 100%;
    text-align: center;
  }

  /* Model info di mobile */
  .model-info {
    flex-wrap: nowrap;
  }

  .model-info span:last-child {
    font-size: 12.5px;
    white-space: normal;
  }

  .model-info .badge {
    font-size: 10px;
    padding: 2px 8px;
  }

  .preview-img {
    max-height: 200px;
  }
}
</style>