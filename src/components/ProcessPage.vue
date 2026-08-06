<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { loadAI } from "../services/aiService";

const props = defineProps({
  image: Object,
  imagePreview: String,
  model: String,
  userId: [Number, String],
  creditAmount: Number,
});

const emit = defineEmits(["back", "complete"]);

const stepLabels = [
  "Menyiapkan proses...",
  "Menganalisis gambar...",
  "Memproses gambar...",
  "Menyusun hasil...",
];

const currentStep = ref(0);
const progress = ref(0);
const isDone = ref(false);
const isCancelled = ref(false);
const errorMessage = ref("");
const statusText = ref(stepLabels[0]);
const segmenter = ref(null);

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Memotong credit user lewat backend, setelah proses split berhasil.
async function deductCredit() {
  try {
    const response = await fetch("http://localhost:3000/deduct-credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: props.userId,
        amount: props.creditAmount,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      // Credit ternyata tidak cukup (misal kepotong duluan di tab lain).
      // Proses split sudah terlanjur selesai, jadi kita cuma kasih tahu saja.
      console.warn("Gagal memotong credit:", data.message);
    }
  } catch (error) {
    console.error("Gagal menghubungi server saat memotong credit:", error);
  }
}

async function startProcessing() {
  try {
    progress.value = 10;
    currentStep.value = 0;
    statusText.value = stepLabels[0];
    await delay(500);

    if (isCancelled.value) return;

    progress.value = 40;
    currentStep.value = 1;
    statusText.value = stepLabels[1];
    await delay(700);

    if (isCancelled.value) return;

    progress.value = 70;
    currentStep.value = 2;
    statusText.value = stepLabels[2];
    await delay(700);

    if (isCancelled.value) return;

    progress.value = 100;
    currentStep.value = 3;
    statusText.value = "Selesai!";
    isDone.value = true;

    // Potong credit dulu, baru pindah ke halaman Preview
    await deductCredit();

    emit("complete", {
      image: props.image,
      model: props.model,
      layers: {
        original: props.imagePreview,
        result: props.imagePreview,
      },
    });

  } catch (err) {
    console.error(err);
    errorMessage.value = err.message;
  }
}

// Fungsi tunggal untuk menghentikan proses.
// Dipakai bersama oleh tombol "Batal" dan tombol "Back".
function cancelProcessing() {
  if (isCancelled.value || isDone.value) return; // sudah berhenti/selesai, tidak perlu diulang
  isCancelled.value = true;
  statusText.value = "Proses dibatalkan";
}

// Tombol "Back": hentikan proses dulu (Opsi A), baru pindah ke halaman Input
function backToInput() {
  cancelProcessing();
  emit("back");
}

onMounted(async () => {
  try {
    statusText.value = "Loading AI Model...";

    segmenter.value = await loadAI();

    startProcessing();

  } catch (e) {
    console.error(e);
    errorMessage.value = "Gagal memuat AI";
  }
});

onBeforeUnmount(() => {
  isCancelled.value = true;
});
</script>

<template>
  <div class="input-card">
    <div class="card-header">
      <h2>Processing</h2>
    </div>

    <p class="label" :class="{ 'label-done': isDone }">
      {{ errorMessage || statusText }}
    </p>

    <div class="progress-track">
      <div
        class="progress-fill"
        :style="{ width: progress + '%' }"
      ></div>
    </div>

    <div class="progress-percent">
      {{ progress }}%
    </div>

    <div class="steps">
      <div
        v-for="(label,index) in stepLabels"
        :key="index"
        class="step"
        :class="{
          active:index===currentStep && !isDone,
          done:index<currentStep || isDone
        }"
      >
        <span class="dot"></span>
        {{ label }}
      </div>
    </div>

    <div
      v-if="imagePreview"
      class="preview-box"
      style="margin-top:20px"
    >
      <img
        :src="imagePreview"
        style="max-width:100%;max-height:400px;object-fit:contain"
      />
    </div>

    <div class="button-row" style="margin-top:20px">
      <!-- Tombol Batal hanya muncul kalau proses belum selesai DAN belum dibatalkan -->
      <button
        v-if="!isDone && !isCancelled"
        class="split-btn secondary"
        @click="cancelProcessing"
      >
        Batal
      </button>

      <!-- Tombol Back sekarang ikut membatalkan proses (Opsi A) -->
      <button
        class="split-btn secondary"
        @click="backToInput"
      >
        Back
      </button>
    </div>
  </div>
</template>

<style scoped>
.progress-track{
width:100%;
height:10px;
background:#e5e7eb;
border-radius:999px;
overflow:hidden;
margin-top:12px;
}

.progress-fill{
height:100%;
background:linear-gradient(90deg,#7c3aed,#a78bfa);
transition:.3s;
}

.progress-percent{
text-align:right;
font-size:12px;
margin:6px 0 18px;
color:#6b7280;
}

.steps{
display:flex;
flex-direction:column;
gap:8px;
}

.step{
display:flex;
align-items:center;
gap:10px;
padding:10px 14px;
background:#f7f7fc;
border-radius:10px;
color:#6b7280;
}

.step.active{
background:#f1edfe;
font-weight:600;
color:#1e1b4b;
}

.step.done{
color:#1e1b4b;
}

.dot{
width:15px;
height:15px;
border-radius:50%;
background:#d1d5db;
}

.step.active .dot{
background:#7c3aed;
}

.step.done .dot{
background:#16a34a;
}

.label-done{
color:#16a34a;
font-weight:600;
}

.button-row{
display:flex;
gap:10px;
}

.split-btn.secondary{
background:#f7f7fc;
border:1px solid #ddd;
padding:10px 18px;
border-radius:10px;
cursor:pointer;
color:#000;   /* Warna tulisan */
font-weight:600;
}
</style>