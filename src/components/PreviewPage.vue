<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  image: Object,
  imagePreview: String,
  layers: Object,
  model: String,
});

const resultLayers = computed(() => {
  return props.layers?.result || [];
});

console.log("=== PREVIEW PAGE ===");
console.log("image:", props.image);
console.log("imagePreview:", props.imagePreview);
console.log("layers:", props.layers);
console.log("model:", props.model);

const emit = defineEmits([
  "restart",
  "delete-result",
  "history"
]);

// Mencegah user klik "Save" berkali-kali sebelum request sebelumnya selesai,
// yang bisa menyebabkan gambar terupload & tersimpan dobel di database.
const isSaving = ref(false);

// Menandai gambar hasil saat ini sudah pernah disimpan,
// supaya tidak bisa disimpan ulang (jadi data dobel) untuk gambar yang sama.
const hasSaved = ref(false);

function formatFileSize(size) {
  if (!size) return "-";

  if (size < 1024) {
    return size + " B";
  }

  if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + " KB";
  }

  return (size / 1024 / 1024).toFixed(2) + " MB";
}

function downloadLayer() {
  const result = resultLayers.value[0];

  if (!result) {
    alert("Belum ada hasil yang dapat didownload.");
    return;
  }

  const link = document.createElement("a");
  link.href = result;
  link.download = "layer.png";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function deleteLayer() {
  if (confirm("Apakah Anda yakin ingin menghapus hasil?")) {
    emit("delete-result");
  }
}

async function saveResult() {

  // Kalau proses save sebelumnya masih berjalan, atau gambar ini
  // sudah pernah tersimpan, abaikan klik ini.
  if (isSaving.value || hasSaved.value) return;

  isSaving.value = true;

  try {

const formData = new FormData();

formData.append("image", props.image);

const uploadResponse = await fetch("http://localhost:3000/upload-image", {
  method: "POST",
  body: formData,
});

const uploadData = await uploadResponse.json();

console.log(uploadData);

    const response = await fetch("http://localhost:3000/save-result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: 1,
        image_name: props.image?.name || "gambar.png",
        image_url: uploadData.path,
        model: props.model || "basic",
      }),
    });

    const data = await response.json();

    console.log(data);

    if (data.success) {
      hasSaved.value = true;
      alert("Hasil berhasil disimpan!");
    } else {
      alert(data.message);
    }

  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    isSaving.value = false;
  }

}


</script>

<template>
  <div class="preview-page">
      </div>

  <div class="preview-page">

    <!-- ================= LEFT CARD ================= -->
    <div class="card left-card">

      <h2>Original Image</h2>

      <div class="preview-image">
  <img
    v-if="imagePreview"
    :src="imagePreview"
    alt="Original Image"
  />

  <div v-else class="empty-result">
    Original image not available
  </div>
</div>

      <div class="file-info">

        <div class="info-row">
          <span>File Name</span>
          <strong :title="props.image?.name || '-'">{{ props.image?.name || "-" }}</strong>
        </div>

        <div class="info-row">
          <span>File Size</span>
          <strong>{{ formatFileSize(props.image?.size) }}</strong>
        </div>

        <div class="info-row">
          <span>Status</span>
          <span class="status-badge">
            <span class="status-dot"></span>
            Ready
          </span>
        </div>

      </div>

    </div>

    <!-- ================= RIGHT CARD ================= -->

    <div class="card right-card">

      <div class="card-title-row">
        <h2>Result</h2>
        <span
          class="model-badge"
          :class="model === 'advanced' ? 'advanced' : 'basic'"
        >
          {{ model === "advanced" ? "Advanced" : "Basic" }}
        </span>
      </div>

      <div class="result-image">

  <div
  v-if="resultLayers.length"
  class="result-layers"
>
  <img
    v-for="(layer, index) in resultLayers"
    :key="index"
    :src="layer"
    :alt="`Result Layer ${index + 1}`"
  />
</div>

<div v-else class="empty-result">
  Result will appear here
</div>

</div>

<div class="button-group">

  <!-- Grup 1: aksi ke hasil saat ini -->
  <button
    class="btn"
    :disabled="isSaving"
    @click="saveResult"
  >
    <i class="fa-solid fa-floppy-disk"></i>
    {{ isSaving ? "Saving..." : "Save" }}
  </button>

  <button
    class="btn"
    @click="downloadLayer"
    :disabled="!layers"
  >
    <i class="fa-solid fa-download"></i>
    Download Layer
  </button>

  <!-- Grup 2: navigasi / reset -->
  <button
    class="btn"
    @click="emit('restart')"
  >
    <i class="fa-solid fa-arrow-rotate-left"></i>
    Upload New Image
  </button>

  <button
    class="btn"
    @click="emit('history')"
  >
    <i class="fa-solid fa-clock-rotate-left"></i>
    History
  </button>

  <!-- Grup 3: destruktif, tetap paling akhir -->
  <button
    class="btn delete-btn"
    @click="deleteLayer"
  >
    <i class="fa-solid fa-trash"></i>
    Delete
  </button>

