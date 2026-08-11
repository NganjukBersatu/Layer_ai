import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY tidak ditemukan di .env");
  }

  console.log("🔑 Gemini API Key ditemukan");

  const ai = new GoogleGenAI({
    apiKey,
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: "Say hello and confirm that the API connection works.",
  });

  console.log("✅ Gemini berhasil terhubung!");
  console.log("🤖 Response:");
  console.log(response.text);
}

main().catch((error) => {
  console.error("❌ Gemini error:");
  console.error(error);
});