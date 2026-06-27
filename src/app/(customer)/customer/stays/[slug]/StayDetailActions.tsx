"use client"

import { useEffect, useState } from "react"
import { Share2, Heart, Check, Loader2 } from "lucide-react"

/**
 * Interactive header actions for the customer stay detail page.
 * Share uses the Web Share API where available and falls back to copying the URL.
 * Save persists to the customer favourites backend (`/api/customer/favourites`),
 * keyed by the stay slug. On load it reflects whether the stay is already saved.
 */
export default function StayDetailActions({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  // Reflect current saved state from the server.
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const res = await fetch("/api/customer/favourites", { headers: { accept: "application/json" } })
        if (!res.ok || !active) return
        const data = (await res.json()) as { items?: { entity_type: string | null; metadata_json?: { ref?: string } | null }[] }
        const isSaved = (data.items ?? []).some((i) => i.entity_type === "stay" && i.metadata_json?.ref === slug)
        if (active) setSaved(isSaved)
      } catch {
        // ignore — default to unsaved
      }
    })()
    return () => { active = false }
  }, [slug])

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

  async function toggleSave() {
    if (busy) return
    setBusy(true)
    const next = !saved
    setSaved(next) // optimistic
    try {
      const res = next
        ? await fetch("/api/customer/favourites", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ entityType: "stay", ref: slug, label: title }),
          })
        : await fetch(`/api/customer/favourites?ref=${encodeURIComponent(slug)}`, { method: "DELETE" })
      if (!res.ok) setSaved(!next) // roll back on failure
    } catch {
      setSaved(!next)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleSave}
        disabled={busy}
        aria-pressed={saved}
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : ""}`} />}
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
