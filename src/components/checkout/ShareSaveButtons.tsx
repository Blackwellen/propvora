"use client"

// ============================================================================
// ShareSaveButtons — wired Share (Web Share API → clipboard fallback) + Save
// (localStorage favourites) controls for marketplace profile pages.
// Light tokens only — NEVER `dark:`.
// ============================================================================

import { useEffect, useState } from "react"
import { Check, Heart, Share2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Variant = "default" | "compact" | "danger"

function readSaved(key: string): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]")
  } catch {
    return []
  }
}

export default function ShareSaveButtons({
  slug,
  storageKey,
  title,
  variant = "default",
  className = "",
}: {
  slug: string
  storageKey: string
  title: string
  variant?: Variant
  className?: string
}) {
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    setSaved(readSaved(storageKey).includes(slug))
    let on = true
    createClient().auth.getUser().then(({ data }) => { if (on) setAuthed(!!data.user) })
    return () => { on = false }
  }, [slug, storageKey])

  function toggleSave() {
    // Saving is account-backed — prompt login when signed out.
    if (authed === false) {
      const next = typeof window !== "undefined" ? window.location.pathname : "/"
      window.location.assign(`/login?next=${encodeURIComponent(next)}`)
      return
    }
    const list = readSaved(storageKey)
    const idx = list.indexOf(slug)
    if (idx === -1) list.push(slug)
    else list.splice(idx, 1)
    try {
      localStorage.setItem(storageKey, JSON.stringify(list))
    } catch {
      /* ignore */
    }
    setSaved(idx === -1)
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url })
        return
      }
    } catch {
      /* user cancelled or unsupported — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const heartActive = variant === "danger"

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={share}
          aria-label="Share"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
        >
          {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={toggleSave}
          aria-label={saved ? "Remove from saved" : "Save"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>
      </div>
    )
  }

  const heartBtn =
    heartActive
      ? "border-red-200 text-red-600 hover:bg-red-50"
      : "border-slate-200 text-slate-600 hover:bg-slate-50"

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={share}
        className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
        {copied ? "Link copied" : "Share"}
      </button>
      <button
        type="button"
        onClick={toggleSave}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${heartBtn}`}
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  )
}
