"use client"

import React, { useState } from "react"
import { Star, Plus, X, CheckCircle2, ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  RATING_DIMENSIONS,
  ratingAverage,
  useSupplierRatings,
  useCreateSupplierRating,
  type RatingDimension,
  type SupplierRatingInput,
} from "@/lib/suppliers/ratings"

// ============================================================
// Internal supplier rating card + form, for the supplier detail page.
// Reads/writes LIVE supplier_ratings. No public-marketplace reviews.
// ============================================================

function StarPicker({
  value,
  onChange,
  readOnly,
}: {
  value: number | null
  onChange?: (v: number) => void
  readOnly?: boolean
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn(
            "text-lg leading-none transition-colors",
            !readOnly && "hover:scale-110 cursor-pointer",
            value != null && n <= value ? "text-amber-400" : "text-slate-200"
          )}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

const EMPTY_FORM: SupplierRatingInput = {
  quality: null,
  speed: null,
  communication: null,
  reliability: null,
  price_value: null,
  compliance: null,
  tenant_satisfaction: null,
  would_use_again: null,
  internal_notes: "",
}

export function SupplierRatingPanel({
  workspaceId,
  supplierContactId,
  disabled,
}: {
  workspaceId: string | undefined
  supplierContactId: string | undefined
  disabled?: boolean
}) {
  const enabled = !!workspaceId && !!supplierContactId && !disabled
  const { data: ratings = [], isLoading } = useSupplierRatings(
    workspaceId,
    supplierContactId,
    enabled
  )
  const createRating = useCreateSupplierRating()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SupplierRatingInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  // Latest rating drives the headline; average across its dimensions.
  const latest = ratings[0] ?? null
  const headline = latest ? ratingAverage(latest) : null

  function setDim(key: RatingDimension, v: number) {
    setForm((f) => ({ ...f, [key]: v }))
  }

  async function submit() {
    if (!workspaceId || !supplierContactId) return
    const hasAny =
      RATING_DIMENSIONS.some((d) => form[d.key] != null) ||
      form.would_use_again != null ||
      (form.internal_notes ?? "").trim() !== ""
    if (!hasAny) {
      setError("Add at least one rating before saving.")
      return
    }
    setError(null)
    try {
      await createRating.mutateAsync({
        workspaceId,
        supplierContactId,
        input: {
          ...form,
          internal_notes: (form.internal_notes ?? "").trim() || null,
        },
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the rating.")
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Internal Rating</h3>
        {!disabled && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add rating
          </button>
        )}
      </div>

      {disabled ? (
        <p className="text-[12.5px] text-slate-500">
          Internal ratings are available once this supplier is saved as a live contact.
        </p>
      ) : isLoading ? (
        <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
      ) : (
        <>
          {/* Headline */}
          <div className="flex items-center gap-3 mb-1">
            <StarPicker value={headline != null ? Math.round(headline) : null} readOnly />
            <span className="text-xl font-bold text-slate-900">
              {headline != null ? `${headline.toFixed(1)} / 5` : "Not rated"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            {ratings.length > 0
              ? `Based on ${ratings.length} internal rating${ratings.length > 1 ? "s" : ""}`
              : "No internal ratings yet — add the first one."}
          </p>

          {/* Latest breakdown */}
          {latest && (
            <div className="space-y-1.5 pt-3 border-t border-slate-100 mb-1">
              {RATING_DIMENSIONS.map((d) => {
                const v = latest[d.key]
                if (v == null) return null
                return (
                  <div key={d.key} className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-600">{d.label}</span>
                    <StarPicker value={v} readOnly />
                  </div>
                )
              })}
              {latest.would_use_again != null && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[12px] text-slate-600">Would use again</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-semibold",
                      latest.would_use_again ? "text-emerald-600" : "text-red-600"
                    )}
                  >
                    {latest.would_use_again ? (
                      <>
                        <ThumbsUp className="w-3.5 h-3.5" /> Yes
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="w-3.5 h-3.5" /> No
                      </>
                    )}
                  </span>
                </div>
              )}
              {latest.internal_notes && (
                <p className="text-[12px] text-slate-500 pt-1.5 italic">
                  &ldquo;{latest.internal_notes}&rdquo;
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Form */}
      {showForm && !disabled && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] font-semibold text-slate-700">New internal rating</p>
            <button
              onClick={() => {
                setShowForm(false)
                setForm(EMPTY_FORM)
                setError(null)
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {RATING_DIMENSIONS.map((d) => (
            <div key={d.key} className="flex items-center justify-between">
              <span className="text-[12.5px] text-slate-600">{d.label}</span>
              <StarPicker value={form[d.key] ?? null} onChange={(v) => setDim(d.key, v)} />
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[12.5px] text-slate-600">Would use again</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, would_use_again: true }))}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors",
                  form.would_use_again === true
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Yes
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, would_use_again: false }))}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors",
                  form.would_use_again === false
                    ? "bg-red-50 border-red-300 text-red-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                <ThumbsDown className="w-3.5 h-3.5" /> No
              </button>
            </div>
          </div>

          <textarea
            className="w-full min-h-20 rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-900 resize-y focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            placeholder="Internal notes (only your team sees this)…"
            value={form.internal_notes ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, internal_notes: e.target.value }))}
          />

          {error && <p className="text-[12px] text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={createRating.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              {createRating.isPending ? "Saving…" : "Save rating"}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setForm(EMPTY_FORM)
                setError(null)
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* History (compact) */}
      {!disabled && ratings.length > 1 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            History
          </p>
          <div className="space-y-1.5">
            {ratings.slice(1, 5).map((r) => {
              const avg = ratingAverage(r)
              return (
                <div key={r.id} className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-500">
                    {new Date(r.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {avg != null ? avg.toFixed(1) : "—"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
