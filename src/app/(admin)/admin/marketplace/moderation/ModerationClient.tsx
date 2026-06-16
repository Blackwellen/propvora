"use client"

import React, { useState } from "react"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Tag,
  MapPin,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

interface ListingRow {
  id: string
  workspace_id: string | null
  company_name: string
  title: string | null
  listing_type: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
  metadata: Record<string, unknown> | null
  trades: string[] | null
  location_city: string | null
  location_postcode: string | null
  contact_email: string | null
}

type ItemState = "idle" | "approving" | "rejecting" | "approved" | "rejected" | "error"

interface ItemActionState {
  state: ItemState
  error: string | null
  rejectReason: string
  showRejectInput: boolean
}

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch {
    return d
  }
}

function humaniseType(t: string) {
  return t
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Single moderation card ─────────────────────────────────────────────────────

function ListingCard({
  listing,
  actionState,
  onApprove,
  onReject,
  onShowReject,
  onRejectReasonChange,
  onCancelReject,
}: {
  listing: ListingRow
  actionState: ItemActionState
  onApprove: () => void
  onReject: () => void
  onShowReject: () => void
  onRejectReasonChange: (v: string) => void
  onCancelReject: () => void
}) {
  const { state, error, rejectReason, showRejectInput } = actionState

  if (state === "approved") {
    return (
      <Card className="p-4 rounded-2xl border-emerald-200 bg-emerald-50">
        <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Approved — {listing.company_name} — {listing.title || "listing"} is now published.
        </div>
      </Card>
    )
  }

  if (state === "rejected") {
    return (
      <Card className="p-4 rounded-2xl border-red-200 bg-red-50">
        <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
          <XCircle className="w-4 h-4 shrink-0" />
          Rejected — {listing.company_name} — listing moved back to draft.
        </div>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border-slate-200">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-900">
                {listing.company_name}
              </h3>
              <Badge variant="warning" dot>Pending review</Badge>
            </div>
            {listing.title && listing.title !== listing.company_name && (
              <p className="text-xs text-slate-500 mt-0.5">{listing.title}</p>
            )}
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
            <Tag className="w-3 h-3" />
            {humaniseType(listing.listing_type)}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
          {(listing.location_city || listing.location_postcode) && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {[listing.location_city, listing.location_postcode].filter(Boolean).join(", ")}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            {listing.workspace_id?.slice(0, 8) ?? "unknown workspace"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Submitted {fmtDate(listing.updated_at)}
          </span>
        </div>

        {/* Trades */}
        {listing.trades && listing.trades.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {listing.trades.slice(0, 6).map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#1d4ed8]"
              >
                {t}
              </span>
            ))}
            {listing.trades.length > 6 && (
              <span className="text-[11px] text-slate-400">+{listing.trades.length - 6} more</span>
            )}
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
            {listing.description}
          </p>
        )}

        {/* Contact */}
        {listing.contact_email && (
          <p className="text-xs text-slate-400">
            Contact: <span className="font-mono">{listing.contact_email}</span>
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Reject reason input */}
        {showRejectInput && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">
              Rejection reason (optional — sent to supplier)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
              placeholder="e.g. Missing trade licence information, incorrect category…"
              rows={2}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 resize-none"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={onReject}
                disabled={state === "rejecting"}
                className="bg-red-600 hover:bg-red-700"
              >
                <XCircle className="w-4 h-4" />
                {state === "rejecting" ? "Rejecting…" : "Confirm reject"}
              </Button>
              <Button variant="outline" size="sm" onClick={onCancelReject} disabled={state === "rejecting"}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!showRejectInput && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={onApprove}
              disabled={state === "approving" || state === "rejecting"}
            >
              <CheckCircle2 className="w-4 h-4" />
              {state === "approving" ? "Approving…" : "Approve"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onShowReject}
              disabled={state === "approving" || state === "rejecting"}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

// ── Page client ───────────────────────────────────────────────────────────────

export default function ModerationClient({
  listings,
  schemaGap,
}: {
  listings: ListingRow[]
  schemaGap: boolean
}) {
  const [actionStates, setActionStates] = useState<Record<string, ItemActionState>>(() => {
    const s: Record<string, ItemActionState> = {}
    for (const l of listings) {
      s[l.id] = { state: "idle", error: null, rejectReason: "", showRejectInput: false }
    }
    return s
  })

  function patchState(id: string, patch: Partial<ItemActionState>) {
    setActionStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }))
  }

  async function handleDecision(id: string, decision: "approve" | "reject", reason?: string) {
    patchState(id, {
      state: decision === "approve" ? "approving" : "rejecting",
      error: null,
    })
    try {
      const res = await fetch(`/api/admin/marketplace/listings/${id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: reason ?? null }),
      })
      const json = await res.json()
      if (!res.ok) {
        patchState(id, { state: "idle", error: json.error ?? "Action failed" })
        return
      }
      patchState(id, {
        state: decision === "approve" ? "approved" : "rejected",
        showRejectInput: false,
      })
    } catch {
      patchState(id, { state: "idle", error: "Network error — please try again" })
    }
  }

  const pendingCount = listings.filter((l) => {
    const s = actionStates[l.id]?.state
    return !s || s === "idle" || s === "approving" || s === "rejecting" || s === "error"
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
            Listing moderation
          </h1>
          <p className="text-xs text-slate-500">
            Review and approve or reject supplier marketplace listings before they go live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {pendingCount} pending
          </span>
        </div>
      </div>

      {/* Schema gap notice */}
      {schemaGap && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            The <code className="font-mono text-xs">marketplace_listings</code> table is not yet provisioned.
            Run the marketplace schema migration to enable this queue.
          </p>
        </div>
      )}

      {/* Honesty note */}
      {!schemaGap && (
        <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[11.5px] leading-relaxed text-slate-500">
            Approving a listing sets it to <code className="font-mono">published</code> and records the action
            in the audit log. Rejecting moves it back to <code className="font-mono">draft</code> and stores
            the rejection reason. Every decision is attributed to your admin account.
          </p>
        </div>
      )}

      {/* Queue */}
      {!schemaGap && listings.length === 0 && (
        <Card className="p-8 rounded-2xl border-slate-200">
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
            <p className="text-sm font-semibold text-slate-800">Queue is clear</p>
            <p className="text-xs text-slate-400 mt-1">
              No listings are currently awaiting review.
            </p>
          </div>
        </Card>
      )}

      {!schemaGap && listings.length > 0 && (
        <div className="space-y-3">
          {listings.map((listing) => {
            const s = actionStates[listing.id] ?? {
              state: "idle" as const,
              error: null,
              rejectReason: "",
              showRejectInput: false,
            }
            return (
              <ListingCard
                key={listing.id}
                listing={listing}
                actionState={s}
                onApprove={() => handleDecision(listing.id, "approve")}
                onReject={() =>
                  handleDecision(listing.id, "reject", s.rejectReason || undefined)
                }
                onShowReject={() => patchState(listing.id, { showRejectInput: true })}
                onRejectReasonChange={(v) => patchState(listing.id, { rejectReason: v })}
                onCancelReject={() =>
                  patchState(listing.id, { showRejectInput: false, rejectReason: "" })
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
