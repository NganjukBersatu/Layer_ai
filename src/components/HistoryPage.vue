<script setup>
import { ref, computed, onMounted } from "vue";

const emit = defineEmits(["back"]);

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

    const url = `${API_BASE}/history/${currentUserId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request gagal: ${response.status}`);
    }

    const data = await response.json();

    // Jaga-jaga kalau API membungkus hasil dalam { data: [...] } bukan array langsung
    histories.value = Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error("Gagal load history:", error);
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
  const confirmDelete = confirm(`Hapus "${item.image_name}" dari history?`);
  if (!confirmDelete) return;

  try {
    const response = await fetch(`${API_BASE}/history/${item.id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (data.success) {
      histories.value = histories.value.filter((h) => h.id !== item.id);
    } else {
      alert("Gagal menghapus history");
    }
  } catch (error) {
    console.error(error);
    alert("Terjadi kesalahan saat menghapus");
  }
}

onMounted(() => {
  loadHistory();
});
</script>

<template>
  <div class="history-page">
    <div class="page-header">
      <button class="back-btn" @click="emit('back')">&larr; Back</button>
      <h2>History</h2>
    </div>

    <div class="search-box">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari nama gambar..."
      />
      <button
        v-if="searchQuery"
        class="clear-btn"
        @click="searchQuery = ''"
        title="Hapus pencarian"
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
        Semua
      </button>
      <button
        class="filter-tab"
        :class="{ active: modelFilter === 'basic' }"
        @click="modelFilter = 'basic'"
      >
        Basic
      </button>
      <button
        class="filter-tab"
        :class="{ active: modelFilter === 'advanced' }"
        @click="modelFilter = 'advanced'"
      >
        Advanced
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
              {{ item.model === "advanced" ? "Advanced" : "Basic" }}
            </span>
          </div>
        </div>

        <div class="actions">
          <button class="btn download" @click="downloadImage(item)">
            Download
          </button>
          <button class="btn delete" @click="deleteHistory(item)">
            Delete
          </button>
        </div>
      </div>
    </div>

    <p v-if="histories.length === 0" class="empty">Belum ada history.</p>
    <p v-else-if="filteredHistories.length === 0" class="empty">
      Tidak ada gambar yang cocok dengan filter ini.
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