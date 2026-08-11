import "dotenv/config";
import express, { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
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

      const apiKey = process.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY tidak ditemukan di .env");
      }

      const response = await fetch(
        "https://openrouter.ai/api/v1/images",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",

            prompt: `
Edit the provided image.

Remove the background completely and keep only the main subject.

The result must:
- preserve the original subject's appearance
- preserve the subject's details
- not change the character or object
- remove only the background
- have a transparent background
- be returned as a PNG image with transparency

Do not create a new character.
Do not redesign the subject.
Only isolate the existing subject from the background.
`,

            input_references: [
              `data:${req.file.mimetype};base64,${base64Image}`,
            ],

            output_format: "png",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `OpenRouter error ${response.status}: ${errorText}`
        );
      }

      const result = await response.json();

      console.log("✅ Response OpenRouter diterima");

      console.log(
        "📦 Jumlah gambar:",
        result.data?.length ?? 0
      );

      if (!result.data || result.data.length === 0) {
        throw new Error(
          "OpenRouter tidak mengembalikan gambar"
        );
      }

      const resultDir = path.join(
        process.cwd(),
        "uploads"
      );

      if (!fs.existsSync(resultDir)) {
        fs.mkdirSync(resultDir, {
          recursive: true,
        });
      }

      const layerUrls: string[] = [];

      for (let i = 0; i < result.data.length; i++) {
        const image = result.data[i];

        const base64Data = image.b64_json;

        if (!base64Data) {
          console.warn(
            `⚠️ Gambar ${i + 1} tidak memiliki b64_json`
          );
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

        console.log(
          "💾 Hasil disimpan:",
          outputPath
        );

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

      if (layerUrls.length === 0) {
        throw new Error(
          "Tidak ada hasil gambar yang berhasil disimpan"
        );
      }

      res.json({
        success: true,
        layers: layerUrls,
      });
    } catch (error) {
      console.error(
        "❌ Gagal proses OpenRouter:",
        error
      );

      // Hapus file sementara jika masih ada
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, () => {});
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