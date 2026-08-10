import "dotenv/config";
import express, { Request, Response } from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
});

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

router.post(
  "/split-image-openrouter",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada file gambar",
        });
      }

      console.log("📁 File diterima:", req.file.originalname);

      // Baca gambar
      const imageBuffer = fs.readFileSync(req.file.path);
      const base64Image = imageBuffer.toString("base64");

      console.log("🤖 Mengirim gambar ke OpenRouter...");

      const response = await client.chat.completions.create({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
Analyze this image and separate its visual elements into layers.

Create an edited image containing the main subject with a transparent background.

Keep the main subject recognizable and preserve its appearance.
Do not change the character or object unnecessarily.
Only remove the background.
                `,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${req.file.mimetype};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      });

      console.log("✅ Response OpenRouter diterima");

      const message = response.choices[0]?.message;

if (!message) {
  throw new Error("Response OpenRouter tidak memiliki message");
}

const images = (message as any).images;

if (!images || images.length === 0) {
  throw new Error("OpenRouter tidak mengembalikan gambar");
}
      const resultDir = path.join(process.cwd(), "uploads");

      const layerUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
  const image = images[i];

        const imageUrl = image.image_url?.url;

        if (!imageUrl) {
          continue;
        }

        // Ambil bagian base64 dari data URL
        const base64Data = imageUrl.split(",")[1];

        if (!base64Data) {
          continue;
        }

        const outputPath = path.join(
          resultDir,
          `openrouter-layer-${Date.now()}-${i + 1}.png`
        );

        fs.writeFileSync(
          outputPath,
          Buffer.from(base64Data, "base64")
        );

        console.log("💾 Layer disimpan:", outputPath);

        layerUrls.push(
          `/uploads/${path.basename(outputPath)}`
        );
      }

      // Hapus file upload sementara
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.warn(
            "⚠️ Gagal menghapus file sementara:",
            err.message
          );
        }
      });

      res.json({
        success: true,
        layers: layerUrls,
      });

    } catch (error) {
      console.error("❌ Gagal proses OpenRouter:", error);

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);

export default router;
