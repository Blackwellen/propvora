"use client"

import React, { useRef, useState } from "react"
import { ScanText, Loader2, Copy, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { extractTextFromImage, extractFieldHints } from "@/lib/ocr/extractText"

interface Props {
  /** Called with the full recognised text once OCR completes. */
  onExtract?: (text: string) => void
  /** Apply a detected reference/certificate number to a parent field. */
  onApplyReference?: (reference: string) => void
  /** Apply a detected date (raw string) to a parent field. */
  onApplyDate?: (date: string) => void
  /** Button label. */
  label?: string
  className?: string
}

/**
 * Free, on-device OCR scanner. Pick a document/certificate photo and it extracts
 * the text in-browser (tesseract.js — no API key, nothing leaves the device).
 * Detected reference numbers and dates surface as one-tap "apply" chips so the
 * user can prefill a form. Fully self-contained and reusable.
 */
export function OcrScanner({ onExtract, onApplyReference, onApplyDate, label = "Scan text from image", className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [text, setText] = useState<string | null>(null)
  const [hints, setHints] = useState<{ reference: string | null; dates: string[] }>({ reference: null, dates: [] })
  const [confidence, setConfidence] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function run(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image (JPG, PNG, WebP).")
      return
    }
    setError(null)
    setText(null)
    setBusy(true)
    setProgress(0)
    try {
      const result = await extractTextFromImage(file, setProgress)
      setText(result.text)
      setConfidence(result.confidence)
      setHints(extractFieldHints(result.text))
      onExtract?.(result.text)
    } catch {
      setError("Couldn't read text from that image. Try a clearer, higher-contrast photo.")
    } finally {
      setBusy(false)
    }
  }

  async function copyAll() {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin text-[var(--brand)]" /> : <ScanText className="w-4 h-4 text-[var(--brand)]" />}
        {busy ? (progress > 0 ? `Reading… ${progress}%` : "Reading…") : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) run(f); e.target.value = "" }}
      />

      {error && <p className="text-[12px] text-red-600" role="alert">{error}</p>}

      {text != null && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-slate-600">
              Extracted text{confidence != null ? ` · ${confidence}% confidence` : ""}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={copyAll}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-medium text-slate-500 hover:bg-slate-200/60"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={() => { setText(null); setHints({ reference: null, dates: [] }) }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200/60"
                aria-label="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Detected field chips */}
          {(hints.reference || hints.dates.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {hints.reference && (
                <button
                  type="button"
                  onClick={() => onApplyReference?.(hints.reference!)}
                  disabled={!onApplyReference}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--brand)] hover:brightness-95 disabled:cursor-default disabled:opacity-80"
                  title={onApplyReference ? "Apply as reference" : undefined}
                >
                  Ref: {hints.reference}
                </button>
              )}
              {hints.dates.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onApplyDate?.(d)}
                  disabled={!onApplyDate}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:brightness-95 disabled:cursor-default disabled:opacity-80"
                  title={onApplyDate ? "Apply as date" : undefined}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          <textarea
            readOnly
            value={text || "(no text detected)"}
            className="w-full h-32 resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 font-mono focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}
