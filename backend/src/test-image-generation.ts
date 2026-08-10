import "dotenv/config";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

async function testImageGeneration() {
  try {
    const imagePath = path.join(
      process.cwd(),
      "uploads",
      "1785742032052.jpg"
    );

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    console.log("📤 Mengirim gambar ke OpenRouter...");

    const response = await client.chat.completions.create({
      model: "google/gemini-2.5-flash-image",

      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Create an edited version of this image. Keep the main character and composition recognizable, but make the background transparent if possible.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    console.log("✅ Response berhasil diterima!");

    const message = response.choices[0]?.message;

    if (!message) {
      throw new Error("Response message tidak ditemukan");
    }

    // ================================
    // AMBIL HASIL GAMBAR
    // ================================

    const images = (message as any).images;

    if (!images || images.length === 0) {
      console.log("❌ Tidak ada gambar hasil dari OpenRouter");
      console.log("Response:");
      console.dir(message, { depth: 2 });
      return;
    }

    console.log(`🖼️ Jumlah gambar hasil: ${images.length}`);

    // ================================
    // SIMPAN GAMBAR
    // ================================

    const outputDir = path.join(process.cwd(), "uploads");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (let i = 0; i < images.length; i++) {
      const imageData = images[i]?.image_url?.url;

      if (!imageData) {
        console.log(`⚠️ Gambar ${i + 1} tidak memiliki URL`);
        continue;
      }

      // Ambil bagian Base64 setelah "data:image/png;base64,"
      const base64Data = imageData.replace(
        /^data:image\/\w+;base64,/,
        ""
      );

      const outputPath = path.join(
        outputDir,
        `openrouter-result-${Date.now()}-${i + 1}.png`
      );

      fs.writeFileSync(
        outputPath,
        Buffer.from(base64Data, "base64")
      );

      console.log("✅ Gambar berhasil disimpan:");
      console.log(outputPath);
    }
  } catch (error) {
    console.error("❌ Gagal:");
    console.error(error);
  }
}

testImageGeneration();