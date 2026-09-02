// utils/translate.js
//
// Utilitas untuk auto-translate deskripsi ke semua bahasa yang didukung
// aplikasi (id, en, ja, ko), supaya user (baik saat upload maupun edit)
// cukup mengetik SATU deskripsi dalam bahasa apa saja — bahasa sumber
// dideteksi otomatis — lalu sistem yang mengisi versi bahasa lainnya.
// Tidak butuh API key, jadi cocok dipakai jangka panjang tanpa biaya.
//
// Catatan: endpoint ini adalah endpoint publik Google Translate (dipakai
// banyak proyek open-source gratisan). Kalau suatu saat kena rate-limit
// atau diblokir CORS oleh browser, solusinya: pindahkan fungsi
// `translateOne` ini ke backend (proxy), lalu panggil backend itu dari
// sini — tinggal ganti isi `translateOne`, bagian lain tidak perlu diubah.

export const SUPPORTED_LOCALES = ["id", "en", "ja", "ko"];

const ENDPOINT = "https://translate.googleapis.com/translate_a/single";

async function translateOne(text, targetLang, sourceLang = "auto") {
  const url =
    `${ENDPOINT}?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=` +
    encodeURIComponent(text);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Gagal menerjemahkan (HTTP " + res.status + ")");
  }

  const data = await res.json();
  // data[0] = array potongan kalimat hasil terjemahan
  // data[2] = kode bahasa asal yang terdeteksi otomatis
  const translated = data[0].map((chunk) => chunk[0]).join("");
  const detectedSource = data[2];

  return { translated, detectedSource };
}

/**
 * Menerjemahkan satu teks ke SEMUA bahasa yang didukung aplikasi.
 * Bahasa sumber dideteksi otomatis (user boleh mengetik dalam bahasa
 * Indonesia, Inggris, atau bahasa lain apapun).
 *
 * @param {string} text - teks asli yang diketik user
 * @returns {Promise<{id: string, en: string, ja: string, ko: string}>}
 */
export async function translateToAllLocales(text) {
  const trimmed = (text || "").trim();
  const result = { id: "", en: "", ja: "", ko: "" };
  if (!trimmed) return result;

  // 1. Terjemahkan ke bahasa pertama (id) sekaligus mendeteksi bahasa asal
  const firstTarget = SUPPORTED_LOCALES[0];
  const first = await translateOne(trimmed, firstTarget);
  const sourceLang = SUPPORTED_LOCALES.includes(first.detectedSource)
    ? first.detectedSource
    : null;

  // 2. Isi setiap locale
  await Promise.all(
    SUPPORTED_LOCALES.map(async (loc) => {
      if (loc === sourceLang) {
        // Simpan teks asli apa adanya untuk bahasa sumbernya sendiri,
        // supaya tidak "bolak-balik diterjemahkan" dan berubah gaya bahasanya.
        result[loc] = trimmed;
        return;
      }
      if (loc === firstTarget && sourceLang !== firstTarget) {
        result[loc] = first.translated;
        return;
      }
      const { translated } = await translateOne(trimmed, loc, sourceLang || "auto");
      result[loc] = translated;
    })
  );

  return result;
}