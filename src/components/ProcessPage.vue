<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { loadAI } from "../services/aiService";

const props = defineProps({
  image: { type: Object, required: true },
  imagePreview: { type: String, required: true },
  model: { type: String, required: true },
  userId: { type: [Number, String], required: true },
  creditAmount: { type: Number, required: true },
});

const emit = defineEmits(["back", "complete"]);

const stepLabels = [
  "Menyiapkan proses...",
  "Menganalisis gambar...",
  "Memproses gambar...",
  "Menyusun hasil...",
];

// Checkpoint progress per step. Ini masih simulasi (bukan progress asli dari AI),
// karena aiService belum expose callback progress. Kalau nanti loadAI()/segmenter
// punya event/callback progress asli, ganti isi loop di runAIProcessing() untuk
// pakai nilai itu, bukan delay() di bawah ini.
const stepProgress = [10, 40, 70, 100];
const stepDelay = [500, 700, 700, 0];

// phase menggantikan kombinasi banyak boolean, supaya tampilan (dan state error)
// jadi satu sumber kebenaran:
// 'validating' | 'loading-ai' | 'processing' | 'deducting-credit' | 'done'
// | 'cancelled' | 'error-props' | 'error-ai-load' | 'error-connection' | 'error-credit'
const phase = ref("validating");

const currentStep = ref(0);
const progress = ref(0);
const statusText = ref(stepLabels[0]);
const segmenter = ref(null);
const isRetrying = ref(false);
const propsErrorMessage = ref("");

function isDone() {
  return phase.value === "done";
}
function isCancelled() {
  return phase.value === "cancelled";
}
function isErrorPhase() {
  return phase.value.startsWith("error-");
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- 4. Validasi props sebelum proses apapun dijalankan ---
function validateProps() {
  const missing = [];
  if (!props.image) missing.push("image");
  if (!props.imagePreview) missing.push("imagePreview");
  if (!props.model) missing.push("model");
  if (props.userId === undefined || props.userId === null) missing.push("userId");
  if (props.creditAmount === undefined || props.creditAmount === null) missing.push("creditAmount");

  if (missing.length > 0) {
    propsErrorMessage.value =
      "Data tidak lengkap dari halaman sebelumnya (" + missing.join(", ") + "). Kembali dan coba lagi.";
    phase.value = "error-props";
    return false;
  }
  return true;
}

// --- 1 & 2. Potong credit dengan penanganan gagal yang jelas ke user ---
// Return true kalau berhasil, false kalau harus berhenti dan minta retry.
async function deductCredit() {
  if (!navigator.onLine) {
    phase.value = "error-credit";
    statusText.value = "Koneksi terputus saat memotong credit";
    return false;
  }

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
      // Credit tidak cukup / gagal di sisi server: berhenti, jangan lanjut ke hasil
      // supaya user tidak dapat hasil tanpa credit-nya benar-benar terpotong.
      phase.value = "error-credit";
      statusText.value = data.message || "Gagal memotong credit";
      return false;
    }

    return true;
  } catch (error) {
    console.error("Gagal menghubungi server saat memotong credit:", error);
    phase.value = "error-credit";
    statusText.value = "Tidak bisa menghubungi server untuk memotong credit";
    return false;
  }
}

// --- 5. Proses AI, dipisah supaya gampang diganti ke progress asli nanti ---
async function runAIProcessing(fromStep = 0) {
  for (let step = fromStep; step < stepLabels.length; step++) {
    if (!navigator.onLine) {
      currentStep.value = step;
      phase.value = "error-connection";
      return false;
    }
    if (isCancelled()) return false;

    currentStep.value = step;
    statusText.value = stepLabels[step];
    progress.value = stepProgress[step];

    if (stepDelay[step] > 0) {
      await delay(stepDelay[step]);
    }

    if (!navigator.onLine) {
      phase.value = "error-connection";
      return false;
    }
    if (isCancelled()) return false;
  }
  return true;
}

async function startProcessing(fromStep = 0) {
  phase.value = "processing";

  const finishedAllSteps = await runAIProcessing(fromStep);
  if (!finishedAllSteps) return; // sudah di-set ke error-connection / cancelled di dalam runAIProcessing

  statusText.value = "Memotong credit...";
  phase.value = "deducting-credit";

  const creditOk = await deductCredit();
  if (!creditOk) return; // sudah di-set ke error-credit di dalam deductCredit

  statusText.value = "Selesai!";
  phase.value = "done";

  emit("complete", {
    image: props.image,
    model: props.model,
    layers: {
      original: props.imagePreview,
      result: props.imagePreview,
    },
  });
}

