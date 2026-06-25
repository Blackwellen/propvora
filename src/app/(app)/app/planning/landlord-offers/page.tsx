"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Handshake,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Search,
  LayoutGrid,
  Table2,
  Plus,
  Eye,
  Trash2,
} from "lucide-react"
import { PlanningPageShell } from "@/components/planning/PlanningPageShell"
import { KpiCard } from "@/components/planning/shared"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { useWorkspace } from "@/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import type { PlanningLandlordOffer, LandlordOfferStatus } from "@/types/database"
import { cn } from "@/lib/utils"

// ─── Stage config ─────────────────────────────────────────────────────────────

// DB enum: draft | sent | accepted | rejected | negotiating | expired
const STAGES: LandlordOfferStatus[] = ["draft", "sent", "negotiating", "accepted", "rejected", "expired"]

const STAGE_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  negotiating: "Negotiating",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
}

const STAGE_COLOURS: Record<string, string> = {
  draft: "#94A3B8",
  sent: "#7C3AED",
  negotiating: "#F97316",
  accepted: "#10B981",
  rejected: "#EF4444",
  expired: "#64748B",
}

function money(n: number): string {
  return `£${Math.round(n).toLocaleString()}`
}

function initials(s: string): string {
  return s.split(/[\s,]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "—"
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandlordOffersPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()

  const [offers, setOffers] = useState<PlanningLandlordOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"board" | "table">("board")
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  async function loadOffers() {
    if (!workspace?.id) return
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("planning_landlord_offers")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
    if (error) { setOffers([]); setLoading(false); return } // 42P01 / RLS tolerant
    setOffers((data ?? []) as PlanningLandlordOffer[])
    setLoading(false)
  }

  useEffect(() => { void loadOffers()   }, [workspace?.id])

  async function deleteOffer(id: string) {
    if (!workspace?.id) return
    const supabase = createClient()
    try {
      const { error } = await supabase.from("planning_landlord_offers").delete().eq("id", id).eq("workspace_id", workspace.id)
      if (error && error.code !== "42P01") throw error
      setOffers((prev) => prev.filter((o) => o.id !== id))
      showToast("Offer deleted")
    } catch {
      showToast("Could not delete offer")
    }
  }

  const filtered = useMemo(() => {
    return offers.filter((o) => {
      const matchSearch = !search || o.property_address.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [offers, search, statusFilter])

  // Live KPIs
  const total = offers.length
  const accepted = offers.filter((o) => o.status === "accepted").length
  const pending = offers.filter((o) => o.status === "sent" || o.status === "negotiating").length
  const negotiating = offers.filter((o) => o.status === "negotiating").length
  const rentVals = offers.filter((o) => o.proposed_rent > 0)
  const avgOffer = rentVals.length ? Math.round(rentVals.reduce((a, o) => a + o.proposed_rent, 0) / rentVals.length) : 0

  const actions = (
    <Link
      href="/property-manager/planning/landlord-offers/new"
      className="h-9 px-4 rounded-xl bg-[#7C3AED] text-white text-[12.5px] font-semibold hover:bg-violet-700 flex items-center gap-1.5 transition-colors"
    >
      <Plus className="w-4 h-4" />
      New Offer
    </Link>
  )

  function offerMenu(offer: PlanningLandlordOffer) {
    return (
      <ConfirmDialog
        title="Delete offer?"
        description={`Remove the offer for ${offer.property_address}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={async () => deleteOffer(offer.id)}
      >
        {(open) => (
          <ActionMenu
            items={[
              { label: "View / Edit", icon: Eye, onClick: () => router.push(`/property-manager/planning/landlord-offers/${offer.id}`) },
              { label: "Delete", icon: Trash2, onClick: open, variant: "danger" },
            ]}
          />
        )}
      </ConfirmDialog>
    )
  }

  return (
    <PlanningPageShell
      title="Landlord Offers"
      subtitle="Negotiation and offer records for your planning opportunities."
      actions={actions}
    >
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Cards — live */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total Offers" value={loading ? "—" : String(total)} icon={Handshake} iconColour="#7C3AED" />
        <KpiCard label="Accepted" value={loading ? "—" : String(accepted)} subtitle={total > 0 ? `${Math.round((accepted / total) * 100)}%` : undefined} icon={CheckCircle2} iconColour="#10B981" />
        <KpiCard label="Pending Response" value={loading ? "—" : String(pending)} icon={Clock} iconColour="#F59E0B" />
        <KpiCard label="Negotiating" value={loading ? "—" : String(negotiating)} icon={AlertTriangle} iconColour="#F97316" />
        <KpiCard label="Avg Offer Amount" value={loading ? "—" : avgOffer > 0 ? `${money(avgOffer)}/mo` : "—"} icon={TrendingUp} iconColour="#2563EB" />
      </div>

      {/* Filters + view toggle */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by property address..."
            className="h-9 w-72 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
        >
          <option value="all">All statuses</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl ml-auto">
          <button
            onClick={() => setViewMode("board")}
            className={cn("px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all", viewMode === "board" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700")}
          >
            <LayoutGrid className="w-4 h-4 inline mr-1" />Board
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn("px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all", viewMode === "table" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700")}
          >
            <Table2 className="w-4 h-4 inline mr-1" />Table
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-[13px] text-slate-400">Loading offers…</div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-violet-50 flex items-center justify-center">
            <Handshake className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-[14px] font-semibold text-slate-700">No landlord offers yet</p>
          <p className="text-[12.5px] text-slate-400 mt-1 max-w-sm mx-auto">
            Create an offer to propose guaranteed rent or management terms to a landlord, linked to one of your planning sets.
          </p>
          <Link href="/property-manager/planning/landlord-offers/new" className="inline-flex items-center gap-2 mt-4 h-9 px-5 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors">
            <Plus className="w-4 h-4" /> New Offer
          </Link>
        </div>
      ) : viewMode === "board" ? (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 min-w-[720px]">
            {STAGES.map((stage) => {
              const cards = filtered.filter((o) => o.status === stage)
              const colour = STAGE_COLOURS[stage]
              return (
                <div key={stage} className="min-w-[180px]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colour }} />
                    <p className="text-[12.5px] font-bold text-slate-700">{STAGE_LABELS[stage]}</p>
                    <span className="ml-auto text-[11px] font-bold text-slate-400">{cards.length}</span>
                  </div>
                  <div className="space-y-3">
                    {cards.map((offer) => (
                      <div
                        key={offer.id}
                        onClick={() => router.push(`/property-manager/planning/landlord-offers/${offer.id}`)}
                        className="bg-white rounded-2xl border border-slate-200 p-4 cursor-pointer transition-all hover:shadow-md hover:border-slate-300"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div style={{ background: colour + "22", color: colour }} className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">
                            {initials(offer.property_address)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-bold text-slate-800 truncate">{offer.property_address}</p>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>{offerMenu(offer)}</div>
                        </div>
                        <p className="text-[14px] font-bold text-slate-900 mt-1">{money(offer.proposed_rent)}/mo</p>
                        <p className="text-[10.5px] text-slate-400 mt-1">
                          {offer.proposed_term_months ? `Term: ${offer.proposed_term_months}mo` : "No term set"}
                          {offer.break_clause_months ? ` · Break: Mo ${offer.break_clause_months}` : ""}
                        </p>
                        <div className="mt-3 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: colour }} />
                          <span className="text-[10.5px] font-semibold" style={{ color: colour }}>{STAGE_LABELS[stage]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Property", "Status", "Proposed Rent", "Term", "Break", "Bills Incl.", ""].map((h) => (
                    <th key={h} className="text-left text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((offer) => (
                  <tr
                    key={offer.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/property-manager/planning/landlord-offers/${offer.id}`)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div style={{ background: STAGE_COLOURS[offer.status] + "22", color: STAGE_COLOURS[offer.status] }} className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">
                          {initials(offer.property_address)}
                        </div>
                        <p className="text-[13px] font-semibold text-slate-800">{offer.property_address}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: STAGE_COLOURS[offer.status] }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: STAGE_COLOURS[offer.status] }} />
                        {STAGE_LABELS[offer.status] ?? offer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-bold text-slate-900">{money(offer.proposed_rent)}/mo</td>
                    <td className="px-4 py-3.5 text-[12.5px] text-slate-600">{offer.proposed_term_months ? `${offer.proposed_term_months}mo` : "—"}</td>
                    <td className="px-4 py-3.5 text-[12.5px] text-slate-600">{offer.break_clause_months ? `Mo ${offer.break_clause_months}` : "—"}</td>
                    <td className="px-4 py-3.5 text-[12.5px] text-slate-600">{offer.bills_included ? "Yes" : "No"}</td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>{offerMenu(offer)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[12.5px] text-slate-400">No offers match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PlanningPageShell>
  )
}
