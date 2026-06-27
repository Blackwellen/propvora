"use client"

import { useState } from "react"
import { Share2, Heart, Check } from "lucide-react"

/**
 * Interactive header actions for the public stay detail page.
 * Share uses the Web Share API where available and falls back to copying the
 * current URL to the clipboard — this is real, backend-free functionality.
 * Save shows a confirmation; the customer favourites backend is a V2 surface
 * (the customer workspace ships as a flag-gated demo for V1).
 */
export default function StayDetailActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : ""
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard?.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setSaved((s) => !s)}
        aria-pressed={saved}
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : ""}`} />
        {saved ? "Saved" : "Save"}
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
        {copied ? "Link copied" : "Share"}
      </button>
    </div>
  )
}
