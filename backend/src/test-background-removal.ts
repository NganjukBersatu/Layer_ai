import fs from "fs";
import { removeBackground } from "@imgly/background-removal-node";

async function main() {
  const inputPath = "uploads/1786329208673.jpg";
  const outputPath = "uploads/test-background-result.png";

  if (!fs.existsSync(inputPath)) {
    throw new Error(`File tidak ditemukan: ${inputPath}`);
  }

  console.log("📁 Gambar ditemukan");
  console.log("🤖 Memulai background removal...");
  console.log("⏳ Proses pertama bisa membutuhkan waktu lebih lama...");

  const result = await removeBackground(inputPath);

  const buffer = Buffer.from(await result.arrayBuffer());

  fs.writeFileSync(outputPath, buffer);

  console.log("✅ Background berhasil diproses!");
  console.log("🖼️ Hasil:", outputPath);
  console.log(`📦 Ukuran hasil: ${buffer.length} bytes`);
}

main().catch((error) => {
  console.error("❌ Background removal error:");
  console.error(error);
});