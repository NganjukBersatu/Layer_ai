import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

async function test() {
  try {
    const response = await client.chat.completions.create({
      model: "openrouter/free",
      messages: [
        {
          role: "user",
          content: "Balas dengan: OpenRouter berhasil terhubung.",
        },
      ],
    });

    console.log("✅ OpenRouter berhasil!");
    console.log(response.choices[0]?.message?.content);
  } catch (error) {
    console.error("❌ OpenRouter gagal:");
    console.error(error);
  }
}

test();