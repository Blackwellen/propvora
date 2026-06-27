"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, Handshake, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// ── Live planning_landlord_offers row shape (per live schema) ──────────────────

interface PlanningLandlordOffer {
  id: string
  workspace_id: string
  planning_set_id: string | null
  landlord_contact_id: string | null
  property_address: string | null
  proposed_rent: number | null
  proposed_term_months: number | null
  break_clause_months: number | null
  management_fee_included: boolean | null
  bills_included: boolean | null
  notes: string | null
  status: "draft" | "sent" | "accepted" | "rejected" | "negotiating" | "expired"
  sent_at: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── KV pair ───────────────────────────────────────────────────────────────────

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-[11px] text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-[11px] font-semibold text-slate-800 text-right">{value}</span>
    </div>
  )
}

// ── Status chip ───────────────────────────────────────────────────────────────

type ChipVariant = "emerald" | "blue" | "amber" | "slate" | "red"

const CHIP_CLASSES: Record<ChipVariant, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-[var(--color-brand-100)] text-[var(--brand)]",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-slate-100 text-slate-600",
  red: "bg-red-100 text-red-700",
}

const STATUS_VARIANT: Record<PlanningLandlordOffer["status"], ChipVariant> = {
  draft: "slate",
  sent: "blue",
  negotiating: "amber",
  accepted: "emerald",
  rejected: "red",
  expired: "red",
}

function StatusChip({ status }: { status: PlanningLandlordOffer["status"] }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${CHIP_CLASSES[STATUS_VARIANT[status]]}`}>
      {status}
    </span>
  )
}

function fmtMoney(n: number | null): string {
  return n != null ? `£${n.toLocaleString("en-GB")}` : "—"
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandlordOfferPage() {
  const params = useParams()
  const id = params.id as string

  const [offers, setOffers] = useState<PlanningLandlordOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      setError(null)
      // Real table: planning_landlord_offers (set-scoped via planning_set_id).
      const { data, error: err } = await supabase
        .from("planning_landlord_offers")
        .select("*")
        .eq("planning_set_id", id)
        .order("created_at", { ascending: false })
      setOffers(err ? [] : ((data ?? []) as PlanningLandlordOffer[]))
      setLoading(false)
    }
    load()
  }, [id])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-slate-700 font-semibold">{error}</div>
        <Link href="/property-manager/planning/sets" className="text-sm text-[#7C3AED] hover:underline">Back to planning sets</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900">Landlord Offer</h2>
          <p className="text-xs text-slate-500 mt-0.5">Proposed rent and deal terms for this planning set.</p>
        </div>
        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          New offer
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : offers.length === 0 ? (
        /* ── Honest empty state ── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Handshake className="w-6 h-6 text-slate-400" />
          </div>
          <div className="text-sm font-semibold text-slate-700">No landlord offers yet</div>
          <p className="text-xs text-slate-400 max-w-sm">
            Draft a proposed rent and lease terms to send to the landlord. Offers you create will appear here with their negotiation status.
          </p>
          <button className="mt-1 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            New offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {offers.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{o.property_address ?? "Landlord offer"}</div>
                  <div className="text-[10px] text-slate-400">
                    Created {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <StatusChip status={o.status} />
              </div>
              <div className="flex flex-col gap-1.5">
                <KV label="Proposed rent (pcm)" value={fmtMoney(o.proposed_rent)} />
                <KV label="Term" value={o.proposed_term_months != null ? `${o.proposed_term_months} months` : "—"} />
                <KV label="Break clause" value={o.break_clause_months != null ? `Month ${o.break_clause_months}` : "—"} />
                <KV label="Management fee included" value={o.management_fee_included ? "Yes" : "No"} />
                <KV label="Bills included" value={o.bills_included ? "Yes" : "No"} />
                {o.sent_at && (
                  <KV label="Sent" value={new Date(o.sent_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
                )}
                {o.responded_at && (
                  <KV label="Responded" value={new Date(o.responded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
                )}
              </div>
              {o.notes && (
                <p className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-100 pt-2">{o.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
