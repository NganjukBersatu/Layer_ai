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

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("GEMINI_API_KEY tidak ditemukan di .env");
      }

      const partsToGenerate = [
        {
          name: "head",
          prompt: `
            Edit the provided image.
            Isolate ONLY the head of the main subject (including hair/face/neck as appropriate).
            The result must:
            - show only the head, cropped naturally at the neck
            - preserve the original appearance and details of the head
            - not include the body, arms, or legs
            - have a fully transparent background
            - be returned as a PNG image with transparency
            Do not create a new character.
            Do not redesign the subject.
            Only isolate the head region from the rest of the image and remove the background.
          `,
        },
        {
          name: "body",
          prompt: `
            Edit the provided image.
            Isolate ONLY the torso/body of the main subject (including arms if attached, excluding head and legs).
            The result must:
            - show only the torso and arms, cropped naturally at the neck and hips
            - preserve the original appearance and details
            - not include the head or legs
            - have a fully transparent background
            - be returned as a PNG image with transparency
            Do not create a new character.
            Do not redesign the subject.
            Only isolate the torso region from the rest of the image and remove the background.
          `,
        },
        {
          name: "legs",
          prompt: `
            Edit the provided image.
            Isolate ONLY the legs of the main subject (from hips down, including feet).
            The result must:
            - show only the legs and feet, cropped naturally at the hips
            - preserve the original appearance and details
            - not include the head or torso
            - have a fully transparent background
            - be returned as a PNG image with transparency
            Do not create a new character.
            Do not redesign the subject.
            Only isolate the leg region from the rest of the image and remove the background.
          `,
        },
      ];

      const model = "gemini-2.5-flash-image";

      const layerUrls: string[] = [];

      const resultDir = path.join(process.cwd(), "uploads");

      if (!fs.existsSync(resultDir)) {
        fs.mkdirSync(resultDir, { recursive: true });
      }

      for (const part of partsToGenerate) {
        console.log(`🤖 Memproses bagian: ${part.name}...`);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: part.prompt },
                    {
                      inline_data: {
                        mime_type: req.file.mimetype,
                        data: base64Image,
                      },
                    },
                  ],
                },
              ],
              generationConfig: { responseModalities: ["IMAGE"] },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Gemini error (${part.name}) ${response.status}: ${errorText}`
          );
        }

        const result = await response.json();

        const resultParts = result.candidates?.[0]?.content?.parts ?? [];

        const imagePart = resultParts.find(
          (p: any) => p.inlineData?.data || p.inline_data?.data
        );

        const base64Data =
          imagePart?.inlineData?.data || imagePart?.inline_data?.data;

        if (!base64Data) {
          console.warn(`⚠️ Bagian ${part.name} tidak menghasilkan gambar`);
          continue;
        }

        const outputPath = path.join(
          resultDir,
          `gemini-layer-${part.name}-${Date.now()}.png`
        );

        fs.writeFileSync(outputPath, Buffer.from(base64Data, "base64"));

        console.log("💾 Hasil disimpan:", outputPath);

        layerUrls.push(`/uploads/${path.basename(outputPath)}`);
      }

      // Hapus file upload sementara (setelah SEMUA bagian selesai diproses)
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.warn("⚠️ Gagal menghapus file sementara:", err.message);
        }
      });

      if (layerUrls.length === 0) {
        throw new Error("Tidak ada hasil gambar yang berhasil disimpan");
      }

      res.json({
        success: true,
        layers: layerUrls,
      });
    } catch (error) {
      console.error("❌ Gagal proses Gemini:", error);

      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, () => {});
      }

      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export default router;