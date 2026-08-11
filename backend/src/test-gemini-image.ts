import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY tidak ditemukan di .env");
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  // Ganti dengan lokasi gambar yang mau kamu tes
  const imagePath =  "uploads/1786329208673.jpg";

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Gambar tidak ditemukan: ${imagePath}`);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");

  console.log("📁 Gambar ditemukan");
  console.log("🤖 Mengirim gambar ke Gemini...");

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
Remove the background from this image.

Keep the main subject exactly as it is.
Do not redesign or change the subject.
Only remove the background.
Return the edited image with a transparent background.
`,
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  });

  console.log("✅ Response Gemini diterima");

  const parts = response.candidates?.[0]?.content?.parts ?? [];

  let imageFound = false;

  for (const part of parts) {
    if (part.inlineData?.data) {
      imageFound = true;

      const outputPath = "uploads/gemini-test-result.png";

      fs.writeFileSync(
        outputPath,
        Buffer.from(part.inlineData.data, "base64")
      );

      console.log("🖼️ Hasil gambar disimpan:");
      console.log(outputPath);
    }

    if (part.text) {
      console.log("🤖 Gemini:", part.text);
    }
  }

  if (!imageFound) {
    throw new Error("Gemini tidak mengembalikan gambar");
  }

  console.log("🎉 TEST IMAGE BERHASIL!");
}

main().catch((error) => {
  console.error("❌ Gemini image error:");
  console.error(error);
});