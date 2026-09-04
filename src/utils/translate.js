export const SUPPORTED_LOCALES = ["id", "en", "ja", "ko"];

const API_BASE = "http://localhost:3000";

export async function translateToAllLocales(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    return { id: "", en: "", ja: "", ko: "" };
  }

  const response = await fetch(`${API_BASE}/translate/all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: trimmed }),
  });

  if (!response.ok) {
    throw new Error(`Gagal menerjemahkan (HTTP ${response.status})`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "Gagal menerjemahkan");
  }

  return data.data;
}