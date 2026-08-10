import "dotenv/config";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

async function testImage() {
  try {
    const imagePath = path.join(
  process.cwd(),
  "uploads",
  "1785742032052.jpg"
);

    const imageBuffer = fs.readFileSync(imagePath);

    const base64Image = imageBuffer.toString("base64");

    const response = await client.chat.completions.create({
      model: "openrouter/free",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Jelaskan secara singkat objek dan elemen yang terlihat pada gambar ini.",
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

    console.log("✅ Gambar berhasil dikirim ke OpenRouter!");
    console.log("🤖 Jawaban AI:");
    console.log(response.choices[0]?.message?.content);
  } catch (error) {
    console.error("❌ Gagal mengirim gambar:");
    console.error(error);
  }
}

testImage();