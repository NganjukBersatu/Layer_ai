import * as ort from "onnxruntime-web";

let session = null;

export async function loadModel() {

  if (session) {
    return session;
  }

  session = await ort.InferenceSession.create(
    "/models/anime-segmentation.onnx"
  );

  console.log("✅ Model berhasil dimuat");

  return session;
}