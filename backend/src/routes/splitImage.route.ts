import "dotenv/config";
import express, { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
});

// ================================
// OPENROUTER
// ================================

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

console.log(
  "OPENROUTER_API_KEY ada:",
  Boolean(process.env.OPENROUTER_API_KEY)
);

// ================================
// SPLIT IMAGE
// ================================

router.post(
  "/split-image",
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

      // ================================
      // BACA FILE GAMBAR
      // ================================

      const fileBuffer = fs.readFileSync(req.file.path);

      const base64Image = fileBuffer.toString("base64");

      console.log("📦 Ukuran gambar:", fileBuffer.length, "bytes");

      // ================================
      // KIRIM KE OPENROUTER
      // ================================

      console.log("🤖 Mengirim gambar ke OpenRouter...");

      const response = await client.chat.completions.create({
        model: "google/gemini-2.5-flash-image",

        max_tokens: 3000,

        messages: [
          {
            role: "user",

            content: [
              {
                type: "text",

                text: `
Process this image for an AI Layer Splitter.

Separate the main visual elements of the image into individual layers.

The goal is to create multiple editable visual layers from the original image.

Preserve the original character/object and composition as much as possible.

Remove the background if possible and make it transparent.

Return the processed image.
                `.trim(),
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

      // ================================
      // AMBIL HASIL GAMBAR
      // ================================

      const message = response.choices[0]?.message;

      if (!message) {
        throw new Error(
          "Response OpenRouter tidak memiliki message"
        );
      }

      const images = (message as any).images;

      if (!images || images.length === 0) {
        console.error("❌ OpenRouter tidak mengembalikan gambar");

        return res.status(500).json({
          success: false,
          message: "OpenRouter tidak mengembalikan gambar hasil",
        });
      }

      console.log(
        "🖼️ Jumlah gambar hasil:",
        images.length
      );

      // ================================
      // SIMPAN HASIL
      // ================================

      const outputDir = path.join(
        process.cwd(),
        "uploads"
      );

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {
          recursive: true,
        });
      }

      const layers: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const imageData = images[i]?.image_url?.url;

        if (!imageData) {
          console.warn(
            `⚠️ Gambar ${i + 1} tidak memiliki data`
          );

          continue;
        }

        const base64Data = imageData.replace(
          /^data:image\/\w+;base64,/,
          ""
        );

        const filename =
          `openrouter-result-${Date.now()}-${i + 1}.png`;

        const outputPath = path.join(
          outputDir,
          filename
        );

        fs.writeFileSync(
          outputPath,
          Buffer.from(base64Data, "base64")
        );

        console.log(
          "✅ Layer disimpan:",
          filename
        );

        layers.push(
          `uploads/${filename}`
        );
      }

      // ================================
      // HAPUS FILE INPUT SEMENTARA
      // ================================

      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.warn(
            "⚠️ Gagal menghapus file sementara:",
            err.message
          );
        }
      });

      // ================================
      // RESPONSE KE FRONTEND
      // ================================

      res.json({
        success: true,
        layers,
      });

    } catch (error) {
      console.error(
        "❌ Gagal proses split image:",
        error
      );

      if (error instanceof Error) {
        console.error(
          "Nama error:",
          error.name
        );

        console.error(
          "Pesan:",
          error.message
        );
      }

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