// --- Retry terpusat, dipakai oleh error koneksi maupun error credit ---
async function retryProcessing() {
  if (!navigator.onLine) return; // koneksi belum kembali, jangan retry dulu

  isRetrying.value = true;
  try {
    if (phase.value === "error-credit") {
      // Step AI sudah selesai sebelumnya, tinggal ulangi potong credit saja
      statusText.value = "Memotong credit...";
      phase.value = "deducting-credit";
      const creditOk = await deductCredit();
      if (!creditOk) return;

      statusText.value = "Selesai!";
      phase.value = "done";
      emit("complete", {
        image: props.image,
        model: props.model,
        layers: { original: props.imagePreview, result: props.imagePreview },
      });
    } else {
      // error-connection: lanjut dari step terakhir, bukan dari awal
      await startProcessing(currentStep.value);
    }
  } finally {
    isRetrying.value = false;
  }
}

// --- 3. Load AI dengan retry, bukan cuma pesan statis ---
async function loadAIModel() {
  phase.value = "loading-ai";
  statusText.value = "Loading AI Model...";
  try {
    segmenter.value = await loadAI();
    startProcessing();
  } catch (e) {
    console.error(e);
    phase.value = "error-ai-load";
    statusText.value = "Gagal memuat AI";
  }
}

function handleOffline() {
  if (phase.value === "processing" || phase.value === "deducting-credit") {
    phase.value = "error-connection";
  }
}
function handleOnline() {
  // Sengaja tidak auto-retry, biar user yang menekan tombol "Coba lagi"
}

function cancelProcessing() {
  if (isCancelled() || isDone() || isErrorPhase()) return;
  phase.value = "cancelled";
  statusText.value = "Proses dibatalkan";
}

function backToInput() {
  cancelProcessing();
  emit("back");
}

onMounted(() => {
  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);

  if (!validateProps()) return;
  loadAIModel();
});

onBeforeUnmount(() => {
  if (!isDone()) phase.value = "cancelled";
  window.removeEventListener("offline", handleOffline);
  window.removeEventListener("online", handleOnline);
});
</script>

<template>
  <div class="input-card">
    <div class="card-header">
      <h2>Processing</h2>
    </div>

    <!-- Error: props tidak lengkap, tidak ada apapun untuk diproses -->
    <template v-if="phase === 'error-props'">
      <p class="label label-error">Tidak bisa memulai proses</p>
      <p class="sublabel-error">{{ propsErrorMessage }}</p>
    </template>

    <!-- Error: gagal load model AI -->
    <template v-else-if="phase === 'error-ai-load'">
      <p class="label label-error">Gagal memuat AI</p>
      <p class="sublabel-error">Periksa koneksi kamu lalu coba lagi.</p>
    </template>

    <!-- Error: koneksi terputus saat proses AI -->
    <template v-else-if="phase === 'error-connection'">
      <p class="label label-error">Processing gagal</p>
      <p class="sublabel-error">Koneksi internet terputus</p>
    </template>

    <!-- Error: gagal potong credit -->
    <template v-else-if="phase === 'error-credit'">
      <p class="label label-error">Gagal memotong credit</p>
      <p class="sublabel-error">{{ statusText }}</p>
    </template>

    <!-- Normal: loading / processing / deducting / done -->
    <template v-else>
      <p class="label" :class="{ 'label-done': isDone() }">
        {{ statusText }}
      </p>

      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>

      <div class="progress-percent">{{ progress }}%</div>
    </template>

    <!-- Step list disembunyikan saat props tidak lengkap / AI gagal dimuat,
         karena proses belum sempat mulai -->
    <div v-if="phase !== 'error-props' && phase !== 'error-ai-load'" class="steps">
      <div
        v-for="(label, index) in stepLabels"
        :key="index"
        class="step"
        :class="{
          active: index === currentStep && phase === 'processing',
          done: index < currentStep || isDone() || phase === 'deducting-credit' || phase === 'error-credit',
          error: index === currentStep && phase === 'error-connection'
        }"
      >
        <span class="dot"></span>
        {{ label }}
      </div>
    </div>

    <!-- Kotak penjelasan untuk tiap jenis error -->
    <div v-if="phase === 'error-connection'" class="error-box">
      Koneksi internet kamu terputus saat gambar sedang diproses.
      Progres tidak hilang, kamu bisa coba lagi.
    </div>
    <div v-else-if="phase === 'error-credit'" class="error-box">
      Gambar sudah selesai diproses, tapi credit kamu belum berhasil dipotong.
      Coba lagi untuk menyelesaikan.
    </div>
    <div v-else-if="phase === 'error-ai-load'" class="error-box">
      Model AI gagal dimuat, kemungkinan karena koneksi tidak stabil.
    </div>

    <div v-if="imagePreview" class="preview-box" style="margin-top:20px">
      <img
        :src="imagePreview"
        style="max-width:100%;max-height:400px;object-fit:contain"
      />
    </div>

    <div class="button-row" style="margin-top:20px">
      <!-- Batal: hanya saat proses sedang jalan normal -->
      <button
        v-if="phase === 'loading-ai' || phase === 'processing' || phase === 'deducting-credit'"
        class="split-btn secondary"
        @click="cancelProcessing"
      >
        Batal
      </button>

      <!-- Coba lagi: untuk semua jenis error yang recoverable -->
      <button
        v-if="phase === 'error-connection' || phase === 'error-credit' || phase === 'error-ai-load'"
        class="split-btn danger"
        :disabled="isRetrying"
        @click="phase === 'error-ai-load' ? loadAIModel() : retryProcessing()"
      >
        {{ isRetrying ? "Mencoba lagi..." : "Coba lagi" }}
      </button>

      <button class="split-btn secondary" @click="backToInput">
        Back
      </button>
    </div>
  </div>
