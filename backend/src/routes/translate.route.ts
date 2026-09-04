import express, { Request, Response } from "express";

const router = express.Router();

const SUPPORTED_LOCALES = ["id", "en", "ja", "ko"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

const DEEPL_TARGET_LANG: Record<Locale, string> = {
  id: "ID",
  en: "EN-US",
  ja: "JA",
  ko: "KO",
};

const DEEPL_SOURCE_TO_LOCALE: Record<string, Locale> = {
  ID: "id",
  EN: "en",
  JA: "ja",
  KO: "ko",
};

interface DeepLResponse {
  translations: {
    detected_source_language: string;
    text: string;
  }[];
}

async function translateOne(
  text: string,
  targetLocale: Locale,
  sourceLocale?: Locale
): Promise<{ translated: string; detectedSource: Locale | null }> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPL_API_KEY belum diatur di file .env");
  }

  const params = new URLSearchParams();
  params.append("text", text);
  params.append("target_lang", DEEPL_TARGET_LANG[targetLocale]);
  if (sourceLocale) {
    params.append("source_lang", DEEPL_TARGET_LANG[sourceLocale]);
  }

  const response = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepL error (HTTP ${response.status}): ${errText}`);
  }

  const data = (await response.json()) as DeepLResponse;
  const result = data.translations[0];

  const detectedSource =
    DEEPL_SOURCE_TO_LOCALE[result.detected_source_language] || null;

  return { translated: result.text, detectedSource };
}

router.post("/translate/all", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const trimmed = typeof text === "string" ? text.trim() : "";

    const result: Record<Locale, string> = { id: "", en: "", ja: "", ko: "" };

    if (!trimmed) {
      return res.json({ success: true, data: result });
    }

    const firstTarget: Locale = SUPPORTED_LOCALES[0];
    const first = await translateOne(trimmed, firstTarget);
    const sourceLocale = first.detectedSource;

    await Promise.all(
      SUPPORTED_LOCALES.map(async (loc) => {
        if (loc === sourceLocale) {
          result[loc] = trimmed;
          return;
        }
        if (loc === firstTarget && sourceLocale !== firstTarget) {
          result[loc] = first.translated;
          return;
        }
        const { translated } = await translateOne(
          trimmed,
          loc,
          sourceLocale || undefined
        );
        result[loc] = translated;
      })
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Translate gagal:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal menerjemahkan teks",
    });
  }
});

export default router;