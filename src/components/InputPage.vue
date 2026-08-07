<script setup>
import { ref, computed, onMounted } from "vue";

const emit = defineEmits(["next", "history", "logout"]);

const image = ref(null);
const imagePreview = ref(null);
const isDragging = ref(false);

const fileError = ref("");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const selectedModel = ref("basic");
const isModelDropdownOpen = ref(false);
const isMobileMenuOpen = ref(false);

const modelOptions = {
  basic: "Basic",
  advanced: "Advanced",
};

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
      creditError.value = "Gagal memuat sisa credit";
    }
  } catch (error) {
    console.error(error);
    creditError.value = "Gagal memuat sisa credit";
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
      alert("Credit berhasil ditambahkan!");
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error(error);
    alert("Gagal menambah credit.");
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
    fileError.value = "Format gambar harus JPG, PNG, atau WEBP.";
    return;
  }

  // Cek ukuran file
  if (file.size > MAX_FILE_SIZE) {
    fileError.value = "Ukuran gambar maksimal 10 MB.";
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

function handleSplitClick() {
  // Pengaman tambahan: kalau entah bagaimana tombol ini terklik
  // tanpa gambar (misal disabled state gagal), tetap dicegah di sini.
  if (!image.value) {
    alert("Silakan upload gambar terlebih dahulu sebelum split.");
    return;
  }

  if (!hasEnoughCredit.value) {
    alert("Credit Anda tidak cukup untuk model ini.");
    return;
  }

  emit("next", {
    image: image.value,
    imagePreview: imagePreview.value,
    model: selectedModel.value,
    userId: currentUserId,
    creditAmount: estimatedCredit.value,
  });
}
</script>

<template>
  <div class="input-card">
    <div class="card-header">
      <h2>Input</h2>

      <div class="header-actions">
        <span class="credit-info" :class="{ 'credit-error': creditError }">
          <template v-if="isLoadingCredits">Memuat credit...</template>
          <template v-else-if="creditError">{{ creditError }}</template>
          <template v-else>💎 {{ remainingCredits }} Credits</template>
        </span>

        <button class="add-credit-btn" @click="addCredit">+ Add Credit</button>

        <button class="history-btn" @click="emit('history')">History</button>

        <button class="logout-btn" @click="emit('logout')">Logout</button>

        <div class="info">i</div>
      </div>

      <!-- Hamburger untuk layar kecil -->
      <button
        type="button"
        class="mobile-menu-btn"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div v-if="isMobileMenuOpen" class="mobile-menu">
        <span class="credit-info" :class="{ 'credit-error': creditError }">
          <template v-if="isLoadingCredits">Memuat credit...</template>
          <template v-else-if="creditError">{{ creditError }}</template>
          <template v-else>💎 {{ remainingCredits }} Credits</template>
        </span>

        <button class="add-credit-btn" @click="addCredit">+ Add Credit</button>

        <button class="history-btn" @click="emit('history')">History</button>

        <button class="logout-btn" @click="emit('logout')">Logout</button>
      </div>
    </div>

    <label class="label"> Upload Image </label>

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

          <p>Click to upload image</p>
          <p class="upload-subtext">atau drag & drop di sini</p>
        </template>

        <template v-else>
          <img :src="imagePreview" class="preview-img" alt="Preview" />

          <p class="preview-filename">{{ image.name }}</p>

          <button
            type="button"
            class="remove-image-btn"
            title="Hapus gambar"
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

    <label class="label"> AI Model </label>

    <div class="model-info">
      <span class="badge" title="Model Advanced baru saja ditambahkan">
        New
      </span>

      <span>
        <strong>Advanced</strong> model provides better quality but costs more
        credits
      </span>
    </div>

    <p class="credit-estimate" :class="{ warning: !hasEnoughCredit }">
      Estimasi biaya: <strong>{{ estimatedCredit }} credit</strong>
      <span v-if="!hasEnoughCredit"> — credit Anda tidak cukup</span>
    </p>

    <div class="model-dropdown">
      <button
        type="button"
        class="model-dropdown-btn"
        @click="toggleModelDropdown"
      >
        <span>{{ modelOptions[selectedModel] }}</span>
        <span class="chevron" :class="{ open: isModelDropdownOpen }"
          >&#9662;</span
        >
      </button>

      <div v-if="isModelDropdownOpen" class="model-dropdown-menu">
        <div
          class="model-dropdown-item"
          :class="{ active: selectedModel === 'basic' }"
          @click="selectModel('basic')"
        >
          Basic
        </div>

        <div
          class="model-dropdown-item"
          :class="{ active: selectedModel === 'advanced' }"
          @click="selectModel('advanced')"
        >
          Advanced
          <span class="badge badge-small">New</span>
        </div>
      </div>
    </div>

    <button
      class="split-btn"
      :disabled="!image || !hasEnoughCredit"
      :title="
        !image
          ? 'Upload gambar terlebih dahulu'
          : !hasEnoughCredit
            ? 'Credit tidak cukup'
            : ''
      "
      @click="handleSplitClick"
    >
      Split Image
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
  overflow: hidden; /* jaga-jaga kalau ada child yang tetap melebihi */
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
/* ===== End fix responsive ===== */

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
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  padding: 14px;
  background: #f9f9fc;
  border: 1px solid #eee;
  border-radius: 12px;
}

.mobile-menu .credit-info,
.mobile-menu .add-credit-btn,
.mobile-menu .history-btn,
.mobile-menu .logout-btn {
  width: 100%;
  text-align: center;
}

@media (max-width: 600px) {
  .header-actions {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .mobile-menu {
    display: flex;
  }

  .preview-img {
    max-height: 200px;
  }
}

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

.credit-estimate {
  margin-top: 10px;
  font-size: 13px;
  color: #4b5563;
}

.credit-estimate.warning {
  color: #dc2626;
  font-weight: 600;
}

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
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border: 2px solid #7c3aed;
  border-radius: 12px;
  overflow: hidden;
  z-index: 10;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
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

/* Hover effect untuk area upload gambar */
.upload-box {
  transition: border-color 0.2s ease, background-color 0.2s ease;
  cursor: pointer;
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

.upload-box {
  position: relative;
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
</style>