"use client"

import React, { useEffect, useRef, useState } from "react"
import { X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { useIsMobile, useHasMounted } from "@/components/mobile/useBreakpoint"
import MobileSheet from "@/components/mobile/MobileSheet"
import { CATEGORIES, TRANSACTION_TYPES, COUNTRY_OPTIONS } from "./taxonomy"
import type { OwnListing, OwnListingStatus } from "./types"

/* ──────────────────────────────────────────────────────────────────────────
   ListingFormDialog — create / edit a marketplace listing.

   Money is captured in MAJOR units in the field and converted to integer PENCE
   on submit (`base_price_pence`). Desktop renders a centered modal; mobile uses
   the shared MobileSheet (dedicated branch, not a reflowed desktop form).

   The dialog never writes directly — it calls `onSubmit(payload)` and lets the
   page own the POST/PATCH and refetch.
─────────────────────────────────────────────────────────────────────────── */

export interface ListingFormPayload {
  title: string
  description: string | null
  category: string | null
  transaction_type: string | null
  country_code: string | null
  currency: string
  base_price_pence: number | null
  pricing_model: string | null
  location: string | null
  status: OwnListingStatus
}

interface Props {
  open: boolean
  onClose: () => void
  /** Existing listing when editing; omit for create. */
  listing?: OwnListing | null
  /** Submit handler — returns an error string to keep the dialog open. */
  onSubmit: (payload: ListingFormPayload) => Promise<string | null>
  defaultCountry?: string | null
}

const PRICING_MODELS = [
  { value: "fixed", label: "Fixed price" },
  { value: "per_night", label: "Per night" },
  { value: "per_day", label: "Per day" },
  { value: "per_hour", label: "Per hour" },
  { value: "per_month", label: "Per month" },
  { value: "per_job", label: "Per job" },
]

const FIELD =
  "w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
const LABEL = "text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1 block"

function penceToMajor(p: number | null | undefined): string {
  return p === null || p === undefined ? "" : String(p / 100)
}

export function ListingFormDialog({ open, onClose, listing, onSubmit, defaultCountry }: Props) {
  const mounted = useHasMounted()
  const mobileMatch = useIsMobile()
  const isMobile = mounted && mobileMatch
  const editing = !!listing

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [transactionType, setTransactionType] = useState("service")
  const [countryCode, setCountryCode] = useState(defaultCountry ?? "GB")
  const [currency, setCurrency] = useState("GBP")
  const [priceMajor, setPriceMajor] = useState("")
  const [pricingModel, setPricingModel] = useState("fixed")
  const [location, setLocation] = useState("")
  const [status, setStatus] = useState<OwnListingStatus>("draft")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Seed fields whenever the dialog opens (or the target listing changes).
  useEffect(() => {
    if (!open) return
    setError(null)
    setTitle(listing?.title ?? "")
    setDescription(listing?.description ?? "")
    setCategory(listing?.category ?? "")
    setTransactionType(listing?.transactionType ?? "service")
    setCountryCode(listing?.countryCode ?? defaultCountry ?? "GB")
    setCurrency(listing?.currency ?? "GBP")
    setPriceMajor(penceToMajor(listing?.basePricePence))
    setPricingModel(listing?.pricingModel ?? "fixed")
    setLocation(listing?.location ?? "")
    setStatus(listing?.status ?? "draft")
  }, [open, listing, defaultCountry])

  const buildPayload = (publish: boolean): ListingFormPayload | null => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError("Give your listing a title.")
      return null
    }
    let pence: number | null = null
    if (priceMajor.trim() !== "") {
      const n = Number(priceMajor)
      if (!Number.isFinite(n) || n < 0) {
        setError("Enter a valid price, or leave it blank for 'price on request'.")
        return null
      }
      pence = Math.round(n * 100)
    }
    return {
      title: trimmedTitle,
      description: description.trim() || null,
      category: category || null,
      transaction_type: transactionType || null,
      country_code: countryCode || null,
      currency: currency || "GBP",
      base_price_pence: pence,
      pricing_model: pricingModel || null,
      location: location.trim() || null,
      status: publish ? "published" : status,
    }
  }

  const submit = async (publish: boolean) => {
    const payload = buildPayload(publish)
    if (!payload) return
    setSubmitting(true)
    setError(null)
    const err = await onSubmit(payload)
    setSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    onClose()
  }

  const body = (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label className={LABEL}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Emergency boiler repair — Greater London"
          className={FIELD}
          autoFocus={!isMobile}
        />
      </div>

      <div>
        <label className={LABEL}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what's on offer, turnaround times, coverage area…"
          rows={4}
          className={cn(FIELD, "h-auto py-2.5 resize-y leading-relaxed")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={FIELD}>
            <option value="">Select…</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Listing type</label>
          <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)} className={FIELD}>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={LABEL}>Currency</label>
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
            className={FIELD}
            maxLength={3}
          />
        </div>
        <div>
          <label className={LABEL}>Price</label>
          <input
            inputMode="decimal"
            value={priceMajor}
            onChange={(e) => setPriceMajor(e.target.value)}
            placeholder="On request"
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL}>Pricing</label>
          <select value={pricingModel} onChange={(e) => setPricingModel(e.target.value)} className={FIELD}>
            {PRICING_MODELS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Country</label>
          <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className={FIELD}>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City / region"
            className={FIELD}
          />
        </div>
      </div>

      {editing && (
        <div>
          <label className={LABEL}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as OwnListingStatus)} className={FIELD}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      )}

      <p className="text-[11.5px] text-slate-400">
        Prices are stored to the penny. Leave the price blank to show &ldquo;Price on request&rdquo;.
      </p>
    </div>
  )

  const footer = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="md" className="flex-1" onClick={onClose} disabled={submitting}>
        Cancel
      </Button>
      <Button
        variant="outline"
        size="md"
        className="flex-1"
        onClick={() => submit(false)}
        loading={submitting}
      >
        {editing ? "Save" : "Save draft"}
      </Button>
      <Button variant="primary" size="md" className="flex-[1.4]" onClick={() => submit(true)} loading={submitting}>
        {editing && listing?.status === "published" ? "Save & keep live" : "Publish"}
      </Button>
    </div>
  )

  /* Mobile — bottom sheet. */
  if (isMobile) {
    return (
      <MobileSheet
        open={open}
        onClose={onClose}
        title={editing ? "Edit listing" : "New listing"}
        description={editing ? "Update your marketplace listing" : "Publish to the marketplace"}
        footer={footer}
      >
        {body}
      </MobileSheet>
    )
  }

  /* Desktop — centered modal. */
  return <DesktopModal open={open} onClose={onClose} title={editing ? "Edit listing" : "New listing"} footer={footer}>{body}</DesktopModal>
}

/* Lightweight desktop modal (focus-managed, Esc + backdrop close). */
function DesktopModal({
  open,
  onClose,
  title,
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  footer: React.ReactNode
  children: React.ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 hidden md:flex items-start justify-center p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-[560px] my-8 rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[88vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        <div className="px-5 py-4 border-t border-slate-100">{footer}</div>
      </div>
    </div>
  )
}

export default ListingFormDialog