</template>

<style scoped>
.input-card{
  --proc-accent: #7c3aed;
  --proc-accent-light: #a78bfa;
  --proc-accent-bg: #f1edfe;
  --proc-success: #16a34a;
  --proc-danger: #dc2626;
  --proc-danger-bg: #fdecec;
  --proc-danger-text: #b91c1c;
  --proc-text-muted: #6b7280;
  --proc-text-body: #4b5563;
  --proc-neutral-bg: #f7f7fc;
  --proc-neutral-track: #e5e7eb;
  --proc-border: #ddd;
}

.progress-track{
  width:100%;
  height:10px;
  background:var(--proc-neutral-track);
  border-radius:999px;
  overflow:hidden;
  margin-top:12px;
}

.progress-fill{
  height:100%;
  background:linear-gradient(90deg,var(--proc-accent),var(--proc-accent-light));
  transition:.3s;
}

.progress-percent{
  text-align:right;
  font-size:12px;
  margin:6px 0 18px;
  color:var(--proc-text-muted);
}

.steps{
  display:flex;
  flex-direction:column;
  gap:8px;
  margin-top:12px;
}

.step{
  display:flex;
  align-items:center;
  gap:10px;
  padding:10px 14px;
  background:var(--proc-neutral-bg);
  border-radius:10px;
  color:var(--proc-text-muted);
}

.step.active{
  background:var(--proc-accent-bg);
  font-weight:600;
  color:#1e1b4b;
}

.step.done{
  color:#1e1b4b;
}

.step.error{
  background:var(--proc-danger-bg);
  font-weight:600;
  color:var(--proc-danger-text);
}

.dot{
  width:15px;
  height:15px;
  border-radius:50%;
  background:#d1d5db;
}

.step.active .dot{ background:var(--proc-accent); }
.step.done .dot{ background:var(--proc-success); }
.step.error .dot{ background:var(--proc-danger); }

.label-done{
  color:var(--proc-success);
  font-weight:600;
}

.label-error{
  color:var(--proc-danger-text);
  font-weight:700;
  margin-bottom:2px;
}

.sublabel-error{
  color:var(--proc-text-muted);
  font-size:13px;
  margin-top:0;
  margin-bottom:12px;
}

.error-box{
  margin-top:16px;
  padding:12px 14px;
  background:var(--proc-neutral-bg);
  border-radius:10px;
  font-size:13px;
  color:var(--proc-text-body);
  line-height:1.5;
}

.button-row{
  display:flex;
  gap:10px;
}

.split-btn.secondary{
  background:var(--proc-neutral-bg);
  border:1px solid var(--proc-border);
  padding:10px 18px;
  border-radius:10px;
  cursor:pointer;
  color:#000;
  font-weight:600;
}

.split-btn.danger{
  background:#fff;
  border:1px solid var(--proc-danger);
  padding:10px 18px;
  border-radius:10px;
  cursor:pointer;
  color:var(--proc-danger);
  font-weight:600;
}

.split-btn.danger:disabled{
  opacity:0.6;
  cursor:not-allowed;
}
</style>