</div>
      

    </div>

  </div>
</template>

<style scoped>

.button-group{
    display:flex;
    justify-content:space-between;
    gap:12px;
    margin-top:24px;
    flex-wrap:wrap;
}

.button-group .btn{
    flex:1;
    margin-top:0;
    min-width:140px;
}

.preview-page{
    display:grid;
    grid-template-columns:minmax(0,340px) minmax(0,1fr);
    gap:24px;
    margin-top:20px;
    align-items:start;
    width:100%;
    max-width:100%;
    box-sizing:border-box;
}

.card{
    background:#ffffff;
    border-radius:20px;
    padding:24px;
    box-shadow:0 8px 25px rgba(0,0,0,.08);
    transition:transform .25s, box-shadow .25s;
    min-width:0; /* penting: cegah grid item melebar mengikuti ukuran alami gambar di dalamnya */
    box-sizing:border-box;
    max-width:100%;
    overflow:hidden;
}

.card:hover{
    transform:translateY(-4px);
    box-shadow:0 14px 35px rgba(0,0,0,.14);
}

.card h2{
    font-size:22px;
    font-weight:700;
    color:#222;
    margin-bottom:20px;
}

.card-title-row{
    display:flex;
    align-items:center;
    justify-content:space-between;
    margin-bottom:20px;
}

.card-title-row h2{
    margin-bottom:0;
}

.model-badge{
    font-size:11px;
    font-weight:700;
    padding:4px 12px;
    border-radius:999px;
    text-transform:uppercase;
}

.model-badge.basic{
    background:#ede9fe;
    color:#7c3aed;
}

.model-badge.advanced{
    background:#fef3c7;
    color:#b45309;
}

.preview-image{
    width:100%;
    max-width:100%;
    height:420px;
    background:#f5f5f5;
    border-radius:16px;
    display:flex;
    justify-content:center;
    align-items:center;
    overflow:hidden;
    border:2px dashed #dddddd;
    box-sizing:border-box;
}

.result-image{
    width:100%;
    max-width:100%;
    height:420px;
    background:linear-gradient(135deg, #f5f3ff 0%, #fdfcff 50%, #f5f3ff 100%);
    border-radius:16px;
    display:flex;
    justify-content:center;
    align-items:center;
    overflow:hidden;
    border:2px dashed #dddddd;
    box-sizing:border-box;
}

.preview-image img,
.result-image img{
    width:100%;
    height:100%;
    object-fit:contain;
}

.empty-result{
    color:#888;
    font-size:15px;
}

.file-info{
    margin-top:20px;
    display:flex;
    flex-direction:column;
    gap:12px;
    min-width:0;
}

.info-row{
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:10px 0;
    border-bottom:1px solid #eee;
    gap:12px;
    min-width:0;
}

.info-row span{
    color:#666;
    flex-shrink:0;
}

.info-row strong{
    color:#222;
    min-width:0;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
    text-align:right;
}

.status-badge{
    display:inline-flex;
    align-items:center;
    gap:6px;
    background:#dcfce7;
    color:#16a34a;
    font-size:12px;
    font-weight:700;
    padding:4px 12px;
    border-radius:999px;
    flex-shrink:0;
}

.status-dot{
    width:6px;
    height:6px;
    border-radius:50%;
    background:#16a34a;
}


.btn{
    width:100%;
    margin-top:25px;
    padding:14px;
    border:none;
    border-radius:12px;
    background:#7c3aed;
    color:white;
    font-size:15px;
    font-weight:600;
    cursor:pointer;
    transition:.3s;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
}

.btn:hover{
    background:#6d28d9;
}

.btn:disabled{
    background:#c4b5fd;
    cursor:not-allowed;
    opacity:.7;
}

.delete-btn{
    background:#ef4444;
}

.delete-btn:hover{
    background:#dc2626;
}

@media(max-width:900px){

.preview-page{
    grid-template-columns:minmax(0,1fr);
}

.preview-image,
.result-image{
    height:320px;
}

}

@media(max-width:600px){

.preview-image,
.result-image{
    height:240px;
}

.info-row{
    flex-wrap:wrap;
}

.info-row strong{
    text-align:left;
    max-width:100%;
}

.button-group .btn{
    min-width:100%;
}

}

</style>