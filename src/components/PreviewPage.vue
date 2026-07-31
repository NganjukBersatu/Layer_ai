<script setup>
const props = defineProps({
  image: Object,
  imagePreview: String,
  layers: Object,
});

const emit = defineEmits([
  "restart",
  "delete-result"
]);

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
  if (!props.layers?.result) {
    alert("Belum ada hasil yang dapat didownload.");
    return;
  }

  const link = document.createElement("a");
  link.href = props.layers.result;
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


</script>

<template>
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
      </div>

      <div class="file-info">

        <div class="info-row">
          <span>File Name</span>
          <strong>{{ image?.name || "-" }}</strong>
        </div>

        <div class="info-row">
          <span>File Size</span>
          <strong>{{ formatFileSize(image?.size) }}</strong>
        </div>

        <div class="info-row">
          <span>Status</span>
          <strong>Ready</strong>
        </div>

      </div>

    </div>

    <!-- ================= RIGHT CARD ================= -->

    <div class="card right-card">

      <h2>Result</h2>

      <div class="result-image">

        <img
          v-if="layers?.original"
          :src="layers.original"
          alt="Result"
        />

        <div
          v-else
          class="empty-result"
        >
          Result will appear here
        </div>

      </div>

<div class="button-group">

  <button
    class="btn"
    @click="emit('restart')"
  >
    Upload New Image
  </button>

  <button
  class="btn"
  @click="downloadLayer"
  :disabled="!layers"
>
  Download Layer
</button>

  <button
  class="btn delete-btn"
  @click="deleteLayer"
>
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
}

.button-group .btn{
    flex:1;
    margin-top:0;
}

.preview-page{
    display:grid;
    grid-template-columns:340px 1fr;
    gap:24px;
    margin-top:20px;
/* Tambahkan ini */
    align-items:start;
}

.card{
    background:#ffffff;
    border-radius:20px;
    padding:24px;
    box-shadow:0 8px 25px rgba(0,0,0,.08);
}

.card h2{
    margin-bottom:20px;
    font-size:22px;
    font-weight:700;
    color:#222;
}

.preview-image,
.result-image{
    width:100%;
    height:420px;
    background:#f5f5f5;
    border-radius:16px;
    display:flex;
    justify-content:center;
    align-items:center;
    overflow:hidden;
    border:2px dashed #dddddd;
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
}

.info-row{
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:10px 0;
    border-bottom:1px solid #eee;
}

.info-row span{
    color:#666;
}

.info-row strong{
    color:#222;
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
    grid-template-columns:1fr;
}

.preview-image,
.result-image{
    height:320px;
}

}

@media(max-width:600px){


}

</style>