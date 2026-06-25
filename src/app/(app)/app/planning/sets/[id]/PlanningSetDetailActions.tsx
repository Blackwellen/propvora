"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Copy, MoreHorizontal, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface PlanningSetDetailActionsProps {
  planningSetId: string
  title: string
}

export function PlanningSetDetailActions({ planningSetId, title }: PlanningSetDetailActionsProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDuplicate() {
    setMenuOpen(false)
    const supabase = createClient()
    const { data: original } = await supabase
      .from("planning_sets")
      .select("*")
      .eq("id", planningSetId)
      .single()
    if (!original) return
    const { id, created_at, updated_at, ...rest } = original as Record<string, unknown>
    void id; void created_at; void updated_at
    const { data: created } = await supabase
      .from("planning_sets")
      .insert({ ...rest, title: `${original.title ?? "Plan"} (copy)`, status: "draft" })
      .select("id")
      .single()
    if (created?.id) router.push(`/property-manager/planning/sets/${created.id}/overview`)
  }

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from("planning_sets").delete().eq("id", planningSetId)
    router.push("/property-manager/planning/sets")
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap relative">
      <button
        onClick={() => { setMenuOpen(false); handleDuplicate() }}
        aria-label="Duplicate planning set"
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Copy className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Duplicate</span>
      </button>

      <button
        aria-label="More actions"
        onClick={() => setMenuOpen((v) => !v)}
        className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px]">
            <button
              onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-[12.5px] text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-[15px] font-bold text-slate-900 mb-1">Delete planning set?</h3>
            <p className="text-[13px] text-slate-500 mb-5">
              Remove &ldquo;{title}&rdquo;? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-9 px-4 rounded-xl bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
