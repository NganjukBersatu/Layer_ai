import "dotenv/config";

async function listModels() {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/models",
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Gagal mengambil daftar model:");
      console.error(data);
      return;
    }

    console.log("✅ Berhasil mengambil daftar model\n");

    for (const model of data.data) {
      console.log(
        `${model.id} | input: ${model.architecture?.input_modalities?.join(", ")} | output: ${model.architecture?.output_modalities?.join(", ")}`
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

listModels();