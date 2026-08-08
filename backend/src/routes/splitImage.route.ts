import "dotenv/config";
import express, { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import { fal } from "@fal-ai/client";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
});

const falKey = process.env.FAL_KEY?.trim();

console.log("FAL_KEY ada:", Boolean(falKey));
console.log("FAL_KEY panjang:", falKey?.length);

// Konfigurasi fal.ai
fal.config({
  credentials: falKey,
});

interface FalLayeredResult {
  images: {
    url: string;
    content_type?: string;
    width?: number;
    height?: number;
  }[];
  seed: number;
  has_nsfw_concepts: boolean[];
}

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

      const fileBuffer = fs.readFileSync(req.file.path);

      const file = new File(
        [fileBuffer],
        req.file.originalname,
        {
          type: req.file.mimetype,
        }
      );

      console.log("☁️ Upload gambar ke fal.ai...");

      const imageUrl = await fal.storage.upload(file);

      console.log("✅ Gambar berhasil diupload ke fal.ai");
      console.log("🔗 URL:", imageUrl);

      console.log(
        "🤖 Memproses gambar dengan Qwen Image Layered..."
      );

      const result = await fal.subscribe(
        "fal-ai/qwen-image-layered",
        {
          input: {
            image_url: imageUrl,
            num_layers: 4,
          },

          logs: true,

          onQueueUpdate: (update: any) => {
            if (update.status === "IN_PROGRESS") {
              update.logs?.forEach((log: any) => {
                console.log("FAL:", log.message);
              });
            }
          },
        }
      );

      const data = result.data as FalLayeredResult;

      console.log("✅ Split image selesai");
      console.log("Jumlah layer:", data.images.length);

      res.json({
        success: true,
        layers: data.images.map((img) => img.url),
        seed: data.seed,
      });

      // Hapus file sementara
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.warn(
            "Gagal menghapus file sementara:",
            err.message
          );
        }
      });

    } catch (error) {
      console.error(
        "❌ Gagal proses split image:",
        error
      );

      if (error instanceof Error) {
        console.error("Nama error:", error.name);
        console.error("Pesan:", error.message);
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