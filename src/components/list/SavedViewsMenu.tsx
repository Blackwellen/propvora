"use client"

import React, { useEffect, useRef, useState } from "react"
import { BookmarkPlus, Check, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useSavedViews,
  useCreateSavedView,
  useDeleteSavedView,
} from "@/hooks/useSavedViews"

/**
 * Reusable Saved Views control for any list surface.
 *
 * The page owns the shape of `currentConfig` (its filters/search/view mode)
 * and how to apply one via `onApply`. This component handles persistence,
 * listing, naming and deletion against the live `saved_views` table.
 */
export function SavedViewsMenu<TConfig extends Record<string, unknown>>({
  workspaceId,
  entity,
  currentConfig,
  onApply,
  className,
}: {
  workspaceId: string | undefined
  entity: string
  currentConfig: TConfig
  onApply: (config: TConfig) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: views = [], isLoading } = useSavedViews<TConfig>(workspaceId, entity)
  const createView = useCreateSavedView()
  const deleteView = useDeleteSavedView()

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  async function handleSave() {
    if (!workspaceId) return
    const name = window.prompt("Name this view")?.trim()
    if (!name) return
    try {
      await createView.mutateAsync({ workspaceId, entity, name, config: currentConfig })
    } catch {
      /* surfaced via disabled state; table may be unprovisioned */
    }
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 flex items-center gap-1.5 hover:bg-slate-50"
      >
        <BookmarkPlus className="w-3.5 h-3.5" /> Saved Views
        {views.length > 0 && (
          <span className="ml-0.5 text-[10px] font-semibold text-[var(--brand)] bg-[var(--brand-soft)] rounded-full px-1.5 py-px">
            {views.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100">
            <button
              onClick={handleSave}
              disabled={!workspaceId || createView.isPending}
              className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-strong)] disabled:opacity-50 text-white text-[12.5px] font-semibold transition-colors"
            >
              {createView.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BookmarkPlus className="w-3.5 h-3.5" />
              )}
              Save current view
            </button>
          </div>

          <div className="max-h-[min(55vh,288px)] overflow-y-auto overscroll-contain py-1">
            {isLoading ? (
              <p className="px-3 py-3 text-[12px] text-slate-400 text-center">Loading…</p>
            ) : views.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-slate-400 text-center">
                No saved views yet. Set your filters, then save the current view.
              </p>
            ) : (
              views.map((v) => (
                <div
                  key={v.id}
                  className="group flex items-center gap-2 px-3 py-2 hover:bg-slate-50"
                >
                  <button
                    onClick={() => {
                      onApply(v.config)
                      setOpen(false)
                    }}
                    className="flex-1 flex items-center gap-2 text-left min-w-0"
                  >
                    <Check className="w-3.5 h-3.5 text-slate-300 group-hover:text-[var(--brand)] shrink-0" />
                    <span className="text-[12.5px] text-slate-700 truncate">{v.name}</span>
                  </button>
                  <button
                    onClick={() =>
                      workspaceId &&
                      deleteView.mutate({ id: v.id, workspaceId, entity })
                    }
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                    aria-label={`Delete ${v.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
