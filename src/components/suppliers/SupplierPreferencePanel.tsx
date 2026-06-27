"use client"

import React, { useEffect, useState } from "react"
import { Star, Ban, CheckCircle2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useSupplierPreference,
  useUpsertSupplierPreference,
  type SupplierPreferenceInput,
} from "@/lib/suppliers/ratings"

// ============================================================
// Preferred / blocked supplier marking, for the supplier detail page.
// Reads/writes LIVE supplier_preferences (reason, categories, review date,
// blocked flag). Wired to a real upsert.
// ============================================================

export function SupplierPreferencePanel({
  workspaceId,
  supplierContactId,
  disabled,
}: {
  workspaceId: string | undefined
  supplierContactId: string | undefined
  disabled?: boolean
}) {
  const enabled = !!workspaceId && !!supplierContactId && !disabled
  const { data: pref, isLoading } = useSupplierPreference(
    workspaceId,
    supplierContactId,
    enabled
  )
  const upsert = useUpsertSupplierPreference()

  const [editing, setEditing] = useState(false)
  const [reason, setReason] = useState("")
  const [categories, setCategories] = useState("")
  const [reviewDate, setReviewDate] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (pref) {
      setReason(pref.reason ?? "")
      setCategories((pref.categories ?? []).join(", "))
      setReviewDate(pref.review_date ?? "")
    }
  }, [pref])

  async function save(input: SupplierPreferenceInput) {
    if (!workspaceId || !supplierContactId) return
    setError(null)
    try {
      await upsert.mutateAsync({ workspaceId, supplierContactId, input })
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.")
    }
  }

  function saveDetails() {
    const cats = categories
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
    save({
      preferred: pref?.preferred ?? false,
      blocked: pref?.blocked ?? false,
      reason: reason.trim() || null,
      categories: cats,
      review_date: reviewDate || null,
    })
  }

  const isPreferred = pref?.preferred ?? false
  const isBlocked = pref?.blocked ?? false

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Supplier Status</h3>
        {!disabled && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[12px] font-semibold text-[var(--brand)] hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {disabled ? (
        <p className="text-[12.5px] text-slate-500">
          Preferred / blocked marking is available once this supplier is saved as a live contact.
        </p>
      ) : isLoading ? (
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
      ) : (
        <>
          {/* Toggle buttons */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => save({ preferred: !isPreferred, blocked: false })}
              disabled={upsert.isPending}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold transition-colors disabled:opacity-60",
                isPreferred
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Star className={cn("w-3.5 h-3.5", isPreferred && "fill-amber-400 text-amber-400")} />
              {isPreferred ? "Preferred" : "Mark Preferred"}
            </button>
            <button
              onClick={() => save({ blocked: !isBlocked, preferred: false })}
              disabled={upsert.isPending}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold transition-colors disabled:opacity-60",
                isBlocked
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Ban className="w-3.5 h-3.5" />
              {isBlocked ? "Blocked" : "Block"}
            </button>
          </div>

          {/* Details (read view) */}
          {!editing && (
            <div className="space-y-2 text-[12.5px]">
              {pref?.reason && (
                <div>
                  <p className="text-[11px] text-slate-400">Reason</p>
                  <p className="text-slate-700">{pref.reason}</p>
                </div>
              )}
              {pref?.categories && pref.categories.length > 0 && (
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">Categories covered</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pref.categories.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {pref?.review_date && (
                <div>
                  <p className="text-[11px] text-slate-400">Review by</p>
                  <p className="text-slate-700">
                    {new Date(pref.review_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
              {!pref?.reason && (!pref?.categories || pref.categories.length === 0) && (
                <p className="text-[12px] text-slate-400">
                  No marking details yet — use Edit to add a reason, categories, and a review date.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Details (edit view) */}
      {editing && !disabled && (
        <div className="space-y-3 mt-1">
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] font-semibold text-slate-700">Marking details</p>
            <button
              onClick={() => setEditing(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label className="text-[11px] text-slate-500">Reason</label>
            <textarea
              className="w-full min-h-16 mt-1 rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-900 resize-y focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
              placeholder="Why is this supplier preferred / blocked?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500">Categories covered (comma-separated)</label>
            <input
              type="text"
              className="w-full mt-1 h-9 rounded-xl border border-slate-200 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
              placeholder="e.g. Plumbing, Heating, Emergency"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500">Review / expiry date</label>
            <input
              type="date"
              className="w-full mt-1 h-9 rounded-xl border border-slate-200 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
            />
          </div>
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={saveDetails}
              disabled={upsert.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              {upsert.isPending ? "Saving…" : "Save details"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
