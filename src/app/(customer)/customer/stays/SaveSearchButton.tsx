"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bookmark, BookmarkPlus, Loader2, ChevronDown, Trash2 } from "lucide-react"

interface SavedSearch { id: string; label: string; query: Record<string, unknown> }

/**
 * "Save this search" for the customer stays page. Captures the current URL query
 * (where / checkin / checkout / guests / filter chips) and persists it to
 * customer_saved_searches via /api/customer/saved-searches. Saved searches can be
 * re-applied (navigates with the stored query) or removed.
 */
export default function SaveSearchButton({ basePath = "/customer/stays" }: { basePath?: string }) {
  const router = useRouter()
  const [items, setItems] = useState<SavedSearch[]>([])
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  async function load() {
    try {
      const res = await fetch("/api/customer/saved-searches", { headers: { accept: "application/json" } })
      if (!res.ok) return
      const data = (await res.json()) as { items?: SavedSearch[] }
      setItems(data.items ?? [])
    } catch { /* ignore */ }
  }
  useEffect(() => { void load() }, [])

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  function currentQuery(): Record<string, string> {
    if (typeof window === "undefined") return {}
    const params = new URLSearchParams(window.location.search)
    return Object.fromEntries(params.entries())
  }

  function labelFor(q: Record<string, string>): string {
    const where = q.where || q.location
    return where ? `Stays in ${where}` : "Stays search"
  }

  async function save() {
    setSaving(true); setNote(null)
    try {
      const query = currentQuery()
      const res = await fetch("/api/customer/saved-searches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: labelFor(query), query }),
      })
      if (!res.ok) { setNote("Could not save this search."); return }
      setNote("Search saved.")
      await load()
      setOpen(true)
    } catch { setNote("Could not save this search.") } finally { setSaving(false) }
  }

  function apply(s: SavedSearch) {
    const q = new URLSearchParams(Object.entries(s.query).map(([k, v]) => [k, String(v)]))
    router.push(`${basePath}${q.toString() ? `?${q.toString()}` : ""}`)
    setOpen(false)
  }

  async function remove(id: string) {
    try {
      await fetch(`/api/customer/saved-searches?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      await load()
    } catch { /* ignore */ }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex items-center gap-1.5">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />} Save search
        </button>
        {items.length > 0 && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Saved searches"
            className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Bookmark className="w-4 h-4" /> {items.length} <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {note && <span className="absolute -bottom-5 left-0 text-[11px] text-slate-400 whitespace-nowrap">{note}</span>}
      {open && items.length > 0 && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg z-40 p-1.5">
          <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Saved searches</p>
          {items.map((s) => (
            <div key={s.id} className="flex items-center gap-1 group">
              <button onClick={() => apply(s)} className="flex-1 text-left px-2.5 py-1.5 rounded-lg text-[12.5px] text-slate-700 hover:bg-slate-50 truncate">{s.label}</button>
              <button onClick={() => remove(s.id)} aria-label="Remove" className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
