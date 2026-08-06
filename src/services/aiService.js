import { pipeline, env } from "@huggingface/transformers";

// Model akan disimpan di cache browser
env.allowLocalModels = false;

let segmenter = null;

export async function loadAI() {
  if (segmenter) {
    return segmenter;
  }

  console.log("📦 Loading AI Model...");

  segmenter = await pipeline(
    "image-segmentation",
    "Xenova/detr-resnet-50-panoptic"
  );

  console.log("✅ AI Ready!");

  return segmenter;
}