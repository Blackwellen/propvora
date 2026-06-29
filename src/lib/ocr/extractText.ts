"use client"

/**
 * Free, on-device OCR via tesseract.js — open-source, NO API key, runs entirely
 * in the browser (the ~MB wasm + English traineddata is lazy-loaded only when
 * OCR is first used, so it never bloats the initial bundle). Used to extract
 * text from uploaded document/certificate images (e.g. to find reference numbers
 * and dates). No image ever leaves the device for OCR.
 */

export interface OcrResult {
  /** The recognised text, trimmed. */
  text: string
  /** Tesseract's overall confidence 0–100. */
  confidence: number
}

/**
 * Run OCR on an image File/Blob. `onProgress` receives 0–100 during recognition.
 * Throws on failure (caller shows an error). Only call client-side.
 */
export async function extractTextFromImage(
  image: File | Blob | string,
  onProgress?: (pct: number) => void,
): Promise<OcrResult> {
  const Tesseract = await import("tesseract.js")
  const recognize = (Tesseract as unknown as { recognize: typeof import("tesseract.js").recognize }).recognize
    ?? (Tesseract as unknown as { default: { recognize: typeof import("tesseract.js").recognize } }).default.recognize

  const { data } = await recognize(image, "eng", {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text" && onProgress) onProgress(Math.round(m.progress * 100))
    },
  })
  return { text: (data.text ?? "").trim(), confidence: Math.round(data.confidence ?? 0) }
}

/** Heuristic field hints pulled from OCR text — handy for prefilling forms. */
export function extractFieldHints(text: string): {
  reference: string | null
  dates: string[]
} {
  // A reference / certificate number: a token with digits, ≥5 chars.
  const refMatch = text.match(/\b([A-Z]{0,4}[-/]?\d[\dA-Z\-/]{4,})\b/)
  // Dates in common UK formats.
  const dates = Array.from(
    text.matchAll(/\b(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b/g),
  ).map((m) => m[0])
  return { reference: refMatch ? refMatch[1] : null, dates: Array.from(new Set(dates)).slice(0, 5) }
}
